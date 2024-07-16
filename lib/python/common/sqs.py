"""
Logic for interacting with AWS SQS.
"""
import functools
import json
import os
import traceback
from json import JSONDecodeError
from typing import Dict, Callable, Optional, Tuple

import boto3

from common.logging_ import get_logger

logger = get_logger(__name__)

# TODO: may pull these out into local conf file
OFFLINE_ENDPOINT_URL = 'http://localhost:9324'
OFFLINE_ACCESS_KEY_ID = 'root'
OFFLINE_SECRET_ACCESS_KEY = 'root'

IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'
if IS_DEPLOYED:
    # At time of writing, boto3 uses legacy endpoint http://queue.amazonaws.com by default, which works
    # fine via NAT gateway but not when VPC endpoint is used (more specifically, not when private DNS is
    # used). Modern region-based endpoint works for both.
    sqs_client = boto3.client('sqs', endpoint_url=f'https://sqs.{os.environ["AWS_REGION"]}.amazonaws.com')
else:
    # TODO: centralize these params
    logger.debug("Running in non deployed mode, using sqs local configuration.")
    sqs_client = boto3.client('sqs', endpoint_url=OFFLINE_ENDPOINT_URL, aws_access_key_id=OFFLINE_ACCESS_KEY_ID,
                              aws_secret_access_key=OFFLINE_SECRET_ACCESS_KEY)


def send_sqs_message(queue_name: str, message: Dict, message_attributes: Optional[Dict] = None,
                     short_queue_name: bool = False) -> Optional[Dict]:
    """
    Wrapper for sending message to SQS queue. Message does not technically need to
    be a Dict but initially assuming it is (i.e., JSON represented as Dict). All payloads
    currently converted to JSON.

    :queue_name str: Name of queue to send to.
    :message dict: Payload.
    :message_attributes dict: SQS message attributes.
    :short_queue_name bool: Whether the queue name passed was the short version, without app or stage name, in which
        case this function will assemble the full name based on the runtime environment.
    """

    if short_queue_name:
        queue_name = f"{os.environ['APP']}-{queue_name}-{os.environ['ENV']}"

    response = sqs_client.get_queue_url(
        QueueName=queue_name
        # QueueOwnerAWSAccountId='string'
    )
    queue_url = response['QueueUrl']
    logger.debug(f"Sending message to queue URL {queue_url}.")

    message_json = json.dumps(message, default=lambda o: o.__str__())
    message_attributes = message_attributes if message_attributes is not None else dict()

    response = sqs_client.send_message(
        QueueUrl=queue_url,
        MessageBody=message_json,
        # DelaySeconds=123,
        MessageAttributes=message_attributes,
        # MessageSystemAttributes={  # only supported message system attribute is AWSTraceHeader
        #     'string': {
        #         'StringValue': 'string',
        #         'BinaryValue': b'bytes',
        #         'StringListValues': [
        #             'string',
        #         ],
        #         'BinaryListValues': [
        #             b'bytes',
        #         ],
        #         'DataType': 'string'
        #     }
        # },
        # MessageDeduplicationId='string',
        # MessageGroupId='string'
    )

    return response


def get_associated_dlq_name(operational_queue_arn: str) -> str:
    """
    RELIES ENTIRELY on consistent naming convention. Initially looked into leveraging
    CloudFormation references/functions to populate Lambda environment variable but such
    references are not supported when running locally. Another option would be SSM which
    is emulated locally.

    Returns DLQ associated with the operational queue whose name was passed.
    """

    if '-dlq-' in operational_queue_arn:
        raise ValueError(f"{operational_queue_arn} is itself a dead-letter queue!")

    return operational_queue_arn.split(':')[-1].replace('-queue-', '-dlq-queue-')


def sqs_event_handler(func: Callable) -> Callable:
    """
    Decorator function to handle event from SQS: parse records in each event, for each
    record pass message payload and metadata to calling function. Bypass this wrapping by
    executing your_function as `your_function.__unwrapped()`.
    """

    def _process_record(sqs_record: Dict) -> None:
        """
        Return SQS message and metadata found in this record. Only valid JSON currently allowed.
        Other errors involve sending message to dead-letter queue associated with the operational queue.
        """

        logger.debug(f"Processing record received from {sqs_record['eventSourceARN']}")
        # Parser decorator should/can sit here to intercept record body and parse
        # etc. into payload prior to passing to lambda function
        # Parse message attributes directly to k:v string pairs before passing along
        # 'binaryValue' is also supported by boto3/SQS, add below if ever implemented
        message_attributes: Dict = {k: v['stringValue'] for k, v in sqs_record['messageAttributes'].items()}
        try:
            func(sqs_record['body'], sqs_record.copy(), message_attributes=message_attributes)
        except Exception as e:
            dlq_name = get_associated_dlq_name(sqs_record['eventSourceARN'])
            logger.error(f"Problem processing message: {str(e)}\n{traceback.format_exc()}\n"
                         f"Sending offending message to DLQ {dlq_name}: {sqs_record['body']}")
            sqs_record['messageErrors'] = json.dumps((str(e), traceback.format_exc()))
            send_sqs_message(dlq_name, sqs_record)

        return

    @functools.wraps(func)
    def wrapped(event: Dict, context):
        logger.debug(f"New SQS event received with {len(event['Records'])} record(s) : {event}")
        for sqs_record in event['Records']:  # Generally expect 1 record per event
            _process_record(sqs_record)

        return {'statusCode': 200}

    # Accommodate things like unit testing. Bypass this decorator's functionality
    # by invoking your function directly as your_function.__unwrapped().
    wrapped.__unwrapped = func

    return wrapped


def sqs_message_parser(func: Callable) -> Callable:
    """Decorator function generally intended for SQS message parsing leading into a Lambda."""

    @functools.wraps(func)
    def wrapped(record_body: str, *args, **kwargs) -> Optional[Tuple[None, Dict]]:
        """Expects a valid SQS message string, otherwise does nothing."""

        try:
            record_dict = json.loads(record_body)
        except JSONDecodeError:
            logger.warning(f"Failed top-level parsing, throwing this record body away: {record_body}")
            return

        # Could also perform this check at event level, only other message we are checking for now are SNS messages
        if record_dict.get('Message') is not None and record_dict.get('Type') == 'Notification':
            logger.debug(f"Payload does not appear to be that of SQS, skipping this record_body: {record_dict}....")
            return

        logger.debug(f"Parsed payload: {record_body}")
        func(record_body, *args, **kwargs)  # Call function with record body, which is SQS payload

        return None, {'parsed': True}

    return wrapped
