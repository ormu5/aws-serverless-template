"""
Logic for interacting with AWS S3.
"""

import functools
import io
import os
import random
import string
import traceback
from datetime import datetime, timezone
from typing import Dict, Callable, Union
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

from common.sns import get_alert_enabled_logger, AlertDomain

logger = get_alert_enabled_logger(__name__, AlertDomain['S3'], 'Failed Object Operation')

DIFFERENTIATOR_LENGTH = 6  # At the least for unique S3 object names
S3_FAILURE_FOLDER = 'errored'
S3_SUCCESS_FOLDER = 'archived'

# TODO: may pull these out into local conf file
OFFLINE_ENDPOINT_URL = 'http://localhost:4569'
OFFLINE_ACCESS_KEY_ID = 'S3RVER'
OFFLINE_SECRET_ACCESS_KEY = 'S3RVER'

IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'
if IS_DEPLOYED:
    s3_client = boto3.client('s3')
    ARCHIVE_BUCKET_NAME = f'{os.environ["APP"]}-archive-s3-{os.environ["ENV"]}'
else:
    # TODO: centralize these params
    logger.debug("Running non deployed, using sls-s3-local configuration.")
    s3_client = boto3.client('s3', endpoint_url=OFFLINE_ENDPOINT_URL, aws_access_key_id=OFFLINE_ACCESS_KEY_ID,
                             aws_secret_access_key=OFFLINE_SECRET_ACCESS_KEY)
    ARCHIVE_BUCKET_NAME = 'archiveBucket'

"""
User-defined exceptions to distinguish specific workflow errors.
"""


class CustomError(Exception):
    def __init__(self, message: str):
        super(CustomError, self).__init__()
        self.message = message


class UserRecordParseError(CustomError):
    """
    Raised when error encountered in writing batch of records to Kinesis stream. Note
    distinction between stream record and user record, where a stream record may contain
    one or more user records.
    """
    pass


def is_s3_event(event: Dict):
    try:
        return event['Records'][0]['eventSource'] == 'aws:s3'
    except (KeyError, IndexError):
        return False


def is_object_not_found_error(e: Exception):
    return 'when calling the HeadObject operation: Not Found' in str(e)


def get_filename_from_object_key(object_key: str) -> str:
    """Consistent notion of filename: portion of object key after the last forward slash."""

    return object_key.split('/')[-1]


def build_differentiator():
    """To be appended as needed to S3 object names."""

    return '-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=DIFFERENTIATOR_LENGTH))


def build_date_path():
    """It's common to include in S3 object name a date string that virtually sorts objects into folders by date."""

    t = datetime.now(timezone.utc)

    return '/'.join([f'{t.year:02d}', f'{t.month:02d}', f'{t.day:02d}'])


def build_s3_object_key(filename: str, base_folder: str = None, sub_folder: str = S3_SUCCESS_FOLDER,
                        include_differentiator: bool = True) -> str:
    """
    Return unique object name with included timestamp path prefix. 'base_folder' is also known
    as s3 prefix. Send successes and failures to different sub-folders.
    """

    differentiator = '' if include_differentiator is not True else build_differentiator()

    if base_folder is None:
        base_path = ''
    else:
        base_path = base_folder + '/'

    # Build string that represents object key based on success/failed processing, organized by day
    return base_path \
           + sub_folder \
           + '/' \
           + build_date_path() \
           + '/' \
           + filename \
           + differentiator  # Since same file could be resubmitted/retried, etc.


def list_s3_objects(bucket_name: str, prefix: str = '') -> None:
    """Will return maximum of 1000 objects, pagination not currently implemented."""

    response = s3_client.list_objects_v2(
        Bucket=bucket_name,
        # Delimiter='string',
        # EncodingType='url',
        # MaxKeys=123,
        Prefix=prefix,
        # ContinuationToken='string',  # Not currently implemented
        # FetchOwner=True|False,
        # StartAfter='string',
        # RequestPayer='requester',
        # ExpectedBucketOwner='string'
    )

    return response


def put_s3_object(bucket_name: str, object_key: str, _data: Union[bytes, str], metadata: Dict = None,
                  acl: str = 'bucket-owner-full-control') -> Dict:
    """
    Wrapper for S3 put object method. Currently not error handling.
    """

    if metadata is None:
        metadata = {}

    logger.debug(f"Sending {object_key} to bucket {bucket_name}.")
    response = s3_client.put_object(
        ACL=acl,
        # |'private'|'public-read'|'public-read-write'|'authenticated-read'|'aws-exec-read'|'bucket-owner-read'|'bucket-owner-full-control',
        Body=_data,
        Bucket=bucket_name,
        # CacheControl='string',
        # ContentDisposition='string',
        # ContentEncoding='string',
        # ContentLanguage='string',
        # ContentLength=123,
        # ContentMD5='string',
        # ContentType='string',
        # Expires=datetime(2015, 1, 1),
        # GrantFullControl='string',
        # GrantRead='string',
        # GrantReadACP='string',
        # GrantWriteACP='string',
        Key=unquote_plus(object_key),  # Account for any URL encoding
        Metadata={k: str(v) for k, v in metadata.items()}
        # ServerSideEncryption='AES256'|'aws:kms',
        # StorageClass='STANDARD'|'REDUCED_REDUNDANCY'|'STANDARD_IA'|'ONEZONE_IA'|'INTELLIGENT_TIERING'|'GLACIER'|'DEEP_ARCHIVE',
        # WebsiteRedirectLocation='string',
        # SSECustomerAlgorithm='string',
        # SSECustomerKey='string',
        # SSEKMSKeyId='string',
        # SSEKMSEncryptionContext='string',
        # RequestPayer='requester',
        # Tagging='string',
        # ObjectLockMode='GOVERNANCE'|'COMPLIANCE',
        # ObjectLockRetainUntilDate=datetime(2015, 1, 1),
        # ObjectLockLegalHoldStatus='ON'|'OFF'
    )

    return response


