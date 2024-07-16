import logging
import os

from common.configuration import get_parameters

IS_DEPLOYED = os.environ['IS_DEPLOYED'].upper() == 'TRUE'


class AWSLogger(logging.Logger):
    """
    Override construction of log record to take care of any custom handling to log record content to
    enhance presentation in AWS/CloudWatch.
    """

    def makeRecord(self, name, level, fn, lno, msg, args, exc_info, func=None, extra=None, sinfo=None):
        msg = msg.replace('\n', '\r')  # Prevent multi-lines from being multiple entries in CloudWatch
        return super().makeRecord(name, level, fn, lno, msg, args, exc_info, func, extra, sinfo)


def get_logger(name_qualifier: str = None) -> logging.Logger:
    """
    Python's default logger interfaces nicely with CloudWatch. Additional/custom
    log levels may be added as time goes on.

    Usage:
        logger = functions.common.logging_.get_logger(__name__)
        logger.info("A log entry.")
    """
    logging.getLogger('botocore').setLevel(logging.INFO)
    if IS_DEPLOYED is True:
        logging.setLoggerClass(AWSLogger)
    logger = logging.getLogger(f"{os.environ['APP']}.{name_qualifier}")
    level = logging.getLevelName(get_parameters(['log-level'])['log-level'])
    logger.setLevel(level)

    return logger
