/**
 * Unified Query Database Handler
 * Handles database operations: DynamoDB (query/scan/get/batch-get) and RDS (execute-sql)
 */

import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  GetItemCommand,
  BatchGetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { profileService } from '../../services/profile.service';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

interface QueryDatabaseArgs {
  databaseType: string;
  operation: string;
  tableName?: string;
  databaseName?: string;
  queryParams?: Record<string, any>;
  region?: string;
  profile?: string;
}

export async function handleQueryDatabase(args: QueryDatabaseArgs): Promise<CallToolResult> {
  // Get profile credentials
  const profileData = args.profile
    ? await profileService.getProfile(args.profile)
    : await profileService.getActiveProfile();

  if (!profileData || !profileData.data) {
    throw new Error(args.profile ? `Profile '${args.profile}' not found` : 'No active profile configured');
  }

  const profile = profileData.data;
  const region = args.region || profile.region;
  const credentials = {
    accessKeyId: profile.accessKeyId,
    secretAccessKey: profile.secretAccessKey,
    sessionToken: profile.sessionToken,
  };

  // Route to appropriate handler based on database type and operation
  if (args.databaseType === 'dynamodb') {
    return await handleDynamoDBOperation(region, credentials, args);
  } else if (args.databaseType === 'rds') {
    return await handleRDSOperation(region, credentials, args);
  } else {
    throw new Error(`Unsupported database type: ${args.databaseType}`);
  }
}

// ============================================================================
// DynamoDB Operations
// ============================================================================

async function handleDynamoDBOperation(
  region: string,
  credentials: any,
  args: QueryDatabaseArgs
): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });

  switch (args.operation) {
    case 'query':
      return await dynamoDBQuery(client, args);
    
    case 'scan':
      return await dynamoDBScan(client, args);
    
    case 'get-item':
      return await dynamoDBGetItem(client, args);
    
    case 'batch-get':
      return await dynamoDBBatchGet(client, args);
    
    default:
      throw new Error(`Unsupported DynamoDB operation: ${args.operation}`);
  }
}

async function dynamoDBQuery(client: DynamoDBClient, args: QueryDatabaseArgs): Promise<CallToolResult> {
  if (!args.tableName) {
    throw new Error('tableName is required for DynamoDB query operation');
  }

  const params = args.queryParams || {};
  
  // Build query command parameters
  const queryParams: any = {
    TableName: args.tableName,
  };

  // Key condition expression (required for query)
  if (params.keyConditionExpression) {
    queryParams.KeyConditionExpression = params.keyConditionExpression;
  } else if (params.partitionKey && params.partitionKeyValue) {
    queryParams.KeyConditionExpression = `${params.partitionKey} = :pk`;
    queryParams.ExpressionAttributeValues = {
      ':pk': marshall(params.partitionKeyValue),
    };
    
    // Add sort key condition if provided
    if (params.sortKey && params.sortKeyValue) {
      queryParams.KeyConditionExpression += ` AND ${params.sortKey} = :sk`;
      queryParams.ExpressionAttributeValues[':sk'] = marshall(params.sortKeyValue);
    }
  }

  // Filter expression (optional)
  if (params.filterExpression) {
    queryParams.FilterExpression = params.filterExpression;
  }

  // Projection expression (select specific attributes)
  if (params.projectionExpression) {
    queryParams.ProjectionExpression = params.projectionExpression;
  }

  // Expression attribute names (for reserved words)
  if (params.expressionAttributeNames) {
    queryParams.ExpressionAttributeNames = params.expressionAttributeNames;
  }

  // Expression attribute values (if not already set)
  if (params.expressionAttributeValues && !queryParams.ExpressionAttributeValues) {
    queryParams.ExpressionAttributeValues = params.expressionAttributeValues;
  }

  // Index name (for querying GSI/LSI)
  if (params.indexName) {
    queryParams.IndexName = params.indexName;
  }

  // Limit
  if (params.limit) {
    queryParams.Limit = params.limit;
  }

  // Scan index forward (sort order)
  if (params.scanIndexForward !== undefined) {
    queryParams.ScanIndexForward = params.scanIndexForward;
  }

  const response = await client.send(new QueryCommand(queryParams));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'query',
        tableName: args.tableName,
        count: response.Count,
        scannedCount: response.ScannedCount,
        items: response.Items?.map(item => unmarshall(item)) || [],
        lastEvaluatedKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey) : null,
      }, null, 2),
    }],
  };
}