def get_s3_object(bucket_name: str, object_key: str) -> str:
    """Download S3 object as file and return as string."""

    unquoted_key = unquote_plus(object_key)
    logger.info(f"Downloading S3 object {unquoted_key} from bucket {bucket_name} for processing.")

    bytes_buffer = io.BytesIO()
    # Account for any URL encoding in object key
    s3_client.download_fileobj(Bucket=bucket_name, Key=unquoted_key, Fileobj=bytes_buffer)

    return bytes_buffer.getvalue().decode('utf-8', 'replace')  # String/serialized s3 object


def delete_s3_object(bucket_name: str, object_key: str) -> Dict:
    """Wrapper for S3 delete object method."""

    logger.debug(f"Deleting {object_key} from {bucket_name}.")
    response = s3_client.delete_object(
        Bucket=bucket_name,
        Key=unquote_plus(object_key)  # Account for any URL encoding
    )

    return response


def move_s3_object(source_bucket: str, source_key: str, destination_bucket: str, destination_key: str) -> None:
    """Move S3 object via copy and delete. Method performs multi-part (e.g., > 5GB size) copy as needed."""

    logger.debug(f"Moving {source_bucket}/{source_key} to {destination_bucket}/{destination_key}.")
    copy_source = {'Bucket': source_bucket, 'Key': source_key}
    try:
        response = s3_client.copy(copy_source, destination_bucket, destination_key)
    except ClientError as e:
        if not is_object_not_found_error(e):  # Something unexpected, propagate exception
            raise e
        response = {'CustomMessage': f"Tried to move {source_bucket}/{source_key} but it was not found."}
        logger.warning(response['CustomMessage'])
    else:  # Clean-up original object
        delete_s3_object(source_bucket, source_key)
        logger.info(f"{source_bucket}/{source_key} moved to {destination_bucket}/{destination_key}.")

    return response


def s3_event_handler(_func=None, *, auto_archive: bool = True) -> Callable:
    """
    Decorator factory supporting ability to disable this handler's archival of an object once it's
    been successfully processed. This does not disable the relocation of the object to the 'errored'
    folder if exceptions are encountered.

    :param _func: allows decorator to be called like @http_event_handler or @http_event_handler(auto_archive=False)
    :param auto_archive: Optionally disable handler's auto archive of successfully processed s3 objects,
        presumably so it can be done elsewhere; e.g., once an asychronous operation using the object
        has completed.
    """

    def decorator(func: Callable) -> Callable:
        """
        Decorator function for S3 event handler functionality. Parse event, retrieve object from
        S3 for each record in the event, and execute wrapped function with the content of that object.
        Bypass this wrapping by executing your_function as `your_function.__unwrapped()`.

        Expects optional dictionary returned from wrapped function that will be attached to S3
        object as metadata and populates some metadata of its own.
        """

        def process_record(s3_record: Dict) -> None:
            """
            Walk record through processing flow.
            """

            logger.debug(f"Processing record: {s3_record}.")
            start = datetime.now()  # Track execution time of lambda
            bucket_name = s3_record['s3']['bucket']['name']
            source_key = s3_record['s3']['object']['key']
            destination_folder = S3_SUCCESS_FOLDER  # To be overriden below if errors are encountered

            s3_object = get_s3_object(bucket_name, source_key)
            s3_metadata = {}  # Will save some metadata with S3 object
            try:
                custom_metadata = func(s3_object, s3_record=s3_record)
            except Exception as e:  # Currently any exception
                destination_folder = S3_FAILURE_FOLDER
                # Add error message as metadata; as http header it cannot contain new lines in its value
                s3_metadata['error_message'] = f"{traceback.format_exc()}".replace('\n', ' | ')
                logger.error(f"Sending to {S3_FAILURE_FOLDER} folder due to\n{str(e)}\n{traceback.format_exc()}.")
            else:
                if auto_archive is False:
                    logger.info(f"Object successfully processed. Auto archive is disabled, leaving "
                                f"{bucket_name}/{source_key} where it is.")
                    return
                if custom_metadata is not None:
                    s3_metadata.update(custom_metadata)

            # Post-processing: move S3 object to appropriate location, some log entries
            destination_key = build_s3_object_key(
                get_filename_from_object_key(source_key),
                sub_folder=destination_folder
            )

            s3_metadata['processing_duration'] = datetime.now() - start
            put_s3_object(bucket_name, destination_key, s3_object, metadata=s3_metadata)
            delete_s3_object(bucket_name, source_key)  # Clean up original object

            logger.info(f"Object {source_key} was processed in {s3_metadata['processing_duration']} and moved "
                        f"to {destination_key} in bucket {bucket_name}.")

        @functools.wraps(func)
        def wrapped(event: Dict, context):

            logger.debug(f"New event received with {len(event['Records'])} record(s).")
            for s3_record in event['Records']:
                process_record(s3_record)

        # Accommodate things like unit testing. Bypass this decorator's functionality
        # by invoking your function directly as your_function.__unwrapped().
        wrapped.__unwrapped = func

        return wrapped

    # Allows decorator to be called without arguments
    if _func is None:
        return decorator
    else:
        return decorator(_func)
