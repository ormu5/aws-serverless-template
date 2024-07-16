import base64
import json
from typing import Dict, Optional, List, Tuple, Union
import os

import boto3

IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'
if IS_DEPLOYED:
    lambda_client = boto3.client('lambda')
else:
    lambda_client = boto3.client('lambda', endpoint_url='http://localhost:3002')


def invoke_lambda(lambda_name: str, payload: Dict, client_context: Optional[Dict] = None,
                  short_lambda_name: bool = False, asynchronous_invocation: bool = True) -> Dict:
    """
    Asynchronously invoke the lambda
    :param lambda_name: can be name or ARN
    :param payload: dictionary
    :param client_context: dictionary
    :param short_lambda_name: bool whether to add app + env
    :param asynchronous_invocation: default to asynchronous
    :return: invocation status code (not the lambda response payload)
    """

    if short_lambda_name:
        lambda_name = f'{os.environ["SERVICE"]}-{lambda_name}-{os.environ["ENV"]}'  # Assumes within same service
    context_bytes = b"{}"
    if client_context:
        context_bytes = json.dumps(client_context).encode('utf-8')
    if asynchronous_invocation:
        invocation_type = 'Event'  # async
    else:
        invocation_type = 'RequestResponse'  # sync
    lambda_context = base64.b64encode(context_bytes).decode('utf-8')

    return lambda_client.invoke(
        FunctionName=lambda_name,
        InvocationType=invocation_type,
        ClientContext=lambda_context,
        Payload=json.dumps(payload).encode('utf-8')  # bytes
    )


def invoke_http_lambda_sync(lambda_short_name: str, path: Dict, request_path: str = None,
                            raw_response_body: bool = False) -> Union[str, Tuple[Union[Dict, List[Dict]], Dict]]:
    """
    At times we may want to leverage business logic in http Lambdas (i.e., those Lambdas initially
    configured to serve incoming requests from API Gateway) by invoking them directly from other
    Lambdas. This function facilitates the normalization of requests to http Lambdas whose functionality
    is defined as features.

    :lambda_short_name:
    :path: Path parameters typically populated by API Gateway, contains components that control which feature is
        to be executed in the target Lambda. We mimic them as part of the Lambda invocation. These components and
        their values should generally be considered custom per target Lambda.
    :request_path: Some Lambdas leverage requestPath to build a feature key, so send that, as well.
    :raw_response_body: Optionally bypass JSON processing, but not by default.
    """

    if request_path is None:
        request_path = {}
    else:
        request_path = request_path

    lambda_request_payload = {
        'path': path,  # Control which feature is executed
        # Other fields expected by http Lambda parsing
        'requestPath': request_path,
        'query': {},
        'rawResponseBody': True
    }

    # Synchronously invoke
    response = invoke_lambda(
        lambda_name=lambda_short_name, payload=lambda_request_payload, short_lambda_name=True,
        asynchronous_invocation=False
    )

    if raw_response_body is True:  # Just the string
        result = response['Payload'].read().decode('unicode-escape').strip('\"')
        return result
    else:
        body: str = json.loads(response['Payload'].read())['body']
        # Depending on endpoint, multiple (List) or single (Dict) record
        records: Union[Dict, List[Dict]] = json.loads(body)['data']
        return records, json.loads(body)['meta']  # Payload (and metadata in case it's wanted)
