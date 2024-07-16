#!/bin/bash
#
# Super simple script for listing SNS topics running in local development environment.
#
# Dependencies:
#   - AWS CLI
#   - local development environment on default ports
#
# Usage: `./list_sns_topics.sh`
#
# J. Leake 2021-01-21
#

ENDPOINT=http://localhost:4002

aws --endpoint-url $ENDPOINT sns list-topics
