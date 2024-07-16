// Logic for ingesting events from event hub and publishing on SNS topic

import {Handler, ScheduledEvent, Context } from "aws-lambda";

import * as envConstants from "lib/ts/v1/initConstants";
import { getParameters } from "lib/ts/v1/parameters";
import { EventHubParameters, EventHubIngestEngine } from "lib/ts/v1/eventHubIngest";

const SSM_PARAMS = ['event-hub-connection-string', 'event-hub-name', 'event-hub-consumer-group', 'database-name'];
let checkpointDatabase: string;

const eventHubParamsPromise = getParameters(SSM_PARAMS, envConstants.default.SERVICE);
const eventHubParameters: EventHubParameters = {};
eventHubParamsPromise.then((params) => {
    eventHubParameters.connectionString = params.get('event-hub-connection-string');
    eventHubParameters.eventHubName = params.get('event-hub-name');
    eventHubParameters.consumerGroup = params.get('event-hub-consumer-group');
    checkpointDatabase = params.get('database-name');
});

interface EventPayload {
  body: {
    field_one: string;
    field_two: string;
  };
}

function parseMessageAttributesFromEvent(event: EventPayload) {

  return {
    fieldOne: event.body.field_one,
    fieldTwo: event.body.field_two
  }
}

const ingestEvents: Handler = async (event: ScheduledEvent, context: Context) => {

  await eventHubParamsPromise;
  const eventHubIngestEngine: EventHubIngestEngine = new EventHubIngestEngine(
    eventHubParameters, checkpointDatabase, parseMessageAttributesFromEvent);
  await eventHubIngestEngine.run(context);

}

export { ingestEvents }