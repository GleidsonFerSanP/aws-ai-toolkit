/**
 * DynamoDB Handlers
 * Handles MCP tool calls for DynamoDB operations
 */

import { dynamodbService } from '../services/dynamodb.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

export async function handleListDynamoDBTables(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-dynamodb-tables', args);

    const { region, profileName } = args;

    const result = await dynamodbService.listTables(
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListDynamoDBTables', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleDescribeDynamoDBTable(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-dynamodb-table', args);

    const { tableName, region, profileName } = args;

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName is required');
    }

    const result = await dynamodbService.describeTable(
      tableName,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDescribeDynamoDBTable', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetDynamoDBItem(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-dynamodb-item', args);

    const { tableName, key, region, profileName } = args;

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName is required');
    }

    if (!key || typeof key !== 'object') {
      throw new Error('key is required and must be an object');
    }

    const result = await dynamodbService.getItem(
      tableName,
      key as Record<string, any>,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetDynamoDBItem', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleQueryDynamoDBTable(args: Record<string, unknown>) {
  try {
    logger.info('Handling query-dynamodb-table', args);

    const {
      tableName,
      keyConditionExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      indexName,
      limit,
      region,
      profileName,
    } = args;

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName is required');
    }

    if (!keyConditionExpression || typeof keyConditionExpression !== 'string') {
      throw new Error('keyConditionExpression is required');
    }

    const result = await dynamodbService.query(
      tableName,
      keyConditionExpression,
      expressionAttributeValues as Record<string, any> | undefined,
      expressionAttributeNames as Record<string, string> | undefined,
      indexName as string | undefined,
      limit as number | undefined,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleQueryDynamoDBTable', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleScanDynamoDBTable(args: Record<string, unknown>) {
  try {
    logger.info('Handling scan-dynamodb-table', args);

    const {
      tableName,
      filterExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      limit,
      region,
      profileName,
    } = args;

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName is required');
    }

    const result = await dynamodbService.scan(
      tableName,
      filterExpression as string | undefined,
      expressionAttributeValues as Record<string, any> | undefined,
      expressionAttributeNames as Record<string, string> | undefined,
      limit as number | undefined,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleScanDynamoDBTable', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleBatchGetDynamoDBItems(args: Record<string, unknown>) {
  try {
    logger.info('Handling batch-get-dynamodb-items', args);

    const { requestItems, region, profileName } = args;

    if (!requestItems || typeof requestItems !== 'object') {
      throw new Error('requestItems is required and must be an object');
    }

    const result = await dynamodbService.batchGetItem(
      requestItems as Record<string, any>,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleBatchGetDynamoDBItems', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleListDynamoDBBackups(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-dynamodb-backups', args);

    const { tableName, region, profileName } = args;

    const result = await dynamodbService.listBackups(
      tableName as string | undefined,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListDynamoDBBackups', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleDescribeDynamoDBBackup(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-dynamodb-backup', args);

    const { backupArn, region, profileName } = args;

    if (!backupArn || typeof backupArn !== 'string') {
      throw new Error('backupArn is required');
    }

    const result = await dynamodbService.describeBackup(
      backupArn,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDescribeDynamoDBBackup', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleListDynamoDBGlobalTables(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-dynamodb-global-tables', args);

    const { region, profileName } = args;

    const result = await dynamodbService.listGlobalTables(
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListDynamoDBGlobalTables', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

export async function handleDescribeDynamoDBTimeToLive(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-dynamodb-ttl', args);

    const { tableName, region, profileName } = args;

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName is required');
    }

    const result = await dynamodbService.describeTimeToLive(
      tableName,
      region as AWSRegion | undefined,
      profileName as string | undefined
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDescribeDynamoDBTimeToLive', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: ErrorHandler.toErrorDetails(error),
          }),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Export all DynamoDB handlers
 */
export const dynamodbHandlers = {
  'list-dynamodb-tables': handleListDynamoDBTables,
  'describe-dynamodb-table': handleDescribeDynamoDBTable,
  'get-dynamodb-item': handleGetDynamoDBItem,
  'query-dynamodb-table': handleQueryDynamoDBTable,
  'scan-dynamodb-table': handleScanDynamoDBTable,
  'batch-get-dynamodb-items': handleBatchGetDynamoDBItems,
  'list-dynamodb-backups': handleListDynamoDBBackups,
  'describe-dynamodb-backup': handleDescribeDynamoDBBackup,
  'list-dynamodb-global-tables': handleListDynamoDBGlobalTables,
  'describe-dynamodb-ttl': handleDescribeDynamoDBTimeToLive,
};
