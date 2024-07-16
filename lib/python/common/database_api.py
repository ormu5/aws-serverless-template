"""
Functionality related to interactions with the database via AWS Data API.

TODO: clean up this module
"""
from collections import namedtuple
from enum import Enum
from sys import getsizeof
import json
from datetime import datetime, date
import os
import logging
from typing import Dict, TypeVar, List, Union

import boto3

from common.logging_ import get_logger
from common.configuration import get_parameters
from common.sns import get_alert_enabled_logger, AlertDomain

# Setup logging with Enable/setup handler for SNS alerts
logger = get_logger(__name__)
alert_logger = get_alert_enabled_logger(__name__, AlertDomain['DATABASE'], context='Data API', level=logging.INFO)


def parse_array(field: Dict):
    """
    Return nicely formatted - albeit nested - list. Not sure if
    'stringValues' changes if, e.g., source DB column is defined as array of ints.
    """

    return next(iter(field.values()))['stringValues']


T = TypeVar('T')
TIMESTAMP_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
DATE_FORMAT = '%Y-%m-%d'
MAXIMUM_RESPONSE_SIZE_BYTES = 1500000  # Approximate Data API hard limit, conservative as measured in this code
RESPONSE_SIZE_WARNING_THRESHOLD = 0.8
MAXIMUM_PAYLOAD_SIZE_ERROR = 'more than the allowed response size limit'

SqlColumnsPair = namedtuple('SqlColumnsPair', 'sql columns')

# Set local versus deployed aspects
IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'
if IS_DEPLOYED:
    rds_client = boto3.client('rds-data')
    # TODO: may not want deploy PG role/ARN
else:
    logger.debug("Running in non deployed mode, using local DB configuration.")
    # TODO: may pull these out into local conf file, etc.
    OFFLINE_ENDPOINT_URL = 'http://localhost:8080'
    OFFLINE_ACCESS_KEY_ID = 'aaa'
    OFFLINE_SECRET_ACCESS_KEY = 'bbb'
    rds_client = boto3.client('rds-data', endpoint_url=OFFLINE_ENDPOINT_URL, aws_access_key_id=OFFLINE_ACCESS_KEY_ID,
                              aws_secret_access_key=OFFLINE_SECRET_ACCESS_KEY)

rds_config = get_parameters(['database-name', 'database-resource-arn', 'database-admin-secret-arn'])


def _build_data_api_value(value: T) -> Dict:
    """
    Helper function to construct the definition of the queried value as expected
    by AWS Data API. This is performed based by evaluating Python type. This mapping is
    not entirely exhaustive against the boto3 specification but addresses common uses cases.
    
    The following option is also part of the specification but not leveraged here as we
    will depend on the database to cast: 'typeHint': 'DATE'|'DECIMAL'|'TIME'|'TIMESTAMP'
    """

    if isinstance(value, bool):
        return {'booleanValue': value}
    elif isinstance(value, float):
        return {'doubleValue': value}
    elif isinstance(value, int):
        return {'longValue': value}
    # Data API does not natively [yet] support jsonb or arrays to postgres, so submitting arrays and JSON
    # as strings here works only if SQL insert/update is constructed appropriately casting field to each.
    elif isinstance(value, list) or isinstance(value, set):
        return {'stringValue': json.dumps(value).replace('[', '{').replace(']', '}')}  # str(value)
    elif isinstance(value, dict):
        return {'stringValue': json.dumps(value)}
    # Special keywords for handling queries for NULL
    elif (value == 'IS NULL') or (value is None):
        return {'isNull': True}
    elif value == 'IS NOT NULL':
        return {'isNull': False}
    return {'stringValue': str(value)}


def _build_data_api_parameter(name: str, value: T) -> Dict:
    """
    Helper function to build the proper structure for an item in the 'parameters' argument
    expected by the boto3 execute_statement method. 'value' can be any one of a number
    of types including a list.
    """

    parameter = {'name': name}
    if isinstance(value, datetime):  # Tend to downstream format expectations
        parameter['typeHint'] = 'TIMESTAMP'
        value = value.strftime(TIMESTAMP_FORMAT)
    elif isinstance(value, date):  # Tend to downstream format expectations
        parameter['typeHint'] = 'DATE'
        value = value.strftime(DATE_FORMAT)
    parameter['value'] = _build_data_api_value(value)

    return parameter


