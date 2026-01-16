/**
 * CloudWatch Logs Service
 * AWS CloudWatch Logs operations for log streaming and querying
 */

import {
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
  QueryStatus,
} from '@aws-sdk/client-cloudwatch-logs';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface LogGroup {
  logGroupName: string;
  creationTime?: number;
  retentionInDays?: number;
  storedBytes?: number;
  metricFilterCount?: number;
  arn?: string;
}

export interface LogStream {
  logStreamName: string;
  creationTime?: number;
  firstEventTimestamp?: number;
  lastEventTimestamp?: number;
  lastIngestionTime?: number;
  uploadSequenceToken?: string;
  arn?: string;
  storedBytes?: number;
}

export interface LogEvent {
  timestamp?: number;
  message?: string;
  ingestionTime?: number;
  eventId?: string;
}

export interface LogQueryResult {
  queryId: string;
  status: QueryStatus | string;
  results?: Array<Record<string, string>>;
  statistics?: {
    recordsMatched?: number;
    recordsScanned?: number;
    bytesScanned?: number;
  };
}

/**
 * CloudWatch Logs Service
 * Manages CloudWatch Logs operations
 */
export class CloudWatchLogsService {
  private static instance: CloudWatchLogsService;

  private constructor() {
    logger.info('CloudWatch Logs Service initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CloudWatchLogsService {
    if (!CloudWatchLogsService.instance) {
      CloudWatchLogsService.instance = new CloudWatchLogsService();
    }
    return CloudWatchLogsService.instance;
  }

  /**
   * List log groups
   */
  public async listLogGroups(
    region?: AWSRegion,
    profileName?: string,
    prefix?: string
  ): Promise<BaseResponse<LogGroup[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      // Check cache
      const cacheKey = cache.generateKey('cloudwatch-logs', 'list-groups', effectiveRegion, prefix || 'all');
      const cached = cache.get<LogGroup[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached log groups');
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

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: prefix,
      });

      const response = await cwLogsClient.send(command);

      const logGroups: LogGroup[] = (response.logGroups || []).map((lg) => ({
        logGroupName: lg.logGroupName || '',
        creationTime: lg.creationTime,
        retentionInDays: lg.retentionInDays,
        storedBytes: lg.storedBytes,
        metricFilterCount: lg.metricFilterCount,
        arn: lg.arn,
      }));

      // Cache for 5 minutes
      cache.set(cacheKey, logGroups, 300);

      logger.info(`Listed ${logGroups.length} log groups in ${effectiveRegion}`);

      return {
        success: true,
        data: logGroups,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: logGroups.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing log groups', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List log streams in a log group
   */
  public async listLogStreams(
    logGroupName: string,
    region?: AWSRegion,
    profileName?: string,
    prefix?: string,
    limit?: number
  ): Promise<BaseResponse<LogStream[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new DescribeLogStreamsCommand({
        logGroupName,
        logStreamNamePrefix: prefix,
        limit: limit || 50,
        orderBy: 'LastEventTime',
        descending: true,
      });

      const response = await cwLogsClient.send(command);

      const logStreams: LogStream[] = (response.logStreams || []).map((ls) => ({
        logStreamName: ls.logStreamName || '',
        creationTime: ls.creationTime,
        firstEventTimestamp: ls.firstEventTimestamp,
        lastEventTimestamp: ls.lastEventTimestamp,
        lastIngestionTime: ls.lastIngestionTime,
        uploadSequenceToken: ls.uploadSequenceToken,
        arn: ls.arn,
        storedBytes: ls.storedBytes,
      }));

      logger.info(`Listed ${logStreams.length} log streams in ${logGroupName}`);

      return {
        success: true,
        data: logStreams,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          logGroupName,
          count: logStreams.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing log streams', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get log events from a specific log stream
   */
  public async getLogEvents(
    logGroupName: string,
    logStreamName: string,
    region?: AWSRegion,
    profileName?: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<BaseResponse<LogEvent[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new GetLogEventsCommand({
        logGroupName,
        logStreamName,
        startTime,
        endTime,
        limit: limit || 100,
        startFromHead: false, // Get newest first
      });

      const response = await cwLogsClient.send(command);

      const events: LogEvent[] = (response.events || []).map((event) => ({
        timestamp: event.timestamp,
        message: event.message,
        ingestionTime: event.ingestionTime,
      }));

      logger.info(`Retrieved ${events.length} log events from ${logStreamName}`);

      return {
        success: true,
        data: events,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          logGroupName,
          logStreamName,
          count: events.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error getting log events', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Tail logs (get latest events) - like "tail -f"
   */
  public async tailLogs(
    logGroupName: string,
    region?: AWSRegion,
    profileName?: string,
    limit?: number,
    filterPattern?: string
  ): Promise<BaseResponse<LogEvent[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new FilterLogEventsCommand({
        logGroupName,
        filterPattern,
        limit: limit || 100,
        // Get events from last 5 minutes by default
        startTime: Date.now() - (5 * 60 * 1000),
      });

      const response = await cwLogsClient.send(command);

      const events: LogEvent[] = (response.events || []).map((event) => ({
        timestamp: event.timestamp,
        message: event.message,
        ingestionTime: event.ingestionTime,
        eventId: event.eventId,
      }));

      logger.info(`Tailed ${events.length} log events from ${logGroupName}`);

      return {
        success: true,
        data: events,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          logGroupName,
          count: events.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error tailing logs', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Filter log events across multiple log streams
   */
  public async filterLogEvents(
    logGroupName: string,
    filterPattern: string,
    region?: AWSRegion,
    profileName?: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<BaseResponse<LogEvent[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new FilterLogEventsCommand({
        logGroupName,
        filterPattern,
        startTime,
        endTime,
        limit: limit || 1000,
      });

      const response = await cwLogsClient.send(command);

      const events: LogEvent[] = (response.events || []).map((event) => ({
        timestamp: event.timestamp,
        message: event.message,
        ingestionTime: event.ingestionTime,
        eventId: event.eventId,
      }));

      logger.info(`Filtered ${events.length} log events from ${logGroupName}`);

      return {
        success: true,
        data: events,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          logGroupName,
          filterPattern,
          count: events.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error filtering log events', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Start CloudWatch Insights query
   */
  public async startQuery(
    logGroupName: string,
    queryString: string,
    startTime: number,
    endTime: number,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<{ queryId: string }>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new StartQueryCommand({
        logGroupName,
        queryString,
        startTime,
        endTime,
      });

      const response = await cwLogsClient.send(command);

      if (!response.queryId) {
        throw new Error('Failed to start query');
      }

      logger.info(`Started CloudWatch Insights query: ${response.queryId}`);

      return {
        success: true,
        data: { queryId: response.queryId },
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          logGroupName,
        } as any,
      };
    } catch (error) {
      logger.error('Error starting query', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get CloudWatch Insights query results
   */
  public async getQueryResults(
    queryId: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<LogQueryResult>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cwLogsClient = awsClientFactory.getCloudWatchLogsClient(effectiveRegion, credentials);

      const command = new GetQueryResultsCommand({
        queryId,
      });

      const response = await cwLogsClient.send(command);

      const results: Array<Record<string, string>> = (response.results || []).map((result) => {
        const record: Record<string, string> = {};
        result.forEach((field) => {
          if (field.field && field.value) {
            record[field.field] = field.value;
          }
        });
        return record;
      });

      const queryResult: LogQueryResult = {
        queryId,
        status: response.status || 'Unknown',
        results,
        statistics: {
          recordsMatched: response.statistics?.recordsMatched,
          recordsScanned: response.statistics?.recordsScanned,
          bytesScanned: response.statistics?.bytesScanned,
        },
      };

      logger.info(`Retrieved query results for ${queryId}: ${response.status}`);

      return {
        success: true,
        data: queryResult,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error getting query results', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Query logs with Insights (convenience method that starts query and polls for results)
   */
  public async queryLogs(
    logGroupName: string,
    queryString: string,
    startTime: number,
    endTime: number,
    region?: AWSRegion,
    profileName?: string,
    maxWaitSeconds: number = 30
  ): Promise<BaseResponse<LogQueryResult>> {
    try {
      // Start the query
      const startResult = await this.startQuery(
        logGroupName,
        queryString,
        startTime,
        endTime,
        region,
        profileName
      );

      if (!startResult.success || !startResult.data) {
        return {
          success: false,
          error: startResult.error || { message: 'Failed to start query', code: 'StartQueryFailed', timestamp: new Date().toISOString() },
        };
      }

      const queryId = startResult.data.queryId;

      // Poll for results
      const startPolling = Date.now();
      let attempts = 0;

      while (Date.now() - startPolling < maxWaitSeconds * 1000) {
        attempts++;
        
        const resultResponse = await this.getQueryResults(queryId, region, profileName);

        if (!resultResponse.success || !resultResponse.data) {
          return resultResponse;
        }

        const status = resultResponse.data.status;

        if (status === 'Complete') {
          logger.info(`Query completed after ${attempts} attempts`);
          return resultResponse;
        }

        if (status === 'Failed' || status === 'Cancelled' || status === 'Timeout') {
          return {
            success: false,
            error: {
              message: `Query ${status.toLowerCase()}`,
              code: `Query${status}`,
              timestamp: new Date().toISOString(),
            },
          };
        }

        // Wait 1 second before next poll
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Timeout reached
      return {
        success: false,
        error: {
          message: `Query timeout after ${maxWaitSeconds} seconds`,
          code: 'QueryTimeout',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error querying logs', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

// Export singleton instance
export const cloudWatchLogsService = CloudWatchLogsService.getInstance();
