// Implementation of event hub PartitionOwnership to support using with RDBMS

import { PartitionOwnership } from '@azure/event-hubs';
import { SqlValuesType } from "./dataApiUtil";
import { readFromDatabase } from "./database";

// Remove schema for MySQL
const tableName = 'ctl.event_hub_partition_ownership';

export class DbPartitionOwnership implements PartitionOwnership {

  static database: string;
  fullyQualifiedNamespace: string;
  eventHubName: string;
  consumerGroup: string;
  partitionId: string;
  ownerId: string;
  lastModifiedTimeInMs: number;
  etag: string;

  constructor(database: string, fullyQualifiedNamespace: string, eventHubName: string, consumerGroup: string, partitionId: string, ownerId: string, lastModifiedTimeInMs: number, etag: string) {
    DbPartitionOwnership.database = database;
    this.fullyQualifiedNamespace = fullyQualifiedNamespace;
    this.eventHubName = eventHubName;
    this.consumerGroup = consumerGroup;
    this.partitionId = partitionId;
    this.ownerId = ownerId;
    this.lastModifiedTimeInMs = lastModifiedTimeInMs;
    this.etag = etag;
  }

  // Select specific ownership
  static getSelectOwnershipSql(database: string): string {
    return `
      SELECT fully_qualified_namespace, event_hub_name, consumer_group, partition_id, owner_id, last_modified_time_in_ms, e_tag
      FROM ${database}.${tableName}
      WHERE fully_qualified_namespace = :fully_qualified_namespace 
        AND event_hub_name = :event_hub_name 
        AND consumer_group = :consumer_group
        AND partition_id = :partition_id
        AND owner_id = :owner_id
        AND last_modified_time_in_ms = :last_modified_time_in_ms;
      `;
  }

  // All ownerships for given fqn / ehn / cg
  static getSelectOwnershipsSql(database: string): string {
    return `
      SELECT fully_qualified_namespace, event_hub_name, consumer_group, partition_id, owner_id, last_modified_time_in_ms, e_tag
      FROM ${database}.${tableName}
      WHERE fully_qualified_namespace = :fully_qualified_namespace 
        AND event_hub_name = :event_hub_name 
        AND consumer_group = :consumer_group;
      `;
  }

/**
 * Generate PostgresSQL INSERT that handles maintenance of operational fields in the partition ownership table.
 * key = fqn || ehn || cg || pid
 *
 * @param database - The name of the database to be accessed.
 *
 * MySQL Equivalent:
 *    return `
 *      INSERT INTO ${database}.${tableName} (
 *        fully_qualified_namespace, event_hub_name, consumer_group, partition_id, owner_id, last_modified_time_in_ms, e_tag
 *      )
 *      VALUES (:fully_qualified_namespace, :event_hub_name, :consumer_group, :partition_id, :owner_id, :last_modified_time_in_ms, :e_tag)
 *      ON DUPLICATE KEY UPDATE
 *        owner_id = IF (e_tag IS NULL OR e_tag = VALUES (e_tag), VALUES (owner_id), owner_id),
 *        last_modified_time_in_ms = IF (e_tag IS NULL OR e_tag = VALUES (e_tag), VALUES (last_modified_time_in_ms), last_modified_time_in_ms),
 *        e_tag = IF (e_tag IS NULL OR e_tag = VALUES (e_tag), UUID(), e_tag);
 *     `;
 */
  static getUpsertOwnershipSql(database: string): string {
    return `
      insert into ${database}.${tableName} (
        fully_qualified_namespace, event_hub_name, consumer_group, partition_id, owner_id, last_modified_time_in_ms, e_tag
      )
      values (
        :fully_qualified_namespace, :event_hub_name, :consumer_group, :partition_id, :owner_id, :last_modified_time_in_ms, :e_tag::uuid
      )
      on conflict (fully_qualified_namespace, event_hub_name, consumer_group, partition_id) do update
      set
        owner_id = case 
          when excluded.e_tag is null or excluded.e_tag = ${database}.${tableName}.e_tag
          then excluded.owner_id 
          else ${database}.${tableName}.owner_id 
        end,
        last_modified_time_in_ms = case 
          when excluded.e_tag is null or excluded.e_tag = ${database}.${tableName}.e_tag
          then excluded.last_modified_time_in_ms
          else ${database}.${tableName}.last_modified_time_in_ms 
        end,
        e_tag = case 
          when excluded.e_tag is null or excluded.e_tag = ${database}.${tableName}.e_tag
          then gen_random_uuid()
          else ${database}.${tableName}.e_tag::uuid
        end;
      `;
  }

  static buildSelectOwnershipsSqlParameters(fullyQualifiedNamespace: string, eventHubName: string, consumerGroup: string): SqlValuesType {

    return {
      fully_qualified_namespace: fullyQualifiedNamespace,
      event_hub_name: eventHubName,
      consumer_group: consumerGroup
    }
  }

  public buildSelectOwnershipSqlParameters(): SqlValuesType {

    return {
      fully_qualified_namespace: this.fullyQualifiedNamespace,
      event_hub_name: this.eventHubName,
      consumer_group: this.consumerGroup,
      partition_id: this.partitionId,
      owner_id: this.ownerId,
      last_modified_time_in_ms: this.lastModifiedTimeInMs
    }
  }

  public buildOwnershipUpsertSqlParameters(): SqlValuesType {

    return {
      fully_qualified_namespace: this.fullyQualifiedNamespace,
      event_hub_name: this.eventHubName,
      consumer_group: this.consumerGroup,
      partition_id: this.partitionId,
      owner_id: this.ownerId,
      last_modified_time_in_ms: this.lastModifiedTimeInMs,
      e_tag: this.etag
    }
  }

  public async fetchPersistedRecordFromDatabase(transactionID?: string): Promise<DbPartitionOwnership | undefined> {

    const rows: Record<string, unknown>[] = await readFromDatabase(
      DbPartitionOwnership.database, DbPartitionOwnership.getSelectOwnershipSql(DbPartitionOwnership.database),
      this.buildSelectOwnershipSqlParameters() as SqlValuesType, transactionID
    )
    if (rows.length === 0) {
      return undefined
    } else {  // Database constraints mean never having more than 1
      const row = rows[0];
      return new DbPartitionOwnership(DbPartitionOwnership.database, row.fully_qualified_namespace as string,
        row.event_hub_name as string, row.consumer_group as string, row.partition_id as string, row.owner_id as string,
        row.last_modified_time_in_ms as number, row.e_tag as string);
    }
  }

  toString(): string {
    return `DbPartitionOwnership(database: ${DbPartitionOwnership.database}, fullyQualifiedNamespace: ${this.fullyQualifiedNamespace}, ` +
      `eventHubName: ${this.eventHubName}, consumerGroup: ${this.consumerGroup}, partitionId: ${this.partitionId}, ` +
      `ownerId: ${this.ownerId}, etag: ${this.etag})`;
  }
}
