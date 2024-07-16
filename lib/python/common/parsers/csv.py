"""
Helper functions for parsing objects representing CSV files.
"""

import ast
import re
import csv
from io import StringIO
from typing import OrderedDict, Tuple, List, Dict, Union


def get_node_from_path(_csv: OrderedDict, path: str) -> Tuple[str, str]:
    """Find indicated column/field in row and return its name/value."""

    for node in _csv.items():  # Access name/value tuples
        if node[0] == path:  # Check field name for what we want
            return node[0], node[1]

    raise ValueError(f"Field {path} not found in row {_csv}.")  # For now fatal if not found


def get_node_value_from_path(_csv: OrderedDict, path: str) -> str:
    """Return text associated with node."""

    assert isinstance(_csv, OrderedDict), "This function expects a single CSV row represented as OrderedDict."

    return get_node_from_path(_csv, path)[1]  # Value component of tuple


"""
The functions below represent conversion back and forth between raw payload content
and canonical (in the context of these parsers) format/structure for a given parser.
"""


def from_string(csv_string: str, **kwargs: [List, str, bool]) -> List[Dict]:
    """
    Convert string into one or more CSV rows, each consisting of key/value pairs. The input of this
    function is also assumed to be directly compatible with the payload of a CSV message.

    **kwargs accommodate extension of control parameters, currently:

    :fieldnames: If not included the first row will be assumed to be the CSV column headers
    :restkey: Key name to use in the case extra data fields are encountered beyond the
              number of headers present, default 'EXTRA_DATA_FIELDS'
    :include_rest: Whether to include key/values for extra data fields, default False
    :null_str: value to substitute for NULL

    TODO: this function should probably be refactored
    """

    # Setup params from kwargs
    fieldnames = kwargs.get('fieldnames', None)
    restkey = kwargs.get('restkey', None)
    null_str = kwargs.get('null_str', '\\N')
    force_types = kwargs.get('force_types', dict())

    rows = []
    with StringIO(csv_string) as input_file:
        reader = csv.DictReader(
            input_file, fieldnames=fieldnames, restkey=restkey, delimiter=',', quotechar='"',
            skipinitialspace=True, escapechar='\\'
        )
        for row in reader:
            # TODO: consider breaking below out into function in general.py for use around app
            for k, v in row.items():
                if k in force_types.keys():  # some items are identified with things like '355' which would be converted to a float unless forced to be kept as a str
                    row[k] = force_types[k](v)
                elif row[k] == null_str:
                    row[k] = 'IS NULL'
                elif v.lower() == 'true':
                    row[k] = True
                elif v.lower() == 'false':
                    row[k] = False
                elif re.match('^{.*}$', v) or re.match('^\\[.*\\]$', v):  # List, set, dict
                    row[k] = row[k] = ast.literal_eval(v)
                elif v.isdigit():
                    row[k] = int(v)
                else:
                    try:
                        row[k] = float(v)
                    except ValueError:
                        row[k] = v
            rows.append(row)

    return rows


def to_string(_csv: List[Union[Dict, OrderedDict]], **kwargs: str) -> str:
    """
    Serialize one or more CSV rows (e.g., for insertion into a message/event, which conventionally
    would be just a single row per event).

    Use of **kwargs here as we expect different parsers to have different needs. As for this function:

    :quoting: expects standard quoting option as provided by csv module, default to 'QUOTE_MINIMAL'
    :line_terminator: default to '\r\n'

    Additional CSV formatting options should be added to this function as new use cases are encountered.
    """

    # Setup params from kwargs
    quoting = kwargs.get('quoting', 'QUOTE_MINIMAL')
    line_terminator = kwargs.get('line_terminator', '\r\n')

    assert isinstance(_csv, List), f"{__name__}.to_string() expects list of CSV row objects."
    if not _csv:
        print(f"No CSV content passed to {__name__}.to_string() so returning empty string. "
              f"This is probably a peculiar situation.")
        return ''

    output = StringIO()
    writer = csv.writer(output, quoting=getattr(csv, quoting), lineterminator=line_terminator)
    headers = list(_csv[0].keys())
    writer.writerow(headers)  # One set of headers from representative (i.e., first) row
    # When output is destined for message payload, this would generally be one row per record
    # but accommodate one or more.
    for i, row in enumerate(_csv):
        writer.writerow(row.values())

    return output.getvalue()
