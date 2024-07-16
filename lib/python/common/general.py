import functools
from typing import Dict, Callable

from common.logging_ import get_logger

logger = get_logger(__name__)


def message_parsers(*parsers) -> Callable:
    """
    Decorator factory supporting multiple potential message parsers for a given event. For example,
    a SQS queue may process events containing SNS messages (e.g., in the case of a SNS/SQS subscription) as
    well as SQS messages (e.g., in the case a calling service sends a message directly to the queue). When
    such multi-parsing is desired, this decorator should be used *instead* of decorating target function with
    a single service-specific parser such as @sns_message_parser.

    :param parsers: service-specific (SNS, SQS, etc.) parsing functions
    """

    def decorator(func) -> Callable:
        """Decorator function to support multiple parsers for a given event."""

        @functools.wraps(func)
        def wrapper(message: str, record: Dict, *args, **kwargs) -> None:
            """
            Calls registered parsers until an appropriate one - i.e., that matching the event/message structure for
            the message being processed evaluates the event structure to determine which of the registered
            message parsers to use, then processes the event using that parser. If no appropriate parser is found,
            the message is not processed.
            """

            for parser in parsers:
                wrapper_func = parser(func)
                response = wrapper_func(message, record, *args, **kwargs)
                # Couple of conditions mean the parser does not match the message/event
                if response is None:
                    continue
                if response[1]['parsed'] is not True:
                    continue
                # We have a match, function was executed without an exception
                break
            else:
                logger.warning(f"No configured parser for message {args[0]}. It is considered unusual for a service"
                               f"to receive an event/message for which no parser is configured.")

        return wrapper

    return decorator

