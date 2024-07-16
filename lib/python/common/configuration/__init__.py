# This should be considered a low-level module. Careful consideration should be given
# before introducing dependencies on other application modules. Here we setup aspects around
# maintaining parameter values locally versus deployed.

import ast
import logging
from typing import List, Dict
import os

import boto3

APP = os.environ['APP']
ENV = os.environ['ENV']
IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'

logger = logging.getLogger(f"{APP}.{__name__}")
logger.setLevel('INFO')

PARAMETERS_LAMBDA = f'{APP}-manage-parameters-lambda-{ENV}'
LOCAL_SSM_FILE = '../.ssm.local'

if IS_DEPLOYED:
    ssm_client = boto3.client('ssm')
    lambda_client = boto3.client('lambda')
else:
    lambda_client = boto3.client('lambda', endpoint_url='http://localhost:3002')


def _get_parameters_from_file(filename: str = LOCAL_SSM_FILE) -> List[Dict]:
    """Mimic SSM but retrieve from file."""

    f = open(filename, 'r')

    # Mimic SSM response format
    return [{'Name': line.split('=')[0], 'Value': line.split('=')[1].strip('\n').strip('')}
            for line in f.readlines()]


def _get_parameters_from_ssm() -> List[Dict]:
    """Remote call to AWS."""

    parameters = []
    paginator = ssm_client.get_paginator('get_parameters_by_path')
    response_iterator = paginator.paginate(
        Path=f'/{APP}/{ENV}',
        Recursive=True,
        WithDecryption=True
    )
    for response in response_iterator:
        parameters += response['Parameters']

    logger.info(f"{len(parameters)} parameters retrieved from AWS Parameter Store for stage {ENV}.")

    return [{'Name': p['Name'], 'Value': p['Value']} for p in parameters]  # Just keep name/value for each


# Set appropriate function to be used by manage parameters Lambda

if IS_DEPLOYED:
    get_params_func = _get_parameters_from_ssm
else:
    get_params_func = _get_parameters_from_file


def get_parameters(names: List[str]) -> Dict:
    """
    App-facing function for retrieving parameters based on canonical naming convention. Invokes
    the Lambda responsible for centrally managing parameters, which in turn executes local versus
    deployed private functions above retrieving parameters from file or Parameter Store,
    respectively.
    """

    response = lambda_client.invoke(
        FunctionName=PARAMETERS_LAMBDA,
        InvocationType='RequestResponse'
    )

    payload = ast.literal_eval(response['Payload'].read().decode('utf-8'))  # To list
    # Just keep last part of var name (name itself) along with value
    params = {param['Name'].split('/')[3]: param['Value'] for param in payload}
    # TODO: check for error message response and throw exception

    return {k: v for k, v in params.items() if k in names}  # Return only those requested
