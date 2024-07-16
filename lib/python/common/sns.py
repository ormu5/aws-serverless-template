"""
Logic for interacting with AWS SNS.
"""
import functools
import json
import logging
import os
from dataclasses import dataclass
from enum import Enum
from json import JSONDecodeError
from numbers import Number
from typing import Dict, Callable, Optional, Union, ClassVar, Tuple

import boto3

from common.configuration import get_parameters
from common.logging_ import get_logger

logger = get_logger(__name__)

# TODO: may pull these out into local conf file
LOCAL_SNS_PORT = 4002
OFFLINE_ENDPOINT_URL = f'http://localhost:{LOCAL_SNS_PORT}'
OFFLINE_ACCESS_KEY_ID = 'test'
OFFLINE_SECRET_ACCESS_KEY = 'test'
OFFLINE_ACCOUNT_ID = '123456789012'

REGION = os.environ['AWS_REGION']
ENV = os.environ['ENV']
APP = os.environ['APP']

IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'
if IS_DEPLOYED:
    sns_client = boto3.client('sns')
    ACCOUNT_ID = get_parameters(['account-id'])['account-id']
else:
    ACCOUNT_ID = OFFLINE_ACCOUNT_ID
    sns_client = boto3.client('sns',
                              endpoint_url=OFFLINE_ENDPOINT_URL,
                              aws_access_key_id=OFFLINE_ACCESS_KEY_ID,
                              aws_secret_access_key=OFFLINE_SECRET_ACCESS_KEY)
    # We may or may not be running local SNS simulator, let's check
    import socket

    socket_ = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    local_sns_is_ready = socket_.connect_ex(('127.0.0.1', LOCAL_SNS_PORT)) == 0
    logger.debug(f"Running in non deployed mode, using SNS local configuration (SNS "
                 f"{'NOT ' if not local_sns_is_ready else ''}detected running on port {LOCAL_SNS_PORT}).")


def local_check(func):
    """
    Check to see if app is running locally and whether local SNS is available. If it is, don't
    stand in the way of executing wrapped function; if not, politely skip.
    """

    @functools.wraps(func)
    def wrapper_decorator(*args, **kwargs) -> Union[Callable, Dict]:
        # Check if running locally without SNS support
        if os.environ['IS_DEPLOYED'].lower() == 'false' and not local_sns_is_ready:
            message = "Skipping SNS functionality as app is running locally without SNS support..."
            logger.debug(message)
            return {'message': message}
        else:  # Assume all is well
            return func(*args, **kwargs)

    return wrapper_decorator


def is_sns_event(event: Dict):
    try:
        return event['Records'][0]['EventSource'] == 'aws:sns'
    except (KeyError, IndexError):
        return False


def build_topic_arn_from_name(topic_name: str) -> str:
    """Expects full name of topic, assembles and returns corresponding topic ARN."""

    return f"arn:aws:sns:{REGION}:{ACCOUNT_ID}:{topic_name}"


# Objects comprising Custom operational alerts

class AlertDomain(Enum):
    """Allowable values for SNS alert domains."""

    DATABASE: str = 'DATABASE'
    DATA: str = 'DATA'
    SQS: str = 'SQS'
    LAMBDA: str = 'LAMBDA'
    GLUE: str = 'GLUE'
    S3: str = 'S3'
    NOT_SET: str = 'NOT_SET'


class AlertProducer(Enum):
    """Allowable values for SNS alert producers."""

    LAMBDA: str = 'LAMBDA'
    CLOUDWATCH: str = 'CLOUDWATCH'
    NOT_SET: str = 'NOT_SET'


class AlertSeverity(Enum):
    """Allowable values for SNS alert severity."""

    WARNING: str = 'WARNING'
    ERROR: str = 'ERROR'
    CRITICAL: str = 'CRITICAL'
    NOT_SET: str = 'NOT_SET'


@dataclass
class CustomAlert:
    """Canonical Custom alert published to operational alerts topic."""

    ALERTS_TOPIC_SHORT_NAME: ClassVar[str] = 'operational-alerts-topic'  # Short name
    VERSION: ClassVar[str] = '1'

    domain: AlertDomain
    producer: AlertProducer
    severity: AlertSeverity
    message: Optional[str] = None  # Details
    context: Optional[str] = None  # Brief

    @property
    def sns_message_attributes(self) -> Dict:
        """SNS message attributes represented by the alert."""

        return {
            'DOMAIN': {'StringValue': self.domain.value, 'DataType': 'String'},
            'PRODUCER': {'StringValue': self.producer.value, 'DataType': 'String'},
            'SEVERITY': {'StringValue': self.severity.value, 'DataType': 'String'}
        }

    @property
    def sns_subject_line(self) -> str:
        """SNS subject line / descriptor, limited by AWS to 100 chars."""

        return f"{APP.upper()} {ENV.upper()} {self.severity.value} Notification: {self.domain.value} ({self.context})"[:100]

    def publish(self) -> None:
        """Publish to operational alerts topic."""

        publish_sns_message(
            self.ALERTS_TOPIC_SHORT_NAME, self.message, message_attributes=self.sns_message_attributes,
            short_topic_name=True, subject=self.sns_subject_line
        )


# Classes and functions supporting alert-enabled logging by lambdas

class AlertLogFilter(logging.Filter):
    """
    Inject custom fields into LogRecord object for use by handler emitter.
    """

    def __init__(self, alert_domain: AlertDomain = AlertDomain.NOT_SET, context: str = None):
        super(AlertLogFilter, self).__init__()
        self.alert_domain = alert_domain
        self.context = context

    def filter(self, record):
        record.alert_domain = self.alert_domain
        record.context = self.context

        return True


