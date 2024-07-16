import { Logger as DeployedLogger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';

import * as envConstants from "./initConstants";

class LocalLogger {

    private _formatMessages(messages: unknown[]): string {
        return messages.map(m =>
            typeof m === 'object' ? JSON.stringify(m) : m
        ).join(' ');
    }

    debug(...messages: unknown[]) {
        console.log(`[DEBUG]:`, new Date().toISOString(), `:`, this._formatMessages(messages));
    }

    info(...messages: unknown[]) {
        console.log(`[INFO]:`, new Date().toISOString(), `:`, this._formatMessages(messages));
    }

    error(...messages: unknown[]) {
        console.error(`[ERROR]:`, new Date().toISOString(), `:`, this._formatMessages(messages));
    }

    warn(...messages: unknown[]) {
        console.warn(`[WARNING]:`, new Date().toISOString(), `:`, this._formatMessages(messages));
    }

    addContext() {
        // This method is intentionally left blank for compatibility with DeployedLogger
    }
}

const logger = envConstants.default.IS_DEPLOYED
    ? new DeployedLogger({
        persistentLogAttributes: {
            aws_account_id: envConstants.default.ACCOUNT_ID,
            aws_region: envConstants.default.REGION,
        },
    })
    : new LocalLogger();

const metrics = new Metrics({
    defaultDimensions: {
        aws_account_id: envConstants.default.ACCOUNT_ID,
        aws_region: envConstants.default.REGION
    }
});


export {
    logger,
    metrics
};
