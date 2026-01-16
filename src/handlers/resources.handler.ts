/**
 * AWS Resources Handlers
 * Handles MCP tool calls for AWS resources operations
 */

import { awsResourcesService } from '../services/resources.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

export async function handleListAWSResources(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-aws-resources', args);

    const { resourceTypeFilters, tagFilters, region, profileName } = args;

    const result = await awsResourcesService.listResources(
      resourceTypeFilters as string[] | undefined,
      tagFilters as Array<{ key: string; values?: string[] }> | undefined,
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
    logger.error('Error in handleListAWSResources', error as Error);
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

export async function handleGetResourcesByService(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-resources-by-service', args);

    const { serviceName, region, profileName } = args;

    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('serviceName is required');
    }

    const result = await awsResourcesService.getResourcesByService(
      serviceName,
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
    logger.error('Error in handleGetResourcesByService', error as Error);
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

export async function handleGetResourcesByTag(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-resources-by-tag', args);

    const { tagKey, tagValues, region, profileName } = args;

    if (!tagKey || typeof tagKey !== 'string') {
      throw new Error('tagKey is required');
    }

    const result = await awsResourcesService.getResourcesByTag(
      tagKey,
      tagValues as string[] | undefined,
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
    logger.error('Error in handleGetResourcesByTag', error as Error);
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

export async function handleGetResourceSummary(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-resource-summary', args);

    const { region, profileName } = args;

    const result = await awsResourcesService.getResourceSummary(
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
    logger.error('Error in handleGetResourceSummary', error as Error);
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

export async function handleListTagKeys(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-tag-keys', args);

    const { region, profileName } = args;

    const result = await awsResourcesService.listTagKeys(
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
    logger.error('Error in handleListTagKeys', error as Error);
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

export async function handleListTagValues(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-tag-values', args);

    const { tagKey, region, profileName } = args;

    if (!tagKey || typeof tagKey !== 'string') {
      throw new Error('tagKey is required');
    }

    const result = await awsResourcesService.listTagValues(
      tagKey,
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
    logger.error('Error in handleListTagValues', error as Error);
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

export async function handleSearchResourcesByARN(args: Record<string, unknown>) {
  try {
    logger.info('Handling search-resources-by-arn', args);

    const { arnPattern, region, profileName } = args;

    if (!arnPattern || typeof arnPattern !== 'string') {
      throw new Error('arnPattern is required');
    }

    const result = await awsResourcesService.searchResourcesByARN(
      arnPattern,
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
    logger.error('Error in handleSearchResourcesByARN', error as Error);
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
 * Export all resources handlers
 */
export const resourcesHandlers = {
  'list-aws-resources': handleListAWSResources,
  'get-resources-by-service': handleGetResourcesByService,
  'get-resources-by-tag': handleGetResourcesByTag,
  'get-resource-summary': handleGetResourceSummary,
  'list-tag-keys': handleListTagKeys,
  'list-tag-values': handleListTagValues,
  'search-resources-by-arn': handleSearchResourcesByARN,
};
