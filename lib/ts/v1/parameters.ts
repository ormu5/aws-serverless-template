import { logger } from "./utilities";
import { readFileSync } from "fs";
import * as envConstants from "./initConstants";
import { getParametersByName } from "@aws-lambda-powertools/parameters/ssm";
import { SSMGetParametersByNameOptions } from "@aws-lambda-powertools/parameters/ssm/types";

const TTL_PARAM_CACHE = 300 // 5 minutes
const LOCAL_ENV_PATH = "./.env" // rom the perspective of an executing stack, align with rigid offline ssm location


async function _awsGetParameters(fullyQualifiedParamNames: Array<string>): Promise<Map<string, string>> {

    logger.debug("Fetching following parameters from AWS: ", { params: fullyQualifiedParamNames });
    const paramOptions: SSMGetParametersByNameOptions = { maxAge: TTL_PARAM_CACHE };
    const props = fullyQualifiedParamNames.reduce((acc, param) => {
        acc[param] = paramOptions;
        return acc;
    }, {} as Record<string, SSMGetParametersByNameOptions>);

    const { _errors: errors, ...results } = await getParametersByName(props, {
        throwOnError: false,
        decrypt: true,
    });

    if (errors && errors.length) {
        throw Error(`Unable to retrieve parameters: ${errors.join(',')}`);
    }

    const params: Map<string, string> = new Map();
    for (const paramName of fullyQualifiedParamNames) {
        if (results[paramName]) {
            params.set(paramName, results[paramName] as string);
        } else {
            throw Error(`Parameter ${paramName} not found.`);
        }
    }

    return params;

}

async function _localGetParameters(fullyQualifiedParamNames: Array<string>): Promise<Map<string, string>> {

    // Local deployment using params in .env file
    logger.debug("Fetching following parameters from file (local mode): ", { params: fullyQualifiedParamNames });
    const params = new Map<string, string>();
    const lines = readFileSync(LOCAL_ENV_PATH, { encoding: "utf-8" }).trim().split("\n");

    for (const line of lines) {
        const firstEqualsIndex = line.indexOf('=');
        if (firstEqualsIndex !== -1) {
            const key = line.substring(0, firstEqualsIndex);
            const value = line.substring(firstEqualsIndex + 1);
            if (value && fullyQualifiedParamNames.includes(key)) {  // Only return params requested
                params.set(key, value);
            }
        }
    }

    const paramsObject = Object.fromEntries(params);
    logger.debug("Returning parameters: " + JSON.stringify(paramsObject));  // Local only: sensitive values

    return params;

}

async function _getParameters(paramShortNames: Array<string>, service: string): Promise<Map<string, string>> {

    const fullyQualifiedParamNames =
        paramShortNames.map((paramName) => `/${service}/${envConstants.default.STAGE}/${paramName}`);

    // TODO (NP): This is operating as a lambda-level cache (i.e. each lambda maintains its own cache)
    // If we end up hitting our Parameter Store quota limits in AWS with this setup, we can create a *new* lambda
    // that caches parameters and gets invoked by all other lambdas (i.e. a service-level parameter cache)
    const shouldUseLocal = envConstants.default.IS_DEPLOYED !== true;  // Assuming it's set to either true or false

    const getParametersFunction = shouldUseLocal ? _localGetParameters : _awsGetParameters

    const result = await getParametersFunction(fullyQualifiedParamNames);

    // For keys in response, use convenient param short name (as was passed to us)
    const params = new Map<string, string>();
    fullyQualifiedParamNames.forEach((fqParam, idx) => {
        const paramShortName = paramShortNames[idx];
        params.set(paramShortName, result.get(fqParam) as string);
    });
    logger.info(`Successfully fetched values from SSM for params ${Array.from(params.keys())}.`);

    return params;

}

// supports getting a single or multiple parameters from a given service
// TODO (NP): Figure out whether/how to make this service-agnostic
async function getParameters(params: string | Array<string>, service: string): Promise<Map<string, string>> {

    if (typeof (params) === "string") {
        params = new Array(params);
    }
    return _getParameters(params, service);
}

export {
    getParameters
}

