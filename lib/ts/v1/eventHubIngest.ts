// Engine that interacts with remote event hub via checkpoint and partition
// implementation, and publishes events to SNS topic.

import { Context } from "aws-lambda";
import { earliestEventPosition, EventHubConsumerClient, PartitionContext, ReceivedEventData }
  from "@azure/event-hubs";

import * as envConstants from "./initConstants";
import { DbCheckpointStore } from "./eventHubDbCheckpointStore";
import { DbCheckpoint } from "./eventHubDbCheckpoint";
import { loadDatabaseParams } from "./database";
import { logger } from "./utilities";
import { publishSnsMessage } from "./sns";

const INGEST_OPTIONS = {
  startPosition: earliestEventPosition,
  maxWaitTimeInSeconds: 60,
  maxBatchSize: 100  // Impacts checkpointing frequency, should be able to do it in well under 10000
};
// In milliseconds, how long before Lambda timeout should it gracefully shut down
const LAMBDA_SHUTDOWN_HEADROOM = 10000;

// Defaults, can be overridden by caller
const EVENTS_DESTINATION_TOPIC_SHORT_NAME = 'hydrated-events-topic-v1';
const DATABASE_SECRET_ARN = 'database-runtime-secret-arn';

interface EventHubParameters {
  connectionString?: string;
  eventHubName?: string;
  consumerGroup?: string;
}

/**
 * The `EventHubConsumerClient` class is used to consume events from an Event Hub.
 * Use the `options` parameter to configure retry policy or proxy settings.
 * @param consumerGroup - The name of the consumer group from which you want to process events.
 * @param connectionString - The connection string to use for connecting to the Event Hub instance.
 *   It is expected that the shared key properties and the Event Hub path are contained in this connection string.
 *   e.g. 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key;EntityPath=my-event-hub-name'.
 * @param options - A set of options to apply when configuring the client.
 *   - `retryOptions`   : Configures the retry policy for all the operations on the client.
 *       For example, `{ "maxRetries": 4 }` or `{ "maxRetries": 4, "retryDelayInMs": 30000 }`.
 *   - `webSocketOptions`: Configures the channelling of the AMQP connection over Web Sockets.
 *   - `userAgent`      : A string to append to the built-in user agent string that is passed to the service.
 *
 * The options that can be provided while creating the EventHubConsumerClient.
 * - `loadBalancingOptions` : Options to tune how the EventHubConsumerClient claims partitions.
 *    - `strategy`: `balanced` or `greedy`, default: `balanced`
 *    - `updateIntervalInMs`: The length of time between attempts to claim partitions, default: 10000
 *    - `partitionOwnershipExpirationIntervalInMs`: The length of time a partition claim is valid, default: 60000
 * - `userAgent`: A string to append to the built-in user agent string that is passed as a connection property
 *      to the service.
 * - `webSocketOptions`: Options to configure the channelling of the AMQP connection over Web Sockets.
 *    - `websocket` : The WebSocket constructor used to create an AMQP connection if you choose to make the connection
 *        over a WebSocket.
 *    - `webSocketConstructorOptions` : Options to pass to the Websocket constructor when you choose to make the connection
 *        over a WebSocket.
 * - `retryOptions`: The retry options for all the operations on the client/producer/consumer.
 *    - `maxRetries` : The number of times the operation can be retried in case of a retryable error.
 *    - `maxRetryDelayInMs`: The maximum delay between retries. Applicable only when performing exponential retries.
 *    - `mode`: Which retry mode to apply, specified by the `RetryMode` enum. Options are `Exponential` and `Fixed`. Defaults to `Fixed`.
 *    - `retryDelayInMs`: Amount of time to wait in milliseconds before making the next attempt. When `mode` is set to `Exponential`,
 *        this is used to compute the exponentially increasing delays between retries. Default: 30000 milliseconds.
 *    - `timeoutInMs`: Amount of time in milliseconds to wait before the operation times out. This will trigger a retry if there are any
 *        retry attempts remaining. Minimum value: 60000 milliseconds.
 */

class EventHubIngestEngine {

  eventHubParameters: EventHubParameters;
  checkpointDatabase: string;
  snsMessageAttributeParser?: (event: object) => object;
  databaseSecretArn: string;
  snsDestinationTopicShortName: string;