def _execute_statement(schema: str, sql: str, parameters: list, batch: bool, transaction_id: str = None) -> Dict:
    """Wrapper for boto3 execute_statement()."""

    # Limit maximum length of log entry
    logger.debug(f"Issuing SQL statement \n{sql}\nwith parameters\n{str(parameters)[:3000]}"
                 f"{'...' if len(str(parameters)) > 3000 else ''}")
    if not batch:
        parameters = {
            'database': rds_config['database-name'],
            'includeResultMetadata': True,
            'parameters': parameters,
            'resourceArn': rds_config['database-resource-arn'],
            'schema': schema,
            'secretArn': rds_config['database-admin-secret-arn'],
            'sql': sql
        }
        if transaction_id is not None:
            parameters['transactionId'] = transaction_id
        response = rds_client.execute_statement(**parameters)
        # Other params:
        # continueAfterTimeout=True|False,
        # Below option not currently supported by latest version of local-data-api,
        # was specifying the default anyway so removing it; https://github.com/koxudaxi/local-data-api/issues/124
        # has been opened
        # resultSetOptions={
        #     'decimalReturnType': 'STRING'  # |'DOUBLE_OR_LONG'
        # },
    else:
        # Wrap in transaction if not already, accommodate reference to open transaction via transaction_id
        if transaction_id is None:
            response = rds_client.begin_transaction(
                database=rds_config['database-name'],
                resourceArn=rds_config['database-resource-arn'],
                schema=schema,
                secretArn=rds_config['database-admin-secret-arn']
            )
            transaction_id = response['transactionId']
        response = rds_client.batch_execute_statement(
            database=rds_config['database-name'],
            parameterSets=parameters,
            resourceArn=rds_config['database-resource-arn'],
            schema=schema,
            secretArn=rds_config['database-admin-secret-arn'],
            sql=sql,
            transactionId=transaction_id
        )
        response = rds_client.commit_transaction(
            resourceArn=rds_config['database-resource-arn'],
            secretArn=rds_config['database-admin-secret-arn'],
            transactionId=transaction_id
        )

    # Even with fallback available to chunked, for now let's consider this of interest as INFO alert.
    # Consideration should be given to removing this with future refactor/update, perhaps/arguably adding INFO
    # alert to _get_rows_by_chunk().
    response_size = getsizeof(json.dumps(response))
    if response_size > MAXIMUM_RESPONSE_SIZE_BYTES * RESPONSE_SIZE_WARNING_THRESHOLD:
        alert_logger.info(
            f"Query {sql} with parameters {parameters} returned response of size "
            f"{int(response_size / 1024)}KB, exceeding the {RESPONSE_SIZE_WARNING_THRESHOLD:.0%} warning "
            f"threshold currently configured for Data API maximum response size of "
            f"{int(MAXIMUM_RESPONSE_SIZE_BYTES / 1024)}KB."
        )

    return response


def _get_rows_by_chunk(schema: str, select_query: str, parameters: List, rows_per_chunk: int = 2000) -> Dict:
    """
    Retrieve (i.e., SELECT) database rows in chunks. Supports queries where payload exceeds
    the documented Data API hard limit of 1MB (in practice, measured byte size payloads of
    ~1.8MB have been observed as being returned before error is encountered). This function should be
    leveraged when the error is returned from Data API that maximum payload size has been
    exceeded. During any refactoring consideration might be given to using this function by default;
    i.e., regardless whether an error is initially expected/observed.

    Number of rows is backed off to the extent necessary in order to successfully retrieve
    chunked payload.
    """

    logger.info(f"Entering chunked retrieval mode of payload....")

    select_query = select_query.rstrip(';')
    offset = 0
    responses = []  # Store all responses
    while True:  # Retrieval engine
        chunked_query = select_query + f' LIMIT {rows_per_chunk} OFFSET {offset};'
        try:
            responses.append(_execute_statement(schema, chunked_query, parameters, False))
        except rds_client.exceptions.BadRequestException as e:
            if MAXIMUM_PAYLOAD_SIZE_ERROR not in e.response['message']:  # Enhanced handling for only this error
                raise e
            rows_per_chunk = int(rows_per_chunk / 2)
            logger.debug(f"Payload still too large, backing off to {rows_per_chunk} (half) the number "
                         f"of rows being requested.")
        else:
            if len(responses[-1]['records']) < rows_per_chunk:  # All done
                break
            # Get the next chunk
            offset += rows_per_chunk

    collated_response = responses.pop(0)  # One response _should_ always be present, here
    for r in responses:
        collated_response['records'].extend(r['records'])

    logger.info(f"Chunked retrieval returned {len(collated_response['records'])} total records in "
                f"{len(responses) + 1} requests to the database.")

    return collated_response


