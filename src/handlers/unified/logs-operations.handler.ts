/**
 * Unified Logs Operations Handler
 * Handles CloudWatch Logs operations: list groups/streams, get events, tail, filter, insights
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials, getRegion } from '../../utils';

interface LogsOperationsArgs {
  operation: string;
  logGroup?: string;
  logStream?: string;
  query?: string;
  queryId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  region?: string;
  profile?: string;
}

export async function handleLogsOperations(args: LogsOperationsArgs): Promise<CallToolResult> {
  // Get credentials intelligently
  const region = getRegion(args.region);
  const credResult = await getIntelligentCredentials(args.profile, region);
  
  if (credResult.needsConfiguration) {
    return {
      content: [{ type: 'text', text: credResult.message || 'AWS credentials not configured.' }],
      isError: false,
    };
  }

  const credentials = credResult.credentials!;

  const client = new CloudWatchLogsClient({ region, credentials });

  // Route to appropriate operation
  switch (args.operation) {
    case 'list-groups':
      return await listLogGroups(client, args);
    
    case 'list-streams':
      return await listLogStreams(client, args);
    
    case 'get-events':
      return await getLogEvents(client, args);
    
    case 'tail':
      return await tailLogs(client, args);
    
    case 'filter':
      return await filterLogEvents(client, args);
    
    case 'insights-query':
      return await startInsightsQuery(client, args);
    
    case 'insights-results':
      return await getInsightsResults(client, args);
    
    default:
      throw new Error(`Unsupported logs operation: ${args.operation}`);
  }
}

// ============================================================================
// List Log Groups
// ============================================================================

async function listLogGroups(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  const params: any = {};

  if (args.query) {
    params.logGroupNamePrefix = args.query;
  }

  if (args.limit) {
    params.limit = args.limit;
  }

  const response = await client.send(new DescribeLogGroupsCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'list-groups',
        count: response.logGroups?.length || 0,
        logGroups: response.logGroups?.map(group => ({
          name: group.logGroupName,
          arn: group.arn,
          creationTime: group.creationTime,
          storedBytes: group.storedBytes,
          retentionInDays: group.retentionInDays,
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// List Log Streams
// ============================================================================

async function listLogStreams(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.logGroup) {
    throw new Error('logGroup is required for list-streams operation');
  }

  const params: any = {
    logGroupName: args.logGroup,
  };

  if (args.query) {
    params.logStreamNamePrefix = args.query;
  }

  if (args.limit) {
    params.limit = args.limit;
  }

  const response = await client.send(new DescribeLogStreamsCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'list-streams',
        logGroup: args.logGroup,
        count: response.logStreams?.length || 0,
        logStreams: response.logStreams?.map(stream => ({
          name: stream.logStreamName,
          creationTime: stream.creationTime,
          firstEventTimestamp: stream.firstEventTimestamp,
          lastEventTimestamp: stream.lastEventTimestamp,
          lastIngestionTime: stream.lastIngestionTime,
          storedBytes: stream.storedBytes,
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Log Events
// ============================================================================

async function getLogEvents(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.logGroup) {
    throw new Error('logGroup is required for get-events operation');
  }

  if (!args.logStream) {
    throw new Error('logStream is required for get-events operation');
  }

  const params: any = {
    logGroupName: args.logGroup,
    logStreamName: args.logStream,
  };

  // Parse timestamps (ISO 8601 or epoch milliseconds)
  if (args.startTime) {
    params.startTime = parseTimestamp(args.startTime);
  }

  if (args.endTime) {
    params.endTime = parseTimestamp(args.endTime);
  }

  if (args.limit) {
    params.limit = args.limit;
  }

  const response = await client.send(new GetLogEventsCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'get-events',
        logGroup: args.logGroup,
        logStream: args.logStream,
        count: response.events?.length || 0,
        events: response.events?.map(event => ({
          timestamp: new Date(event.timestamp!).toISOString(),
          message: event.message,
          ingestionTime: event.ingestionTime,
        })) || [],
        nextForwardToken: response.nextForwardToken,
        nextBackwardToken: response.nextBackwardToken,
      }, null, 2),
    }],
  };
}

// ============================================================================
// Tail Logs (Get Latest Events)
// ============================================================================

async function tailLogs(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.logGroup) {
    throw new Error('logGroup is required for tail operation');
  }

  // Get the most recent log stream
  const streamsResponse = await client.send(new DescribeLogStreamsCommand({
    logGroupName: args.logGroup,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 1,
  }));

  const latestStream = streamsResponse.logStreams?.[0];
  if (!latestStream) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          operation: 'tail',
          logGroup: args.logGroup,
          message: 'No log streams found',
          events: [],
        }, null, 2),
      }],
    };
  }

  // Get recent events from the latest stream
  const eventsResponse = await client.send(new GetLogEventsCommand({
    logGroupName: args.logGroup,
    logStreamName: latestStream.logStreamName!,
    limit: args.limit || 50,
    startFromHead: false, // Get most recent events
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'tail',
        logGroup: args.logGroup,
        logStream: latestStream.logStreamName,
        count: eventsResponse.events?.length || 0,
        events: eventsResponse.events?.map(event => ({
          timestamp: new Date(event.timestamp!).toISOString(),
          message: event.message,
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Filter Log Events
// ============================================================================

async function filterLogEvents(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.logGroup) {
    throw new Error('logGroup is required for filter operation');
  }

  const params: any = {
    logGroupName: args.logGroup,
  };

  // Filter pattern
  if (args.query) {
    params.filterPattern = args.query;
  }

  // Log stream name
  if (args.logStream) {
    params.logStreamNames = [args.logStream];
  }

  // Time range
  if (args.startTime) {
    params.startTime = parseTimestamp(args.startTime);
  }

  if (args.endTime) {
    params.endTime = parseTimestamp(args.endTime);
  }

  if (args.limit) {
    params.limit = args.limit;
  }

  const response = await client.send(new FilterLogEventsCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'filter',
        logGroup: args.logGroup,
        filterPattern: args.query || 'none',
        count: response.events?.length || 0,
        events: response.events?.map(event => ({
          logStreamName: event.logStreamName,
          timestamp: new Date(event.timestamp!).toISOString(),
          message: event.message,
          eventId: event.eventId,
        })) || [],
        nextToken: response.nextToken,
        searchedLogStreams: response.searchedLogStreams,
      }, null, 2),
    }],
  };
}

// ============================================================================
// CloudWatch Logs Insights - Start Query
// ============================================================================

async function startInsightsQuery(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.logGroup) {
    throw new Error('logGroup is required for insights-query operation');
  }

  if (!args.query) {
    throw new Error('query is required for insights-query operation');
  }

  // Default to last hour if not specified
  const endTime = args.endTime ? parseTimestamp(args.endTime) : Date.now();
  const startTime = args.startTime ? parseTimestamp(args.startTime) : endTime - (60 * 60 * 1000); // 1 hour ago

  const response = await client.send(new StartQueryCommand({
    logGroupName: args.logGroup,
    queryString: args.query,
    startTime: Math.floor(startTime / 1000), // Convert to seconds
    endTime: Math.floor(endTime / 1000), // Convert to seconds
    limit: args.limit || 1000,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'insights-query',
        queryId: response.queryId,
        logGroup: args.logGroup,
        query: args.query,
        message: 'Query started. Use insights-results operation with this queryId to get results.',
      }, null, 2),
    }],
  };
}

// ============================================================================
// CloudWatch Logs Insights - Get Results
// ============================================================================

async function getInsightsResults(client: CloudWatchLogsClient, args: LogsOperationsArgs): Promise<CallToolResult> {
  if (!args.queryId) {
    throw new Error('queryId is required for insights-results operation');
  }

  const response = await client.send(new GetQueryResultsCommand({
    queryId: args.queryId,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'insights-results',
        queryId: args.queryId,
        status: response.status,
        results: response.results,
        statistics: response.statistics,
      }, null, 2),
    }],
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseTimestamp(timestamp: string): number {
  // Check if it's already epoch milliseconds (numeric string)
  if (/^\d+$/.test(timestamp)) {
    return parseInt(timestamp, 10);
  }

  // Parse as ISO 8601 date
  const parsed = Date.parse(timestamp);
  if (isNaN(parsed)) {
    throw new Error(`Invalid timestamp format: ${timestamp}. Use ISO 8601 or epoch milliseconds.`);
  }

  return parsed;
}
