import {
  RDSDataClient, ExecuteStatementCommand, ExecuteStatementCommandInput, RDSDataClientConfig, ColumnMetadata,
  BeginTransactionCommand, CommitTransactionCommand, BatchExecuteStatementCommand, BatchExecuteStatementResponse,
  SqlParameter, ExecuteStatementResponse, UpdateResult
} from "@aws-sdk/client-rds-data";
import { logger } from "./utilities";
import { getParameters } from "./parameters";
import * as envConstants from "./initConstants";
import { encodeParams, decodeRows, SqlValuesType, encodeRow, encodeRows } from "./dataApiUtil";

const LONG_RUNNING_QUERY_SECS = 10  // Consider anything longer than this as "long-running"

// Consistent short names for database params regardless the service
const neededParams = ["database-resource-arn", "database-endpoint"];

let rdsConfig: RDSDataClientConfig | undefined;
let client: RDSDataClient | undefined;
let baseDbConnectionParams: Partial<ExecuteStatementCommandInput> | undefined;

/**
 * Asynchronously loads and sets database configuration parameters for the current process based
 * on the service name, and applies that configuration to the RDS client and database connection.
 *
 * This function expects certain environment variables to be set for configuring the RDS client.
 * It uses `process.env.REGION` for the AWS region configuration. If the application is not deployed
 * (as indicated by `envConstants.default.IS_DEPLOYED`), it sets the RDS client's credentials and endpoint manually.
 *
 * The function initializes `baseDbConnectionParams` with essential connection information like
 * resource ARN and secret ARN, to be augmented with additional parameters later on.
 *
 * @param service - The name of the service for which database parameters are to be loaded; e.g.,
 *   'opfyx-data-fr24'.
 * @param secretArnShortName - SSM short name of secret ARN param in service's parameters path; e.g.,
 *   'database-runtime-secret-arn'.
 *
 * @returns A promise that resolves when the database parameters have been successfully loaded and set.
 *
 * @example
 * ```typescript
 * await loadDatabaseParams('my-service');
 * // Now the RDS client and baseDbConnectionParams are configured and ready for use.
 * ```
 */
async function loadDatabaseParams(service: string, secretArnShortName: string): Promise<void> {

  neededParams.push(secretArnShortName);
  const params = await getParameters(neededParams, service);

  rdsConfig = {
      region: process.env.REGION
  }
  if (!envConstants.default.IS_DEPLOYED) {
      rdsConfig.credentials = { accessKeyId: 'aaa', secretAccessKey: 'bbb' };
      rdsConfig.endpoint = params.get('database-endpoint');
      logger.info(`Using local database at ${rdsConfig.endpoint}.`);
  }
  client = new RDSDataClient(rdsConfig);

  baseDbConnectionParams = {  // Init now, augment with additional arguments later
      resourceArn: params.get('database-resource-arn'),  // required
      secretArn: params.get(secretArnShortName),  // required
      includeResultMetadata: true
  };

}

// Type guards for overloaded response type from Data API
function isExecuteStatementResponse(response: ExecuteStatementResponse | BatchExecuteStatementResponse):
  response is ExecuteStatementResponse {

  return 'numberOfRecordsUpdated' in response;
}

function isBatchExecuteStatementResponse(response: ExecuteStatementResponse | BatchExecuteStatementResponse):
  response is BatchExecuteStatementResponse {

  return 'updateResults' in response;
}

/**
 * Begin new transaction and returns its ID.
 */
async function beginTransaction(database: string): Promise<string> {

    await loadDatabaseParams;
    if (!client || !baseDbConnectionParams) {
      throw new Error("RDS client or connection params not initialized! Check database configuration.");
    }
    const inputBeginTrans = {
      resourceArn: baseDbConnectionParams['resourceArn'], secretArn: baseDbConnectionParams['secretArn'], database
    };
    const commandBeginTrans = new BeginTransactionCommand(inputBeginTrans);
    const responseBeginTrans = await client.send(commandBeginTrans);

  return responseBeginTrans['transactionId'];
}

