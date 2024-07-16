// Implementation of event hub Checkpoint to support using with RDBMS

import { Checkpoint } from "@azure/event-hubs";
import { SqlValuesType } from "./dataApiUtil";
import { readFromDatabase } from "./database";

const tableName = 'ctl.event_hub_checkpoint';

export class DbCheckpoint implements Checkpoint {

  static database: string;
  fullyQualifiedNamespace: string;
  eventHubName: string;
  consumerGroup: string;
  partitionId: string;
  sequenceNumber: number;
  offset: number;
  etag: string;

  constructor(database: string, fullyQualifiedNamespace: string, eventHubName: string, consumerGroup: string, partitionId: string,
                sequenceNumber: number, offset: number, etag: string) {
    DbCheckpoint.database = database;
    this.fullyQualifiedNamespace = fullyQualifiedNamespace;
    this.eventHubName = eventHubName;
    this.consumerGroup = consumerGroup;
    this.partitionId = partitionId;
    this.sequenceNumber = sequenceNumber;
    this.offset = offset;
    this.etag = etag;
  }

  static getSelectCheckpointsSql(database: string): string {
    return `
      SELECT fully_qualified_namespace, event_hub_name, consumer_group, partition_id, sequence_number, "offset", e_tag
      FROM ${database}.${tableName}
      WHERE fully_qualified_namespace = :fully_qualified_namespace 
        AND event_hub_name = :event_hub_name AND consumer_group = :consumer_group;
      `;
  }

  /**
 * Generate PostgresSQL INSERT that handles maintenance of offset value in checkpoint table.
 * key = fqn || ehn || cg || pid
 *
 * @param database - The name of the database to be accessed.
 *
 * MySQL Equivalent:
 *    return `
 *      INSERT INTO ${database}.${tableName} (
 *        fully_qualified_namespace, event_hub_name, consumer_group, partition_id, "offset", sequence_number, e_tag
 *      ) VALUES (
 *        :fully_qualified_namespace, :event_hub_name, :consumer_group, :partition_id, :offset, :sequence_number, :e_tag
 *      ) ON duplicate KEY UPDATE
 *        offset = VALUES(offset), sequence_number = VALUES(sequence_number);
 *      `;
 */
  static getUpsertCheckpointSql(database: string): string {
    return `
      insert into ${database}.${tableName} (
        fully_qualified_namespace, event_hub_name, consumer_group, partition_id, "offset", sequence_number, e_tag
      ) values (
        :fully_qualified_namespace, :event_hub_name, :consumer_group, :partition_id, :offset, :sequence_number, :e_tag::uuid
      )
      on conflict (fully_qualified_namespace, event_hub_name, consumer_group, partition_id) do update
      set
        "offset" = excluded."offset",
        sequence_number = excluded.sequence_number;
      `;
  }

  static getUpdateCheckpointTimestampSql(database: string): string {
    return `
      UPDATE ${database}.${tableName}
      SET sequence_number = sequence_number
      WHERE fully_qualified_namespace = :fully_qualified_namespace
        AND event_hub_name = :event_hub_name AND consumer_group = :consumer_group
        AND partition_id = :partition_id;
      `;
  }

  static buildSelectSqlParameters(fullyQualifiedNamespace: string, eventHubName: string,
                                  consumerGroup: string): SqlValuesType {

    return {
      fully_qualified_namespace: fullyQualifiedNamespace,
      event_hub_name: eventHubName,
      consumer_group: consumerGroup
    }
  }

  buildUpsertSqlParameters(): SqlValuesType {

    return {
      fully_qualified_namespace: this.fullyQualifiedNamespace,
      event_hub_name: this.eventHubName,
      consumer_group: this.consumerGroup,
      partition_id: this.partitionId,
      offset: this.offset,
      sequence_number: this.sequenceNumber,
      e_tag: this.etag
    }
  }

  toString(): string {
    return `DbCheckpoint(database: ${DbCheckpoint.database}, fullyQualifiedNamespace: ${this.fullyQualifiedNamespace}, ` +
      `eventHubName: ${this.eventHubName}, consumerGroup: ${this.consumerGroup}, partitionId: ${this.partitionId}, ` +
      `sequenceNumber: ${this.sequenceNumber}, offset: ${this.offset}, etag: ${this.etag})`;
  }

  static async getCurrentCheckpoint(database: string, fullyQualifiedNamespace: string, eventHubName: string,
                                    consumerGroup: string | undefined, partitionId: string): Promise<DbCheckpoint | undefined> {

    const parameters: SqlValuesType = {
      fully_qualified_namespace: fullyQualifiedNamespace, event_hub_name: eventHubName,
      consumer_group: consumerGroup, partition_id: partitionId
    }
    const records: SqlValuesType[] = await readFromDatabase(database, `
        SELECT fully_qualified_namespace, event_hub_name, consumer_group, partition_id, "offset", sequence_number, e_tag
        FROM ${database}.${tableName}
        WHERE fully_qualified_namespace = :fully_qualified_namespace AND event_hub_name = :event_hub_name
          AND consumer_group = :consumer_group AND partition_id = :partition_id;
    `, parameters
    );

    if (records !== undefined && records.length > 0) {
      const r: SqlValuesType = records[0];
      return new DbCheckpoint(DbCheckpoint.database, r.fully_qualified_namespace as string, r.event_hub_name as string,
        r.consumer_group as string, r.partition_id as string, r.sequence_number as number, r.offset as number,
        r.e_tag as string
      )
    } else {
      return undefined;
    }
  }
}


