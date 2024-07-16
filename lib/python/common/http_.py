import functools
import importlib
import json
import traceback
from typing import Callable, Dict, List, Union
from urllib.parse import unquote

import humps

from common.logging_ import get_logger
from common.sqs import send_sqs_message

# from ..common.http_write.handler import send_event, STEP_ARN, sf_client
# HTTP_WRITE_POLLING_INTERVAL_SECONDS = 0.5

logger = get_logger(__name__)

default_lambda_response = {
    'isBase64Encoded': False,
    'statusCode': 200,
    'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': True
    },
    'body': 'Default response.'
}

QUERYSTRING_DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
ENABLED_FEATURES = 'enabled_features'  # Aligns with name of feature mapping Dict in each feature module


def build_lambda_response_body(records: List, metadata: Union[Dict, None] = None) -> Dict:
    """The payload of the lambda response. May do something interesting with 'meta' but blank for now."""
    metadata = dict() if metadata is None else metadata
    return {'meta': metadata, 'data': records}


def http_event_handler(_func=None, *, raw_response_body: bool = False) -> Callable:
    """
    Decorator factory with optional arguments
    :param _func: allows decorator to be called like @http_event_handler or @http_event_handler(raw_response_body=True)
    :param raw_response_body: optionally bypass camel-casing, any other formatting in body of response
    """

    def decorator(func) -> Callable:
        """Decorator function for lambdas handling http events."""

        @functools.wraps(func)
        def wrapper(event: Dict, context) -> Dict:
            """
            Wrap http-based calls to lambdas...
                - prep/casting of values in event dict
                - issue call to lambda
                - bundle lambda response and/or handle errors
                - raise exception in case of error, for now all are mapped as internal server errors (500) in API Gateway

            :param event:
            :param context:
            :return:
            """

            logger.debug(f"New event received: {event}")

            response = default_lambda_response.copy()
            # unencode event path params
            event['path'] = {k: unquote(v) for k, v in event['path'].items()}
            event['query'] = {k: unquote(v) for k, v in event['query'].items()}
            metadata = dict()
            try:
                value = func(event.copy(), context)
                if isinstance(value, tuple):  # returning multiple arguments, second assumed to be metadata dict
                    result, metadata = value
                    metadata = {humps.camelize(key): value for key, value in metadata.items()}
                else:
                    result = value
            # Pertinent exceptions being raised: HTTPError, InvalidHeader
            except Exception as e:
                error_message = getattr(e, 'error_message', '[InternalServerError]')
                logger.error(f"{traceback.format_exc()}".replace('\n', ' | '))
                logger.info(f"Problematic event: {event}")
                # Will be returned in 'errorMessage' object per framework handling by Lambda,
                # which is subsequently mapped to method response in API Gateway. May extend
                # this response in the future.
                request_id = context.aws_request_id  # get from context object
                # Enumeration of error_message will have to be mapped in API Gateway status codes,
                # can consider later supporting additional user-appropriate detail for each to also include
                # in response alongside 'reference'.
                error = {'message': error_message, 'reference': request_id}
                raise Exception(f"{json.dumps(error)}")

            # Support raw response body for cases where param is passed directly to this function as True
            # or as field in Lambda event (during Lambda invocation) with value of True
            if raw_response_body or event.get('rawResponseBody', None):
                return result
            elif isinstance(result, dict):  # Allow for unitary entity, full-depth camelize
                result_body = humps.camelize(result)
            else:  # Record set: camelize only the first order keys in this list of dict objects
                result_body = [{humps.camelize(key): value for key, value in item.items()} for item in result]

            response['body'] = json.dumps(build_lambda_response_body(result_body, metadata),
                                          default=lambda o: o.__str__())

            # If invoked asynchronously, send the resulting payload to the target queue
            target_queue = event.get('targetQueue')
            if target_queue:
                # Optionally - i.e., if present - propagate lamba event source field as sqs message attribute
                if 'source' in event:
                    message_attr = {'SOURCE': {'StringValue': event['source'], 'DataType': 'String'}}
                else:
                    message_attr = {}
                logger.debug(f"Asynchronous event from {message_attr} detected, sending to queue {target_queue}...")
                send_sqs_message(queue_name=target_queue,
                                 message=json.loads(response['body']),
                                 message_attributes=message_attr,
                                 short_queue_name=True)
            else:
                return response

        return wrapper

    # Allows decorator to be called without arguments
    if _func is None:
        return decorator
    else:
        return decorator(_func)