/**
 * Commit existing transaction.
 */
async function commitTransaction(transactionId: string): Promise<void> {

  await loadDatabaseParams;
  if (!client || !baseDbConnectionParams) {
    throw new Error("RDS client or connection params not initialized! Check database configuration.");
  }

  const inputCommitTrans = {
    resourceArn: baseDbConnectionParams['resourceArn'],
    secretArn: baseDbConnectionParams['secretArn'],
    transactionId: transactionId
  };

  const commandCommitTrans = new CommitTransactionCommand(inputCommitTrans);
  client.send(commandCommitTrans);
}

/**
 * Lower-level wrapper for executing SQL statement on a specified database using the AWS Data API. Provides more
 * granular access to the Data API where read/write functions do not provide sufficient coverage.
 *
 * @param {string} database - The name of the database to execute the statement on.
 * @param {string} sql - The SQL statement to be executed.
 * @param {SqlParameter[] | SqlParameter[][]} [parameters] - Optional parameters to bind to the SQL statement.
 * @param {boolean} [batch] - Indicates whether the statement should be executed as a batch (if supported).
 * @param {string} [transactionId] - An optional transaction identifier if the statement is part of a transaction.
 *
 * @throws {Error} Throws an error if the RDS client or connection parameters are not initialized.
 *
 * @returns {Promise<ExecuteStatementResponse | BatchExecuteStatementResponse>} A Promise that resolves with the response
 * from executing the SQL statement. The response type depends on whether the statement is executed as a batch or not.
 */
async function executeStatement(database: string, sql: string, parameters?: SqlParameter[] | SqlParameter[][],
  batch?: boolean, transactionId?: string): Promise<ExecuteStatementResponse | BatchExecuteStatementResponse> {

  await loadDatabaseParams;
  if (!client || !baseDbConnectionParams) {
    throw new Error("RDS client or connection params not initialized! Check database configuration.");
  }

  // Augment base config with our query-specific arguments, automatically committed if no transaction ID
  const mergedParams = {
    ...baseDbConnectionParams, sql, database, ...(transactionId !== undefined ? { transactionId } : {}),
    ...(!batch ? { parameters } : { parameterSets: parameters })
  } as ExecuteStatementCommandInput;

  const command = !batch ? new ExecuteStatementCommand(mergedParams) : new BatchExecuteStatementCommand(mergedParams);

  logger.debug(
    `Executing SQL ${sql} on database ${database} with parameters ${JSON.stringify(parameters)}....`
  );

  let response: ExecuteStatementResponse | BatchExecuteStatementResponse;
  const startTime = Date.now();
  try {
    response = (!batch)
      ? await client.send(command) as ExecuteStatementResponse
      : await client.send(command) as BatchExecuteStatementResponse;
  } catch (e) {
    logger.warn(`Error executing SQL: ${e.message}: ${e.stack}.`);
    throw e;
  }
  const endTime = Date.now();

  logger.debug(`Response from database: ${JSON.stringify(response).replace(/\n/g, ' ')}.`);
  const duration = (endTime - startTime) / 1000;
  if (duration > LONG_RUNNING_QUERY_SECS) {
    logger.info(`Long-running query took ${duration}s to process: ${sql} with parameters ${parameters}.`);
  }

  return response;
}

/**
 * Reads data from a specified database by executing an SQL query using the AWS Data API. Handles the
 * encoding of parameters from more intuitive SqlValuesType into Data API context, and coming the other
 * direction the decoding/parsing of Data API response structure into SqlValuesType.
 *
 * @param {string} database - The name of the database to read data from.
 * @param {string} sql - The SQL query to execute for data retrieval.
 * @param {SqlValuesType} [parameters] - Optional parameters to bind to the SQL query.
 * @param {string} [transactionId] - Optionally include as part of a transaction.
 *
 * @returns {<T>Promise<T[]>} A Promise that resolves with an array of objects representing the retrieved data.
 *   Each object contains key-value pairs where keys are column names and values are corresponding values
 *   from the database.
 */
