import * as envConstants from "./initConstants"
import { logger } from "./utilities"
import { SNS, SNSClientConfig, PublishCommandInput, PublishCommandOutput, MessageAttributeValue } from "@aws-sdk/client-sns"

const shouldUseLocal = envConstants.default.IS_DEPLOYED !== true;  // Assuming it's set to either true or false

const snsConfig: SNSClientConfig = {
  region: envConstants.default.REGION,
  ...(shouldUseLocal && { endpoint: "http://127.0.0.1:4002" })  // Bypass DNS (ipv4 vs ipv6 resolution in node)
};
const snsClient = new SNS(snsConfig);

function buildTopicArnFromName(topicName: string): string {
    return `arn:aws:sns:${envConstants.default.REGION}:${envConstants.default.ACCOUNT_ID}:${topicName}`;
}

function encodeAttribute(val: number | string): MessageAttributeValue {
    return {
        DataType: typeof (val) === 'string' ? 'String' : 'Number',
        StringValue: val.toString()
    }
}

/**
 * Asynchronously publishes a message to an AWS SNS topic with optional message attributes.
 * It accepts message attributes as key/value pairs which are encoded to the extended format
 * expected by SNS. When `shortTopicName` is true, the function constructs the full topic name
 * using app/stage environment params.
 *
 * @param topicName - The name of the SNS topic to which the message will be published.
 *   This can be a full name or a short name based on the `shortTopicName` flag, where short name does not
 *   include the '<app>-' prefix nor '-<stage>' suffix. Short name should generally be used to accommodate
 *   portability.
 * @param message - The message to be published to the SNS topic.
 * @param messageAttributes - An object containing the message attributes as simple key/value pairs,
 *   encoded by this function to the extended format expected by the SNS service. Any attributes with
 *   undefined value are filtered out before publishing.
 * @param shortTopicName - Optional. A boolean flag indicating whether the provided `topicName`
 *   is a short name that needs to be expanded to a full topic name. Defaults to false.
 *
 * @returns A Promise that resolves to the result of the SNS publish command (PublishCommandOutput).
 *
 * Example usage:
 * ```typescript
 * const messageAttributes = { attr1: 'value1', attr2: 123 };
 * publishSnsMessage('my-topic-v1', 'Hello SNS', messageAttributes, true)
 *   .then(response => console.log(response))
 *   .catch(error => console.error(error));
 * ```
 */
export async function publishSnsMessage(topicName: string, message: string, messageAttributes: object, shortTopicName?: boolean): Promise<PublishCommandOutput> {
    const encodedMessageAttributes = Object.fromEntries(
        Object.entries(messageAttributes)
        .map(([key, value]) => {
            return (value !== undefined) ? [key, encodeAttribute(value)] : undefined;
        })
        .filter(Boolean)
    );
    const targetTopic = shortTopicName === true ? `${envConstants.default.SERVICE}-${topicName}-${envConstants.default.STAGE}` : topicName;
    const pubCommandInput: PublishCommandInput = {
        TopicArn: buildTopicArnFromName(targetTopic),
        Message: message,
        MessageAttributes: encodedMessageAttributes
    };
    logger.info(`Publishing message on topic ${targetTopic} with ${JSON.stringify(pubCommandInput)}`);
    return snsClient.publish(pubCommandInput)
}