async function dynamoDBScan(client: DynamoDBClient, args: QueryDatabaseArgs): Promise<CallToolResult> {
  if (!args.tableName) {
    throw new Error('tableName is required for DynamoDB scan operation');
  }

  const params = args.queryParams || {};
  
  const scanParams: any = {
    TableName: args.tableName,
  };

  // Filter expression
  if (params.filterExpression) {
    scanParams.FilterExpression = params.filterExpression;
  }

  // Projection expression
  if (params.projectionExpression) {
    scanParams.ProjectionExpression = params.projectionExpression;
  }

  // Expression attribute names
  if (params.expressionAttributeNames) {
    scanParams.ExpressionAttributeNames = params.expressionAttributeNames;
  }

  // Expression attribute values
  if (params.expressionAttributeValues) {
    scanParams.ExpressionAttributeValues = params.expressionAttributeValues;
  }

  // Limit
  if (params.limit) {
    scanParams.Limit = params.limit;
  }

  // Index name
  if (params.indexName) {
    scanParams.IndexName = params.indexName;
  }

  const response = await client.send(new ScanCommand(scanParams));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'scan',
        tableName: args.tableName,
        count: response.Count,
        scannedCount: response.ScannedCount,
        items: response.Items?.map(item => unmarshall(item)) || [],
        lastEvaluatedKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey) : null,
      }, null, 2),
    }],
  };
}

async function dynamoDBGetItem(client: DynamoDBClient, args: QueryDatabaseArgs): Promise<CallToolResult> {
  if (!args.tableName) {
    throw new Error('tableName is required for DynamoDB get-item operation');
  }

  const params = args.queryParams || {};
  
  if (!params.key) {
    throw new Error('key is required in queryParams for get-item operation');
  }

  const getItemParams: any = {
    TableName: args.tableName,
    Key: typeof params.key === 'object' && !Array.isArray(params.key)
      ? marshall(params.key)
      : params.key,
  };

  // Projection expression
  if (params.projectionExpression) {
    getItemParams.ProjectionExpression = params.projectionExpression;
  }

  // Expression attribute names
  if (params.expressionAttributeNames) {
    getItemParams.ExpressionAttributeNames = params.expressionAttributeNames;
  }

  const response = await client.send(new GetItemCommand(getItemParams));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'get-item',
        tableName: args.tableName,
        item: response.Item ? unmarshall(response.Item) : null,
      }, null, 2),
    }],
  };
}

async function dynamoDBBatchGet(client: DynamoDBClient, args: QueryDatabaseArgs): Promise<CallToolResult> {
  if (!args.tableName) {
    throw new Error('tableName is required for DynamoDB batch-get operation');
  }

  const params = args.queryParams || {};
  
  if (!params.keys || !Array.isArray(params.keys)) {
    throw new Error('keys array is required in queryParams for batch-get operation');
  }

  const batchGetParams = {
    RequestItems: {
      [args.tableName]: {
        Keys: params.keys.map((key: any) => marshall(key)),
        ProjectionExpression: params.projectionExpression,
        ExpressionAttributeNames: params.expressionAttributeNames,
      },
    },
  };

  const response = await client.send(new BatchGetItemCommand(batchGetParams));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'batch-get',
        tableName: args.tableName,
        items: response.Responses?.[args.tableName]?.map(item => unmarshall(item)) || [],
        unprocessedKeys: response.UnprocessedKeys,
      }, null, 2),
    }],
  };
}

// ============================================================================
// RDS Operations
// ============================================================================

async function handleRDSOperation(
  region: string,
  credentials: any,
  args: QueryDatabaseArgs
): Promise<CallToolResult> {
  const client = new RDSDataClient({ region, credentials });

  switch (args.operation) {
    case 'execute-sql':
      return await rdsExecuteSQL(client, args);
    
    default:
      throw new Error(`Unsupported RDS operation: ${args.operation}`);
  }
}

async function rdsExecuteSQL(client: RDSDataClient, args: QueryDatabaseArgs): Promise<CallToolResult> {
  const params = args.queryParams || {};
  
  if (!params.resourceArn) {
    throw new Error('resourceArn is required in queryParams for RDS execute-sql operation');
  }

  if (!params.secretArn) {
    throw new Error('secretArn is required in queryParams for RDS execute-sql operation');
  }

  if (!params.sql) {
    throw new Error('sql statement is required in queryParams for execute-sql operation');
  }

  const executeParams = {
    resourceArn: params.resourceArn,
    secretArn: params.secretArn,
    sql: params.sql,
    database: args.databaseName || params.database,
    includeResultMetadata: params.includeResultMetadata ?? true,
    parameters: params.parameters,
  };

  try {
    const response = await client.send(new ExecuteStatementCommand(executeParams));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          operation: 'execute-sql',
          database: args.databaseName || params.database,
          numberOfRecordsUpdated: response.numberOfRecordsUpdated,
          records: response.records,
          columnMetadata: response.columnMetadata,
          generatedFields: response.generatedFields,
        }, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          operation: 'execute-sql',
          error: error.message,
          note: 'RDS Data API requires Aurora Serverless or Aurora with Data API enabled',
        }, null, 2),
      }],
      isError: true,
    };
  }
}
