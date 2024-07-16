import {Handler, SQSEvent} from "aws-lambda";

import { logger } from "lib/ts/v1/utilities";

const insertHydratedEvents: Handler = async (event: SQSEvent) => {

  logger.info(`Logging only in insertEvents, event: ${JSON.stringify(event)}.`);

}

const insertHydratedEventsDlq: Handler = async (event: SQSEvent) => {

  logger.info(`Logging only in insertEventsDlq, event: ${JSON.stringify(event)}.`);

}

export { insertHydratedEvents, insertHydratedEventsDlq }