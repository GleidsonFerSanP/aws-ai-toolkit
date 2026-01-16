/**
 * DynamoDB Service
 * AWS DynamoDB operations
 */

import {
  ListTablesCommand,
  DescribeTableCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  BatchGetItemCommand,
  ListBackupsCommand,
  DescribeBackupCommand,
  ListGlobalTablesCommand,
  DescribeTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface DynamoDBTable {
  tableName: string;
  tableArn?: string;
  tableStatus?: string;
  creationDateTime?: string;
  itemCount?: number;
  tableSizeBytes?: number;
  keySchema?: any[];
  attributeDefinitions?: any[];
  provisionedThroughput?: any;
  billingModeSummary?: any;
  streamSpecification?: any;
  globalSecondaryIndexes?: any[];
  localSecondaryIndexes?: any[];
  tags?: Array<{ key?: string; value?: string }>;
}

export interface DynamoDBBackup {
  backupArn?: string;
  backupName?: string;
  backupStatus?: string;
  backupType?: string;
  backupCreationDateTime?: string;
  backupSizeBytes?: number;
  tableName?: string;
  tableArn?: string;
}

export interface DynamoDBGlobalTable {
  globalTableName?: string;
  globalTableArn?: string;
  creationDateTime?: string;
  globalTableStatus?: string;
  replicationGroup?: any[];
}

/**
 * DynamoDB Service
 * Manages AWS DynamoDB operations
 */
export class DynamoDBService {
  private static instance: DynamoDBService;

  private constructor() {
    logger.info('DynamoDB Service initialized');
  }

  public static getInstance(): DynamoDBService {
    if (!DynamoDBService.instance) {
      DynamoDBService.instance = new DynamoDBService();
    }
    return DynamoDBService.instance;
  }

  /**
   * List DynamoDB tables
   */
  public async listTables(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey('dynamodb', 'list-tables', effectiveRegion);
      const cached = cache.get<string[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached DynamoDB tables');
        return {
          success: true,
          data: cached,
          metadata: {
            timestamp: new Date().toISOString(),
            region: effectiveRegion,
            cached: true,
          } as any,
        };
      }

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new ListTablesCommand({});
      const response = await dynamodbClient.send(command);

      const tables = response.TableNames || [];

      cache.set(cacheKey, tables, 300);

      logger.info(`Listed ${tables.length} DynamoDB tables in ${effectiveRegion}`);

      return {
        success: true,
        data: tables,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: tables.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing DynamoDB tables', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe DynamoDB table
   */
  public async describeTable(
    tableName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<DynamoDBTable>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamodbClient.send(command);

      if (!response.Table) {
        throw new Error(`Table ${tableName} not found`);
      }

      const table = response.Table;

      const tableInfo: DynamoDBTable = {
        tableName: table.TableName || '',
        tableArn: table.TableArn,
        tableStatus: table.TableStatus,
        creationDateTime: table.CreationDateTime?.toISOString(),
        itemCount: table.ItemCount,
        tableSizeBytes: table.TableSizeBytes,
        keySchema: table.KeySchema,
        attributeDefinitions: table.AttributeDefinitions,
        provisionedThroughput: table.ProvisionedThroughput,
        billingModeSummary: table.BillingModeSummary,
        streamSpecification: table.StreamSpecification,
        globalSecondaryIndexes: table.GlobalSecondaryIndexes,
        localSecondaryIndexes: table.LocalSecondaryIndexes,
      };

      logger.info(`Described DynamoDB table ${tableName}`);

      return {
        success: true,
        data: tableInfo,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing DynamoDB table', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get item from DynamoDB table
   */
  public async getItem(
    tableName: string,
    key: Record<string, any>,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<Record<string, any> | null>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new GetItemCommand({
        TableName: tableName,
        Key: key,
      });

      const response = await dynamodbClient.send(command);

      const item = response.Item ? unmarshall(response.Item) : null;

      logger.info(`Retrieved item from DynamoDB table ${tableName}`);

      return {
        success: true,
        data: item,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error getting item from DynamoDB', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Query DynamoDB table
   */
  public async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
    indexName?: string,
    limit?: number,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<Record<string, any>[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        IndexName: indexName,
        Limit: limit,
      });

      const response = await dynamodbClient.send(command);

      const items = (response.Items || []).map((item) => unmarshall(item));

      logger.info(`Queried ${items.length} items from DynamoDB table ${tableName}`);

      return {
        success: true,
        data: items,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: items.length,
          scannedCount: response.ScannedCount,
          lastEvaluatedKey: response.LastEvaluatedKey,
        } as any,
      };
    } catch (error) {
      logger.error('Error querying DynamoDB table', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Scan DynamoDB table
   */
  public async scan(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
    limit?: number,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<Record<string, any>[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        Limit: limit,
      });

      const response = await dynamodbClient.send(command);

      const items = (response.Items || []).map((item) => unmarshall(item));

      logger.info(`Scanned ${items.length} items from DynamoDB table ${tableName}`);

      return {
        success: true,
        data: items,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: items.length,
          scannedCount: response.ScannedCount,
          lastEvaluatedKey: response.LastEvaluatedKey,
        } as any,
      };
    } catch (error) {
      logger.error('Error scanning DynamoDB table', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Batch get items from DynamoDB
   */
  public async batchGetItem(
    requestItems: Record<string, any>,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<Record<string, any>>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new BatchGetItemCommand({
        RequestItems: requestItems,
      });

      const response = await dynamodbClient.send(command);

      const results: Record<string, any[]> = {};
      if (response.Responses) {
        for (const [tableName, items] of Object.entries(response.Responses)) {
          results[tableName] = items.map((item) => unmarshall(item));
        }
      }

      logger.info('Batch get items from DynamoDB completed');

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          unprocessedKeys: response.UnprocessedKeys,
        } as any,
      };
    } catch (error) {
      logger.error('Error batch getting items from DynamoDB', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List DynamoDB backups
   */
  public async listBackups(
    tableName?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<DynamoDBBackup[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new ListBackupsCommand({
        TableName: tableName,
      });

      const response = await dynamodbClient.send(command);

      const backups: DynamoDBBackup[] = (response.BackupSummaries || []).map((backup) => ({
        backupArn: backup.BackupArn,
        backupName: backup.BackupName,
        backupStatus: backup.BackupStatus,
        backupType: backup.BackupType,
        backupCreationDateTime: backup.BackupCreationDateTime?.toISOString(),
        backupSizeBytes: backup.BackupSizeBytes,
        tableName: backup.TableName,
        tableArn: backup.TableArn,
      }));

      logger.info(`Listed ${backups.length} DynamoDB backups`);

      return {
        success: true,
        data: backups,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: backups.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing DynamoDB backups', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe DynamoDB backup
   */
  public async describeBackup(
    backupArn: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<any>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new DescribeBackupCommand({
        BackupArn: backupArn,
      });

      const response = await dynamodbClient.send(command);

      logger.info(`Described DynamoDB backup ${backupArn}`);

      return {
        success: true,
        data: response.BackupDescription,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing DynamoDB backup', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List DynamoDB global tables
   */
  public async listGlobalTables(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<DynamoDBGlobalTable[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new ListGlobalTablesCommand({});

      const response = await dynamodbClient.send(command);

      const globalTables: DynamoDBGlobalTable[] = (response.GlobalTables || []).map((table) => ({
        globalTableName: table.GlobalTableName,
        replicationGroup: table.ReplicationGroup,
      }));

      logger.info(`Listed ${globalTables.length} DynamoDB global tables`);

      return {
        success: true,
        data: globalTables,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: globalTables.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing DynamoDB global tables', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe Time to Live (TTL) settings
   */
  public async describeTimeToLive(
    tableName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<any>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const dynamodbClient = awsClientFactory.getDynamoDBClient(effectiveRegion, credentials);

      const command = new DescribeTimeToLiveCommand({
        TableName: tableName,
      });

      const response = await dynamodbClient.send(command);

      logger.info(`Described TTL for DynamoDB table ${tableName}`);

      return {
        success: true,
        data: response.TimeToLiveDescription,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing DynamoDB TTL', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const dynamodbService = DynamoDBService.getInstance();