  checkpointStore: DbCheckpointStore;
  consumerClient: EventHubConsumerClient;
  processedEventCount: number;
  batchLowestSequenceNumber: number;

  constructor(eventHubParameters: EventHubParameters, checkpointDatabase: string,
              snsMessageAttributeParser?: (event: object) => object, databaseSecretArn = DATABASE_SECRET_ARN,
              snsDestinationTopicShortName: string = EVENTS_DESTINATION_TOPIC_SHORT_NAME) {

    this.eventHubParameters = eventHubParameters;
    this.checkpointDatabase = checkpointDatabase;
    this.snsMessageAttributeParser = snsMessageAttributeParser;
    this.databaseSecretArn = databaseSecretArn;
    this.snsDestinationTopicShortName = snsDestinationTopicShortName;

    this.checkpointStore = new DbCheckpointStore(this.checkpointDatabase);
    this.consumerClient = new EventHubConsumerClient(
      this.eventHubParameters.consumerGroup, this.eventHubParameters.connectionString, this.eventHubParameters.eventHubName,
      this.checkpointStore, {}
    );
    this.processedEventCount = 0;
    this.batchLowestSequenceNumber = Infinity;

  }

  private async processEvent(event: ReceivedEventData): Promise<void> {

    const messageAttributes: object = typeof this.snsMessageAttributeParser === 'function'
      ? this.snsMessageAttributeParser(event)
      : {};
    await publishSnsMessage(
      this.snsDestinationTopicShortName, JSON.stringify(event), messageAttributes, true
    );
    this.batchLowestSequenceNumber = event.sequenceNumber < this.batchLowestSequenceNumber
      ? event.sequenceNumber
      : this.batchLowestSequenceNumber;
    this.processedEventCount += 1;

  }

  private async checkBatchSequenceNumber(events: ReceivedEventData[], context: PartitionContext): Promise<void> {

    const formerCheckpoint: DbCheckpoint = await DbCheckpoint.getCurrentCheckpoint(
      this.checkpointDatabase, context.fullyQualifiedNamespace, context.eventHubName, context.consumerGroup,
      context.partitionId
    )
    if (events !== undefined && events.length > 0) {
      await context.updateCheckpoint(events[events.length - 1]);
      if (formerCheckpoint !== undefined) {
        if (this.batchLowestSequenceNumber - formerCheckpoint.sequenceNumber > 1 && this.batchLowestSequenceNumber !== Infinity) {
          logger.warn(`There is a gap between the former checkpoint sequence number of ` +
            `${formerCheckpoint.sequenceNumber} and lowest sequence number of ${this.batchLowestSequenceNumber} ` +
            `found in this batch of events. This may indicate an issue in processing.`
          )
        }
      }
    }
  }

  public async run(context: Context) {

    await loadDatabaseParams(envConstants.default.SERVICE, this.databaseSecretArn);
    logger.debug(
      `Event hub ingest engine initialized, fetching events from ${this.eventHubParameters.eventHubName} using checkpoint database ${this.checkpointDatabase}....`
    );
    await new Promise<void>(() => {
      const subscription = this.consumerClient.subscribe({
          processEvents: async (events: ReceivedEventData[], context: PartitionContext) => {
            // It is possible for `events` to be an empty array. This can happen if there were no new
            // events to receive in the `maxWaitTimeInSeconds`, which is defaulted to 60 seconds.
            logger.info(`Processing events from partition ${context.partitionId}....`)
            this.batchLowestSequenceNumber = Infinity;
            await Promise.all(events.map(event => this.processEvent(event)));
            await this.checkBatchSequenceNumber(events, context);
          },
          processError: async (err, context) => {
            logger.warn(`Error on partition "${context.partitionId}": ${JSON.stringify(err.message)}: ` +
              `${JSON.stringify(err.stack)}. And context is ${JSON.stringify(context)}.`);
          }
        },
        INGEST_OPTIONS
      );

      // Close out before Lambda times out
      setTimeout(async () => {
        await subscription.close();
        await this.consumerClient.close();
        logger.info(`Done with this Lambda execution, shutting down after collecting ${this.processedEventCount} events.`);
      }, context.getRemainingTimeInMillis() - LAMBDA_SHUTDOWN_HEADROOM);
    });
    }



}

export { EventHubIngestEngine };
export type { EventHubParameters };