def batch_write(schema: str, sql_columns: List[SqlColumnsPair]) -> Dict:
    """
    Accepts multiple SQL statements as sql_columns and executes them as multiple/discrete database
    calls within a single transaction.
    """

    logger.debug(f"Performing batch write with {len(sql_columns)} statements.")
    # Wrap in transaction
    response = rds_client.begin_transaction(
        database=rds_config['database-name'],
        resourceArn=rds_config['database-resource-arn'],
        schema=schema,
        secretArn=rds_config['database-admin-secret-arn']
    )
    transaction_id = response['transactionId']

    for sql, columns in sql_columns:
        current_parameters = [_build_data_api_parameter(k, v) for k, v in columns.items()]
        response = rds_client.execute_statement(
            database=rds_config['database-name'],
            parameters=current_parameters,
            resourceArn=rds_config['database-resource-arn'],
            schema=schema,
            secretArn=rds_config['database-admin-secret-arn'],
            sql=sql,
            transactionId=transaction_id
        )

    rds_client.commit_transaction(
        resourceArn=rds_config['database-resource-arn'],
        secretArn=rds_config['database-admin-secret-arn'],
        transactionId=transaction_id
    )

    return response


def format_field(field: Dict, type_name: str) -> T:
    """Parse and return value of field/column. Cast JSON values."""

    if not field:  # an empty dictionary, albeit possibly with a type
        return None
    elif 'isNull' in field:  # return None, if the field 'isNull' regardless of its type
        return None
    elif type_name in ['json', 'jsonb']:
        return json.loads(next(iter(field.values())))  # Only one item in field
    # Data API's way of telling us it's an array, apparently; will need to adjust if we need to support
    # other arrays; e.g., _int4...underscore as char 1 should signify array...
    elif type_name == '_text':
        return parse_array(field)  # Account for local versus deployed variance
    # elif type_name == 'timestamp'  # cast timestamp ???

    return next(iter(field.values()))


def format_record(record: list, column_types: list, column_names: list) -> Dict:
    """Return just values for given record, properly formatted."""

    # Apparently as of python 3.7 Dict maintains item order
    return {column_names[i]: format_field(field, column_types[i]) for i, field in enumerate(record)}


# Functions generally expected to serve as the interface to this module.

def execute_statement(schema: str, sql: str, columns: Union[List, Dict], operation='read',
                      batch: bool = False, transaction_id: str = None) -> List[Dict]:
    """
    Interact with database and return friendly response. May break out into
    separate select/update operations later.
    
    :sql: should be compatible with boto3 specification, which looks something like
     'select * from app.container where id=:id'.
    :columns: should have form { <column_name>: <column_value> } where column_name
     corresponds to variable(s) defined in 'sql'.
    :operation: if update or insert, does not return a recordset but returns a message response
    :batch: if False, executes a single SQL statement, if true uses boto3 batch_execute_statement
    :transaction_id: Accommodate continuation of an open transaction

    Consider leveraging _get_rows_by_chunk immediately regardless of observing/anticipating initial error
    """

    if batch:
        # parameters is a list of objects
        parameters = [[_build_data_api_parameter(k, v) for k, v in item.items()] for item in columns]
    else:
        parameters = [_build_data_api_parameter(k, v) for k, v in columns.items()]

    try:
        response = _execute_statement(schema, sql, parameters, batch, transaction_id)
    except rds_client.exceptions.BadRequestException as e:
        if MAXIMUM_PAYLOAD_SIZE_ERROR not in e.response['message']:  # Enhanced handling for only this error
            raise e
        response = _get_rows_by_chunk(schema, sql, parameters)

    if (operation == 'update') or (operation == 'insert') or (operation == 'delete'):
        return [response]

    # Reformat the response to our select query
    column_types = [c['typeName'] for c in response['columnMetadata']]
    column_names = [c['name'] for c in response['columnMetadata']]
    records = [format_record(record, column_types, column_names) for record in response['records']]
    logger.debug(f"{len(records)} records returned from query, total response size "
                 f"{int(getsizeof(json.dumps(response)) / 1024)}KB.")

    return records


class DBAction(Enum):
    INSERT = 'INSERT'
    UPDATE = 'UPDATE'
    DELETE = 'DELETE'
