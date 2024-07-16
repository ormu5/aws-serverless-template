from typing import List

import boto3
from botocore.exceptions import ClientError

from functions.common import IS_DEPLOYED
from functions.common.logging_ import get_logger

logger = get_logger(__name__)

OFFLINE_ENDPOINT_URL = 'http://localhost:9001'

if IS_DEPLOYED:
    ses_client = boto3.client('ses')
else:
    logger.debug("Running in non deployed mode, using SES local configuration.")
    ses_client = boto3.client('ses', endpoint_url=OFFLINE_ENDPOINT_URL)


def send_ses_message(from_email: str, recipients: List[str], subject: str, body_text: str, body_html: str, charset='UTF-8'):
    logger.info("Invoked SES service")
    # Try to send the email.
    try:
        # Provide the contents of the email.
        response = ses_client.send_email(
            Destination={'ToAddresses': recipients},
            Message={
                'Body': {
                    'Html': {'Charset': charset, 'Data': body_html},
                    'Text': {'Charset': charset, 'Data': body_text}},
                'Subject': {'Charset': charset, 'Data': subject}},
            Source=from_email
            # ConfigurationSetName=CONFIGURATION_SET,
        )
    # Display an error if something goes wrong.
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
    else:
        logger.info(f"Email sent! Message ID: {response['MessageId']}"),
