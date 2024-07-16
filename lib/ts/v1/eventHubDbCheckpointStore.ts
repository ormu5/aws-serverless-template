// Perform interactions with the RDBMS checkpoint store

import {v4 as uuidv4} from "uuid";
import { Checkpoint, CheckpointStore, PartitionOwnership } from "@azure/event-hubs";

import { logger } from "./utilities";
import { readFromDatabase, writeToDatabase, beginTransaction, commitTransaction } from "./database";
import { SqlValuesType } from "./dataApiUtil";
import { DbCheckpoint } from "./eventHubDbCheckpoint";
import { DbPartitionOwnership } from "./eventHubDbPartitionOwnership";

export class DbCheckpointStore implements CheckpointStore {

  static database: string;
  constructor(database: string) {
    DbCheckpointStore.database = database;
  }

  // https://learn.microsoft.com/en-us/javascript/api/%40azure/event-hubs/operationoptions?view=azure-node-latest
  public async listOwnership(fullyQualifiedNamespace: string, eventHubName: string,
                             consumerGroup: string): Promise<DbPartitionOwnership[]> {

    logger.info(`Listing ownerships for ${fullyQualifiedNamespace}, ${eventHubName}, ${consumerGroup}....`);
    let ownershipRecords: Record<string, string | number>[];
    try {
      ownershipRecords = await readFromDatabase(
        DbCheckpointStore.database, DbPartitionOwnership.getSelectOwnershipsSql(DbCheckpointStore.database),
        DbPartitionOwnership.buildSelectOwnershipsSqlParameters(
            fullyQualifiedNamespace, eventHubName, consumerGroup
        ) as SqlValuesType
      );
    } catch (e) {
      logger.warn(`Error encountered: ${e.message}.`)
    }

    const ownerships: DbPartitionOwnership[] = [];
    ownershipRecords.forEach((record: Record<string, string | number>) => {
      ownerships.push(new DbPartitionOwnership(
        DbCheckpointStore.database, record.fully_qualified_namespace as string, record.event_hub_name as string,
        record.consumer_group as string, record.partition_id as string, record.owner_id as string,
        record.last_modified_time_in_ms as number, record.e_tag as string
      ));
    });
    logger.info(`${ownerships.length} partition ownership(s) returned: ${JSON.stringify(ownerships)}`);

    return ownerships;
  }

  public listCheckpoints(fullyQualifiedNamespace: string, eventHubName: string, consumerGroup: string): Promise<DbCheckpoint[]> {
    logger.info(`Listing checkpoints for ${fullyQualifiedNamespace}, ${eventHubName}, ${consumerGroup}....`);
    return readFromDatabase(DbCheckpointStore.database, DbCheckpoint.getSelectCheckpointsSql(DbCheckpointStore.database),
        DbCheckpoint.buildSelectSqlParameters(fullyQualifiedNamespace, eventHubName, consumerGroup)
    ).then((checkpoint_records: Record<string, string | number>[]) => {
      const checkpoints: DbCheckpoint[] = [];
      checkpoint_records.forEach((record: Record<string, string | number>) => {
        const checkpoint: DbCheckpoint = new DbCheckpoint(
          DbCheckpointStore.database, record.fully_qualified_namespace as string, record.event_hub_name as string,
          record.consumer_group as string, record.partition_id as string, record.sequence_number as number,
          record.offset as number, record.e_tag as string
        );
        checkpoints.push(checkpoint)
        logger.debug(`Adding checkpoint ${checkpoint} to response.`)
      });

      logger.info(`Returning ${checkpoints.length} checkpoints.`)
      return checkpoints;
    }).catch((e) => {
      logger.warn(`Error occurred: ${e.message}: ${e.stack}.`)
      throw e;
    });
  }

