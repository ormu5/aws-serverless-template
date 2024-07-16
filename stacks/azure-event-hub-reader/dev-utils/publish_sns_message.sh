#!/bin/bash
#
# Super simple script for publishing super simple message to locally-running SNS topic. We
# do not currently plan on using SNS within the application. The existing topic is intended
# to simulate the topic the application will eventually subscribe to.
#
# Dependencies:
#   - AWS CLI
#   - local development environment on default ports
#
# Usage: `./publish_sns_message.sh`
#
# J. Leake 2021-01-21
#

ENDPOINT=http://localhost:4002
# Hard-coding for now to first queue required for app

#TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:ocs-carts-scheduled-events-simulator-topic-local
#SAMPLE_PAYLOAD_PATH=sample-sns-data/scheduled-events/commercial/commercial_scheduled_message_00331_payload.json
# SAMPLE_PAYLOAD_PATH=sample-sns-data/scheduled-events/commercial/sample_commercial_payload.json

TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:opfyx-chat-receiver-v1-topic-local
SAMPLE_PAYLOAD_PATH='./sample-sns-data/actual-events/payload_of_interest_1.json'

#file://$SAMPLE_PAYLOAD_PATH
echo Sending message to $TOPIC_ARN
aws --endpoint-url $ENDPOINT sns publish --topic-arn $TOPIC_ARN --message "test"
