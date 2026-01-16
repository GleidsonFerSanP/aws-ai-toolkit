/**
 * CloudWatch Logs Handlers
 * Handles MCP tool calls for CloudWatch Logs operations
 */

import { cloudWatchLogsService } from '../services/cloudwatch-logs.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

/**
 * Handle list-log-groups tool
 */
export async function handleListLogGroups(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-log-groups', args);

    const { region, profileName, prefix } = args;

    const result = await cloudWatchLogsService.listLogGroups(
      region as AWSRegion | undefined,
      profileName as string | undefined,
      prefix as string | undefined
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
    logger.error('Error in handleListLogGroups', error as Error);
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
 * Handle list-log-streams tool
 */
export async function handleListLogStreams(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-log-streams', args);

    const { logGroupName, region, profileName, prefix, limit } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    const result = await cloudWatchLogsService.listLogStreams(
      logGroupName,
      region as AWSRegion | undefined,
      profileName as string | undefined,
      prefix as string | undefined,
      limit as number | undefined
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
    logger.error('Error in handleListLogStreams', error as Error);
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
 * Handle get-log-events tool
 */
export async function handleGetLogEvents(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-log-events', args);

    const { logGroupName, logStreamName, region, profileName, startTime, endTime, limit } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    if (!logStreamName || typeof logStreamName !== 'string') {
      throw new Error('logStreamName is required');
    }

    const result = await cloudWatchLogsService.getLogEvents(
      logGroupName,
      logStreamName,
      region as AWSRegion | undefined,
      profileName as string | undefined,
      startTime as number | undefined,
      endTime as number | undefined,
      limit as number | undefined
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
    logger.error('Error in handleGetLogEvents', error as Error);
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
 * Handle tail-logs tool
 */
export async function handleTailLogs(args: Record<string, unknown>) {
  try {
    logger.info('Handling tail-logs', args);

    const { logGroupName, region, profileName, limit, filterPattern } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    const result = await cloudWatchLogsService.tailLogs(
      logGroupName,
      region as AWSRegion | undefined,
      profileName as string | undefined,
      limit as number | undefined,
      filterPattern as string | undefined
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
    logger.error('Error in handleTailLogs', error as Error);
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
 * Handle filter-log-events tool
 */
export async function handleFilterLogEvents(args: Record<string, unknown>) {
  try {
    logger.info('Handling filter-log-events', args);

    const { logGroupName, filterPattern, region, profileName, startTime, endTime, limit } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    if (!filterPattern || typeof filterPattern !== 'string') {
      throw new Error('filterPattern is required');
    }

    const result = await cloudWatchLogsService.filterLogEvents(
      logGroupName,
      filterPattern,
      region as AWSRegion | undefined,
      profileName as string | undefined,
      startTime as number | undefined,
      endTime as number | undefined,
      limit as number | undefined
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
    logger.error('Error in handleFilterLogEvents', error as Error);
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
 * Handle start-insights-query tool
 */
export async function handleStartInsightsQuery(args: Record<string, unknown>) {
  try {
    logger.info('Handling start-insights-query', args);

    const { logGroupName, queryString, startTime, endTime, region, profileName } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    if (!queryString || typeof queryString !== 'string') {
      throw new Error('queryString is required');
    }

    if (typeof startTime !== 'number') {
      throw new Error('startTime is required');
    }

    if (typeof endTime !== 'number') {
      throw new Error('endTime is required');
    }

    const result = await cloudWatchLogsService.startQuery(
      logGroupName,
      queryString,
      startTime,
      endTime,
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
    logger.error('Error in handleStartInsightsQuery', error as Error);
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
 * Handle get-insights-query-results tool
 */
export async function handleGetInsightsQueryResults(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-insights-query-results', args);

    const { queryId, region, profileName } = args;

    if (!queryId || typeof queryId !== 'string') {
      throw new Error('queryId is required');
    }

    const result = await cloudWatchLogsService.getQueryResults(
      queryId,
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
    logger.error('Error in handleGetInsightsQueryResults', error as Error);
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
 * Handle query-logs tool
 */
export async function handleQueryLogs(args: Record<string, unknown>) {
  try {
    logger.info('Handling query-logs', args);

    const { logGroupName, queryString, startTime, endTime, region, profileName, maxWaitSeconds } = args;

    if (!logGroupName || typeof logGroupName !== 'string') {
      throw new Error('logGroupName is required');
    }

    if (!queryString || typeof queryString !== 'string') {
      throw new Error('queryString is required');
    }

    if (typeof startTime !== 'number') {
      throw new Error('startTime is required');
    }

    if (typeof endTime !== 'number') {
      throw new Error('endTime is required');
    }

    const result = await cloudWatchLogsService.queryLogs(
      logGroupName,
      queryString,
      startTime,
      endTime,
      region as AWSRegion | undefined,
      profileName as string | undefined,
      maxWaitSeconds as number | undefined
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
    logger.error('Error in handleQueryLogs', error as Error);
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
 * Export all CloudWatch Logs handlers
 */
export const cloudWatchLogsHandlers = {
  'list-log-groups': handleListLogGroups,
  'list-log-streams': handleListLogStreams,
  'get-log-events': handleGetLogEvents,
  'tail-logs': handleTailLogs,
  'filter-log-events': handleFilterLogEvents,
  'start-insights-query': handleStartInsightsQuery,
  'get-insights-query-results': handleGetInsightsQueryResults,
  'query-logs': handleQueryLogs,
};