async function readFromDatabase<T>(database: string, sql: string, parameters?: SqlValuesType,
  transactionId?: string): Promise<T[]> | undefined {

  const encodedParameters: SqlParameter[] = encodeParams(parameters);
  const response = await executeStatement(database, sql, encodedParameters, false, transactionId);

  if (isExecuteStatementResponse(response)) {
    const decodedRows: SqlValuesType[] = decodeRows(
      response.records, response.columnMetadata.map((col: ColumnMetadata) => col.label),
      response.columnMetadata.map((col: ColumnMetadata) => col.typeName)
    );
    logger.debug(`${decodedRows.length} rows returned from database:\n${JSON.stringify(decodedRows)}.`);

    return decodedRows as T[];
  } else {
    throw Error(`Unexpected response type encountered from Data API: ${typeof (response)}.`);
  }
}

/**
 * Performs single-record SQL write (insert/upsert/delete) operation to specified database by executing an
 * SQL statement using the AWS Data API. Handles the encoding of parameters from more intuitive SqlValuesType
 * into Data API context.
 *
 * @param {string} database - The name of the database to write data to.
 * @param {string} sql - The SQL statement to execute for data writing (e.g., INSERT, UPDATE, DELETE).
 * @param {<T>} row - Object representing the column names/values to be written to the database.
 *    Must be mappable to key/value pairs via JS Object.
 * @param {string} [transactionId] - Optional transaction identifier if the write operation is part of a transaction.
 *    Auto commit is performed if no transaction ID is provided.
 *
 * @returns {Promise<{"Records updated": number}>} A Promise that resolves with an object containing the number
 *   of records updated as a result of executing the SQL statement.
 */
async function writeToDatabase<T>(database: string, sql: string, row: T,
  transactionId?: string): Promise<ExecuteStatementResponse> {

  const encodedRow: SqlParameter[] = encodeRow(row);
  const response = await executeStatement(database, sql, encodedRow, false, transactionId);

  if (isExecuteStatementResponse(response)) {
    logger.debug(`${response.numberOfRecordsUpdated} records updated.`);
    return response;
  } else {
    throw Error(`Unexpected response type encountered from Data API: ${typeof (response)}.`);
  }
}

/**
 * Performs batch insert of set of records to specified database by executing an SQL statement using the AWS Data API.
 * Handles the encoding of parameters into Data API context from object-based interface/model corresponding to
 * definition of the target database table.
 *
 * @param {string} database - The name of the database to write data to.
 * @param {string} sql - The SQL statement to execute for data writing (e.g., INSERT, UPDATE, DELETE).
 * @param {<T>>T[]} rows - Array of objects representing multiple records to be written to the database. Must be
 *    mappable to key/value pairs via JS Object.
 * Each object contains key-value pairs where keys are column names and values are data values.
 * @param {string} [transactionId] - Optional transaction identifier if the write operation is part of a transaction.
 *
 * @returns {Promise<{"Records updated": number}>} A Promise that resolves with an object containing the number
 * of records updated as a result of executing the SQL statement.
 */
async function writeBatchToDatabase<T>(database: string, sql: string, rows: T[],
  transactionId?: string): Promise<{ "Update results": UpdateResult[] }> {

  const encodedRows: SqlParameter[][] = encodeRows(rows);
  const response = await executeStatement(database, sql, encodedRows, true, transactionId);
  if (transactionId !== undefined) {
    await commitTransaction(transactionId);
  }

  if (isBatchExecuteStatementResponse(response)) {
    return { "Update results": response.updateResults };
  }
}

export {
    readFromDatabase, writeToDatabase, executeStatement, writeBatchToDatabase, commitTransaction, beginTransaction, loadDatabaseParams
}