def enable_feature(key: str) -> Callable:
    """
    Registers feature in calling module by updating enabled_features in that module's namespace.
    This should be occurring infrequently - i.e., at the initialization of a lambda - so overhead
    of import is negligible. Out of deference to external namespaces, assume that if enabled_features
    is not found in its namespace that this function was erroneously called (i.e., do not add
    'enabled_features' to another namespace).
    """

    def _enable_feature(func):
        calling_module = importlib.import_module(func.__module__)
        enabled_features = getattr(calling_module, ENABLED_FEATURES)
        enabled_features[key] = func  # This will fail if enabled_features not found

        return func

    return _enable_feature


def execute_feature(enabled_features: Dict, feature_key: str, **kwargs) -> Union[List, Dict]:
    """
    Wrapper for executing a given feature, where kwargs are bound for and expected
    by feature function.
    """

    # TODO: catch error (KeyError) when feature is not enabled
    try:
        return enabled_features[feature_key](**kwargs)
    except KeyError as e:
        raise KeyError(f"Feature key {feature_key} not enabled.")

# def http_write_handler(func):
#     """
#     Used as a wrapper for HTTP write lambdas that need to send event insert/update/delete
#     messages to event queue and confirm database success prior to responding to [synchronous]
#     UI caller; i.e., for those lambdas needing to perform a database write to a table they do not own.
#     """
#
#     @functools.wraps(func)
#     def wrapper_decorator(*args, **kwargs) -> List:
#         """
#         Creates state machine and submits payload and parameters to it, subsequently monitoring for
#         successful completion. Properly formatted database record expected as event['body'],
#         event['targetQueue'] controls which SQS queue the content is sent.
#
#         See template.step.yml for mappings from event to step function parameters.
#
#         Two scenarios in local development are supported:
#         1) Step function is found running locally. In this case the step function is used to manage the
#             one-step workflow of the event into SQS. Concurrent callback from the process listening
#             to SNS topic is not currently supported, though; instead, the step function will successfully
#             complete once it sends event to SQS. The changes in step function definition to support this local
#             behavior relative to deploy can be found in dev-utils scripts.
#         2) Step function is not found running locally. In this case a "fire and forget" approach is taken where
#             this function bypasses the step function flow by issuing a send event request directly to SQS and
#             immediately returning a response to the caller.
#         """
#
#         event = func(*args, **kwargs)
#         if not IS_DEPLOYED and STEP_ARN is None:  # No step function capability in place, accommodate flow
#             logger.debug(f"Offline mode: bypassing step function http write flow.")
#             send_event(event, None)  # Mimic step function task (probably no reason to pass along args[1])
#             return [{'name': 'OFFLINE MODE'}]
#
#         # Collect and submit parameters
#         friendly_request_path = event['requestPath'].replace('/', '-').lstrip('-').format(**event['path'])
#         run_name = f"{friendly_request_path}-{event['method']}-{int(time.time() * 1000)}-{randrange(0, 1000)}"
#         kwargs = {'stateMachineArn': STEP_ARN, 'name': run_name,
#                   'input': json.dumps(event, default=lambda o: o.__str__())}
#         response = sf_client.start_execution(**kwargs)
#
#         # Use execution ARN to monitor for success
#         run_arn = response['executionArn']
#         logger.debug(f"Started run {run_arn}.")
#         while True:
#             # Will timeout after 30s if no success (both API Gateway and SF)
#             response = sf_client.describe_execution(executionArn=run_arn)
#             if response['status'] == 'SUCCEEDED':
#                 break
#             elif response['status'] == 'FAILED':
#                 raise Exception(f"Problem encountered during http write workflow.")
#             time.sleep(HTTP_WRITE_POLLING_INTERVAL_SECONDS)
#         logger.debug(f"Completed run {run_arn}.")
#
#         # Do not expose any ARNs...perhaps add responseMetadata object later
#         return [{
#             'name': response['name'],
#             'status': response['status'],
#             'startDate': response['startDate'],
#             'stopDate': response['stopDate']
#         }]
#
#     return wrapper_decorator
