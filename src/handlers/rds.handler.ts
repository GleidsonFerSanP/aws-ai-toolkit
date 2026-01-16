/**
 * RDS Handlers
 * Handles MCP tool calls for RDS operations
 */

import { rdsService } from '../services/rds.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

export async function handleListRDSInstances(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-instances', args);

    const { region, profileName } = args;

    const result = await rdsService.listInstances(
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
    logger.error('Error in handleListRDSInstances', error as Error);
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

export async function handleDescribeRDSInstance(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-rds-instance', args);

    const { dbInstanceIdentifier, region, profileName } = args;

    if (!dbInstanceIdentifier || typeof dbInstanceIdentifier !== 'string') {
      throw new Error('dbInstanceIdentifier is required');
    }

    const result = await rdsService.describeInstance(
      dbInstanceIdentifier,
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
    logger.error('Error in handleDescribeRDSInstance', error as Error);
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

export async function handleListRDSClusters(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-clusters', args);

    const { region, profileName } = args;

    const result = await rdsService.listClusters(
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
    logger.error('Error in handleListRDSClusters', error as Error);
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

export async function handleDescribeRDSCluster(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-rds-cluster', args);

    const { dbClusterIdentifier, region, profileName } = args;

    if (!dbClusterIdentifier || typeof dbClusterIdentifier !== 'string') {
      throw new Error('dbClusterIdentifier is required');
    }

    const result = await rdsService.describeCluster(
      dbClusterIdentifier,
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
    logger.error('Error in handleDescribeRDSCluster', error as Error);
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

export async function handleListRDSSnapshots(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-snapshots', args);

    const { dbInstanceIdentifier, region, profileName } = args;

    const result = await rdsService.listSnapshots(
      dbInstanceIdentifier as string | undefined,
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
    logger.error('Error in handleListRDSSnapshots', error as Error);
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

export async function handleListRDSClusterSnapshots(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-cluster-snapshots', args);

    const { dbClusterIdentifier, region, profileName } = args;

    const result = await rdsService.listClusterSnapshots(
      dbClusterIdentifier as string | undefined,
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
    logger.error('Error in handleListRDSClusterSnapshots', error as Error);
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

export async function handleListRDSEngineVersions(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-engine-versions', args);

    const { engine, region, profileName } = args;

    const result = await rdsService.listEngineVersions(
      engine as string | undefined,
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
    logger.error('Error in handleListRDSEngineVersions', error as Error);
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

export async function handleListRDSEvents(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-rds-events', args);

    const { sourceIdentifier, sourceType, startTime, endTime, region, profileName } = args;

    const result = await rdsService.listEvents(
      sourceIdentifier as string | undefined,
      sourceType as string | undefined,
      startTime ? new Date(startTime as string) : undefined,
      endTime ? new Date(endTime as string) : undefined,
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
    logger.error('Error in handleListRDSEvents', error as Error);
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
 * Export all RDS handlers
 */
export const rdsHandlers = {
  'list-rds-instances': handleListRDSInstances,
  'describe-rds-instance': handleDescribeRDSInstance,
  'list-rds-clusters': handleListRDSClusters,
  'describe-rds-cluster': handleDescribeRDSCluster,
  'list-rds-snapshots': handleListRDSSnapshots,
  'list-rds-cluster-snapshots': handleListRDSClusterSnapshots,
  'list-rds-engine-versions': handleListRDSEngineVersions,
  'list-rds-events': handleListRDSEvents,
};