  public async claimOwnership(requestedPartitionOwnerships: PartitionOwnership[]): Promise<DbPartitionOwnership[]> {
    if (!requestedPartitionOwnerships || requestedPartitionOwnerships.length === 0) {
      return [];
    }

    logger.debug(`Processing claim request for ${requestedPartitionOwnerships.length} partition(s): ` +
        `${JSON.stringify(requestedPartitionOwnerships)}....`);
    const currentPartitionOwnerships: DbPartitionOwnership[] = [];
    for (const partitionOwnership of requestedPartitionOwnerships) {

      // Into our extended object
      const dbPartitionOwnership = new DbPartitionOwnership(
        DbCheckpointStore.database, partitionOwnership.fullyQualifiedNamespace, partitionOwnership.eventHubName,
        partitionOwnership.consumerGroup, partitionOwnership.partitionId, partitionOwnership.ownerId,
        partitionOwnership.lastModifiedTimeInMs, partitionOwnership.etag
      );

      // For new partition ownerships, there will have been no record in the database and thus no etag. Instead
      // of inserting 'undefined' (string) into database let's form a proper etag.
      dbPartitionOwnership.etag = dbPartitionOwnership.etag === undefined ? uuidv4() : dbPartitionOwnership.etag;

      dbPartitionOwnership.lastModifiedTimeInMs = Date.now();

      logger.info(`Processing claim for partition ownership ${dbPartitionOwnership}....`);

      // See UPSERT_OWNERSHIP_SQL logic (which performs an etag check and generates new etag) for context
      // with respect to the below
      const transactionId: string = await beginTransaction(DbCheckpointStore.database);
      let updatedPartitionOwnership: DbPartitionOwnership | undefined;
      try {
        await writeToDatabase(
            DbCheckpointStore.database, DbPartitionOwnership.getUpsertOwnershipSql(DbCheckpointStore.database),
            dbPartitionOwnership.buildOwnershipUpsertSqlParameters(), transactionId
        );
        logger.debug(`Fetching updated record from database for partition ownership ${dbPartitionOwnership} in order ` +
            `to get the latest etag generated by the row insertion/update.`);
        updatedPartitionOwnership = await dbPartitionOwnership.fetchPersistedRecordFromDatabase(transactionId) as DbPartitionOwnership;
      } catch (e) {
          logger.warn(`Error encountered during partition claim processing: ${e.message}: ${e.stack}.`);
          continue;
      } finally {
          await commitTransaction(transactionId);  // Safe now that we have updated ownership from table
      }

      if (updatedPartitionOwnership === undefined) {  // Insert/update failed, suggesting etag conflict
        logger.info(`Partition ownership ${dbPartitionOwnership} represents possible conflicting request ` +
            `for ownership of partition ${dbPartitionOwnership.partitionId}, claim request denied.`
        )
        continue;
      }
      currentPartitionOwnerships.push(updatedPartitionOwnership);
      logger.info(
        updatedPartitionOwnership.ownerId
        ? `${updatedPartitionOwnership.ownerId} claimed ownership of partition ${updatedPartitionOwnership.partitionId}, last modified time of ${updatedPartitionOwnership.lastModifiedTimeInMs}.`
        : `Partition ${updatedPartitionOwnership.partitionId} gracefully released from ownership with last modified time of ${updatedPartitionOwnership.lastModifiedTimeInMs}.`
      );

    }

    return currentPartitionOwnerships;
  }

  public async updateCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const dbCheckpoint = new DbCheckpoint(DbCheckpointStore.database, checkpoint.fullyQualifiedNamespace,
      checkpoint.eventHubName, checkpoint.consumerGroup, checkpoint.partitionId, checkpoint.sequenceNumber,
      checkpoint.offset, uuidv4()
    );
    logger.info(`Updating checkpoint to ${dbCheckpoint}....`);

    await writeToDatabase(
      DbCheckpointStore.database, DbCheckpoint.getUpsertCheckpointSql(DbCheckpointStore.database),
      dbCheckpoint.buildUpsertSqlParameters()
    );

    logger.info(`Updated checkpoint for partition ${checkpoint.partitionId} with sequence number ` +
      `${checkpoint.sequenceNumber}.`)

    }
}
