import { LambdaClient, LambdaClientConfig, InvokeCommand } from "@aws-sdk/client-lambda"; // ES Modules import
import * as envConstants from "./initConstants";

const clientConfig: LambdaClientConfig = { region: envConstants.default.REGION }
if (!envConstants.default.IS_DEPLOYED) {
    clientConfig.endpoint = "http://localhost:3002";
}

const lambdaClient = new LambdaClient(clientConfig);

async function invokeLambda(lambdaName: string, asynchronous: boolean = false, payload?: string) {

    const command = new InvokeCommand({
        FunctionName: lambdaName,
        InvocationType: asynchronous ? "Event" : "RequestResponse",
        LogType: "None",
        Payload: payload
    });
    return await lambdaClient.send(command);
}

export { invokeLambda }