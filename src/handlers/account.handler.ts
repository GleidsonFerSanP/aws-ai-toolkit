/**
 * AWS Account Handlers
 * Handles MCP tool calls for AWS account operations
 */

import { awsAccountService } from '../services/account.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

export async function handleGetAccountIdentity(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-account-identity', args);

    const { profileName } = args;

    const result = await awsAccountService.getAccountIdentity(
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
    logger.error('Error in handleGetAccountIdentity', error as Error);
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

export async function handleListRegions(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-aws-regions', args);

    const result = await awsAccountService.listRegions();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListRegions', error as Error);
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

export async function handleGetServiceQuotas(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-service-quotas', args);

    const { serviceCode, region, profileName } = args;

    if (!serviceCode || typeof serviceCode !== 'string') {
      throw new Error('serviceCode is required');
    }

    const result = await awsAccountService.getServiceQuotas(
      serviceCode,
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
    logger.error('Error in handleGetServiceQuotas', error as Error);
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

export async function handleGetServiceQuota(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-service-quota', args);

    const { serviceCode, quotaCode, region, profileName } = args;

    if (!serviceCode || typeof serviceCode !== 'string') {
      throw new Error('serviceCode is required');
    }

    if (!quotaCode || typeof quotaCode !== 'string') {
      throw new Error('quotaCode is required');
    }

    const result = await awsAccountService.getServiceQuota(
      serviceCode,
      quotaCode,
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
    logger.error('Error in handleGetServiceQuota', error as Error);
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

export async function handleGetDefaultServiceQuotas(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-default-service-quotas', args);

    const { serviceCode, region, profileName } = args;

    if (!serviceCode || typeof serviceCode !== 'string') {
      throw new Error('serviceCode is required');
    }

    const result = await awsAccountService.getDefaultServiceQuotas(
      serviceCode,
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
    logger.error('Error in handleGetDefaultServiceQuotas', error as Error);
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

export async function handleGetCostAndUsage(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-cost-and-usage', args);

    const { startDate, endDate, granularity, metrics, groupBy, profileName } = args;

    if (!startDate || typeof startDate !== 'string') {
      throw new Error('startDate is required');
    }

    if (!endDate || typeof endDate !== 'string') {
      throw new Error('endDate is required');
    }

    const result = await awsAccountService.getCostAndUsage(
      startDate,
      endDate,
      (granularity as 'DAILY' | 'MONTHLY' | 'HOURLY') || 'DAILY',
      (metrics as string[]) || ['UnblendedCost'],
      groupBy as Array<{ type: string; key: string }> | undefined,
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
    logger.error('Error in handleGetCostAndUsage', error as Error);
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

export async function handleGetCostForecast(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-cost-forecast', args);

    const { startDate, endDate, metric, granularity, profileName } = args;

    if (!startDate || typeof startDate !== 'string') {
      throw new Error('startDate is required');
    }

    if (!endDate || typeof endDate !== 'string') {
      throw new Error('endDate is required');
    }

    const result = await awsAccountService.getCostForecast(
      startDate,
      endDate,
      (metric as string) || 'UNBLENDED_COST',
      (granularity as 'DAILY' | 'MONTHLY' | 'HOURLY') || 'MONTHLY',
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
    logger.error('Error in handleGetCostForecast', error as Error);
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

export async function handleGetContactInformation(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-contact-information', args);

    const { profileName } = args;

    const result = await awsAccountService.getContactInformation(
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
    logger.error('Error in handleGetContactInformation', error as Error);
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
 * Export all account handlers
 */
export const accountHandlers = {
  'get-account-identity': handleGetAccountIdentity,
  'list-aws-regions': handleListRegions,
  'get-service-quotas': handleGetServiceQuotas,
  'get-service-quota': handleGetServiceQuota,
  'get-default-service-quotas': handleGetDefaultServiceQuotas,
  'get-cost-and-usage': handleGetCostAndUsage,
  'get-cost-forecast': handleGetCostForecast,
  'get-contact-information': handleGetContactInformation,
};
