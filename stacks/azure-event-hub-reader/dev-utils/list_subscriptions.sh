#!/bin/bash
#
# List [local] SNS subscriptions.
#
# Dependencies:
# - AWS CLI
# - local development environment on default ports
#
# Usage: `./list_subscriptions.sh`
#
# J. Leake 2021-06-19
#

ENDPOINT_URL=http://localhost:4002

aws --endpoint-url $ENDPOINT_URL sns list-subscriptions