class AlertLogHandler(logging.Handler):
    """Python logging handler for publishing to SNS alerts topic."""

    ALERTS_TOPIC_SHORT_NAME: ClassVar[str] = 'operational-alerts-topic'
    PRODUCER: ClassVar[AlertProducer] = AlertProducer['LAMBDA']  # If this module is being imported, assume it's lambda
    VERSION: ClassVar[str] = '1'

    def __init__(self, level: int = logging.WARNING):
        """Where 'level' determines threshold for log entry being pushed to SNS alert topic."""
        super(AlertLogHandler, self).__init__()
        self.setLevel(level)

    def emit(self, record: logging.LogRecord) -> None:
        """Create CustomAlert object from log aspects and publish to operational alerts topic."""

        alert = CustomAlert(record.alert_domain, self.PRODUCER, AlertSeverity[record.levelname],
                            message=record.getMessage(), context=record.context)
        alert.publish()


def get_alert_enabled_logger(name: str, alert_domain: AlertDomain, context: str = None,
                             level: int = logging.WARNING) -> logging.Logger:
    """
    Leverage common get_logger() with added layer of SNS alerting.

    :param name: logger name, often __name__ of caller
    :param alert_domain: area of concern, just be valid AlertDomain
    :param context: additional information to be included with the alert
    :param level: log level at which the alert to SNS topic is triggered, default to WARNING
    """

    logger = get_logger(name)
    logger.addHandler(AlertLogHandler(level))
    # Setup custom fields via logger adapter, to be used in handler emit
    logger.addFilter(AlertLogFilter(alert_domain, context))

    return logger


# Core SNS functionality

def sns_event_handler(func: Callable) -> Callable:
    """
    Decorator function to handle event from SNS: parse records in each event, for each
    record pass message payload and metadata to calling function. Bypass this wrapping by
    executing your_function as `your_function.__unwrapped()`.
    """

    def _process_record(sns_record: Dict) -> None:
        """
        Return SNS message and metadata found in this record.
        """

        logger.debug(f'Processing record: {sns_record}')
        # TODO: error handling (DLQ, etc.) if this is to be used in production.
        # TODO: very opinionated right now in that this will always be JSON
        message_body: str = sns_record['Sns']['Message']  # Parsers expect string, so don't json.loads
        # Parse message attributes directly to k:v string pairs before passing along
        message_attributes: Dict = {k: v['Value'] for k, v in sns_record['Sns']['MessageAttributes'].items()}
        func(message_body, sns_record.copy(), message_attributes=message_attributes)

    @functools.wraps(func)
    def wrapped(event: Dict, context):
        logger.debug(f"New SNS event received with {len(event['Records'])} record(s).")
        for sns_record in event['Records']:
            _process_record(sns_record)

    # Accommodate things like unit testing. Bypass this decorator's functionality
    # by invoking your function directly as your_function.__unwrapped().
    wrapped.__unwrapped = func

    return wrapped


def sns_message_parser(func: Callable) -> Callable:
    """
    Decorator function generally intended for SNS message_body parsing leading into a Lambda.
    """

    @functools.wraps(func)
    def wrapped(record_body: str, *args, **kwargs) -> Optional[Tuple[None, Dict]]:
        """Expects a valid SNS message_body string, otherwise does nothing."""

        try:
            record_dict = json.loads(record_body)
        except JSONDecodeError:
            logger.warning(f"Failed top-level parsing, throwing this message_body away: {record_body}")
            return

        # Could also perform this check at event level
        if record_dict.get('Message') is None and record_dict.get('Type') != 'Notification':
            logger.debug(f"Payload does not appear to be that of SNS, skipping this record_body: {record_dict}....")
            return

        sns_payload = record_dict['Message']
        logger.debug(f"Parsed payload: {sns_payload}")
        func(sns_payload, *args, **kwargs)  # # Call function with message body

        return None, {'parsed': True}

    return wrapped


@local_check
def publish_sns_message(topic_name: str, message: str, message_attributes: Optional[Dict] = None,
                        short_topic_name: Optional[bool] = False, subject: Optional[str] = None) -> Optional[Dict]:
    """
    Wrapper for boto publish message method.

    :topic_name str: Name of queue to publish to.
    :message str: Payload.
    :message_attributes dict: SNS message attributes as key/value pairs. This function will format to
        structure expected by SNS.
    :short_topic_name bool: Whether the topic name passed was the short version, without app or stage name, in which
        case this function will assemble the full name based on the runtime environment.
    """

    def _build_message_attributes(message_attributes: Union[Dict, None]) -> Dict:
        """
        Expects dict in the form of {'<attribute name>': <attribute value>}, translates
        to format expected by SNS including type coercion. Values for DataType not currently
        detected/supported: Sring.Array and Binary.
        """

        if message_attributes is None:
            return {}

        return {k: {
            'DataType': 'String' if not isinstance(v, Number) else 'Number',
            'StringValue': str(v)
        } for k, v in message_attributes.items()}

    if short_topic_name:
        topic_name = f"{APP}-{topic_name}-{ENV}"
    topic_arn = build_topic_arn_from_name(topic_name)

    message_attributes = _build_message_attributes(message_attributes)
    logger.debug(f"Publishing message to topic ARN {topic_arn} with message attributes {message_attributes}: "
                 f"{message}.")

    response = sns_client.publish(
        TopicArn=topic_arn,
        Message=message,  # NB: serverless-offline-sns requires default key if message structure = 'json'
        Subject=f"{subject if not None else ''}",
        MessageStructure='string',
        MessageAttributes=message_attributes,
    )
    return response
