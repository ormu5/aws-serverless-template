#!/bin/bash
#
# Super simple script for listing SQS queues running in local development environment.
#
# Dependencies:
#   - AWS CLI
#   - local development environment on default ports
#
# Usage: `./list_sqs_queues.sh`
#
# J. Leake 2021-01-10
#

ENDPOINT=http://localhost:9324

aws --endpoint-url $ENDPOINT sqs list-queues
