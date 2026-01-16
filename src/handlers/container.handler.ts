/**
 * Container (ECS/EKS) Handlers
 * Handles MCP tool calls for container operations
 */

import { ecsService } from '../services/ecs.service';
import { eksService } from '../services/eks.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

// ========================================
// ECS Handlers
// ========================================

export async function handleListECSClusters(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-ecs-clusters', args);

    const { region, profileName } = args;

    const result = await ecsService.listClusters(
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
    logger.error('Error in handleListECSClusters', error as Error);
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

export async function handleDescribeECSClusters(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-ecs-clusters', args);

    const { clusterArns, region, profileName } = args;

    if (!Array.isArray(clusterArns) || clusterArns.length === 0) {
      throw new Error('clusterArns array is required');
    }

    const result = await ecsService.describeClusters(
      clusterArns as string[],
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
    logger.error('Error in handleDescribeECSClusters', error as Error);
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

export async function handleListECSServices(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-ecs-services', args);

    const { clusterArn, region, profileName } = args;

    if (!clusterArn || typeof clusterArn !== 'string') {
      throw new Error('clusterArn is required');
    }

    const result = await ecsService.listServices(
      clusterArn,
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
    logger.error('Error in handleListECSServices', error as Error);
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

export async function handleDescribeECSServices(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-ecs-services', args);

    const { clusterArn, serviceArns, region, profileName } = args;

    if (!clusterArn || typeof clusterArn !== 'string') {
      throw new Error('clusterArn is required');
    }

    if (!Array.isArray(serviceArns) || serviceArns.length === 0) {
      throw new Error('serviceArns array is required');
    }

    const result = await ecsService.describeServices(
      clusterArn,
      serviceArns as string[],
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
    logger.error('Error in handleDescribeECSServices', error as Error);
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

export async function handleListECSTasks(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-ecs-tasks', args);

    const { clusterArn, serviceName, region, profileName } = args;

    if (!clusterArn || typeof clusterArn !== 'string') {
      throw new Error('clusterArn is required');
    }

    const result = await ecsService.listTasks(
      clusterArn,
      serviceName as string | undefined,
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
    logger.error('Error in handleListECSTasks', error as Error);
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

export async function handleDescribeECSTasks(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-ecs-tasks', args);

    const { clusterArn, taskArns, region, profileName } = args;

    if (!clusterArn || typeof clusterArn !== 'string') {
      throw new Error('clusterArn is required');
    }

    if (!Array.isArray(taskArns) || taskArns.length === 0) {
      throw new Error('taskArns array is required');
    }

    const result = await ecsService.describeTasks(
      clusterArn,
      taskArns as string[],
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
    logger.error('Error in handleDescribeECSTasks', error as Error);
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

export async function handleListECSTaskDefinitions(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-ecs-task-definitions', args);

    const { familyPrefix, region, profileName } = args;

    const result = await ecsService.listTaskDefinitions(
      familyPrefix as string | undefined,
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
    logger.error('Error in handleListECSTaskDefinitions', error as Error);
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

export async function handleDescribeECSTaskDefinition(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-ecs-task-definition', args);

    const { taskDefinitionArn, region, profileName } = args;

    if (!taskDefinitionArn || typeof taskDefinitionArn !== 'string') {
      throw new Error('taskDefinitionArn is required');
    }

    const result = await ecsService.describeTaskDefinition(
      taskDefinitionArn,
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
    logger.error('Error in handleDescribeECSTaskDefinition', error as Error);
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

// ========================================
// EKS Handlers
// ========================================

export async function handleListEKSClusters(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-eks-clusters', args);

    const { region, profileName } = args;

    const result = await eksService.listClusters(
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
    logger.error('Error in handleListEKSClusters', error as Error);
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

export async function handleDescribeEKSCluster(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-eks-cluster', args);

    const { clusterName, region, profileName } = args;

    if (!clusterName || typeof clusterName !== 'string') {
      throw new Error('clusterName is required');
    }

    const result = await eksService.describeCluster(
      clusterName,
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
    logger.error('Error in handleDescribeEKSCluster', error as Error);
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

export async function handleListEKSNodegroups(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-eks-nodegroups', args);

    const { clusterName, region, profileName } = args;

    if (!clusterName || typeof clusterName !== 'string') {
      throw new Error('clusterName is required');
    }

    const result = await eksService.listNodegroups(
      clusterName,
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
    logger.error('Error in handleListEKSNodegroups', error as Error);
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

export async function handleDescribeEKSNodegroup(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-eks-nodegroup', args);

    const { clusterName, nodegroupName, region, profileName } = args;

    if (!clusterName || typeof clusterName !== 'string') {
      throw new Error('clusterName is required');
    }

    if (!nodegroupName || typeof nodegroupName !== 'string') {
      throw new Error('nodegroupName is required');
    }

    const result = await eksService.describeNodegroup(
      clusterName,
      nodegroupName,
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
    logger.error('Error in handleDescribeEKSNodegroup', error as Error);
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

export async function handleListEKSAddons(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-eks-addons', args);

    const { clusterName, region, profileName } = args;

    if (!clusterName || typeof clusterName !== 'string') {
      throw new Error('clusterName is required');
    }

    const result = await eksService.listAddons(
      clusterName,
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
    logger.error('Error in handleListEKSAddons', error as Error);
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

export async function handleDescribeEKSAddon(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-eks-addon', args);

    const { clusterName, addonName, region, profileName } = args;

    if (!clusterName || typeof clusterName !== 'string') {
      throw new Error('clusterName is required');
    }

    if (!addonName || typeof addonName !== 'string') {
      throw new Error('addonName is required');
    }

    const result = await eksService.describeAddon(
      clusterName,
      addonName,
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
    logger.error('Error in handleDescribeEKSAddon', error as Error);
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
 * Export all container handlers
 */
export const containerHandlers = {
  // ECS
  'list-ecs-clusters': handleListECSClusters,
  'describe-ecs-clusters': handleDescribeECSClusters,
  'list-ecs-services': handleListECSServices,
  'describe-ecs-services': handleDescribeECSServices,
  'list-ecs-tasks': handleListECSTasks,
  'describe-ecs-tasks': handleDescribeECSTasks,
  'list-ecs-task-definitions': handleListECSTaskDefinitions,
  'describe-ecs-task-definition': handleDescribeECSTaskDefinition,
  // EKS
  'list-eks-clusters': handleListEKSClusters,
  'describe-eks-cluster': handleDescribeEKSCluster,
  'list-eks-nodegroups': handleListEKSNodegroups,
  'describe-eks-nodegroup': handleDescribeEKSNodegroup,
  'list-eks-addons': handleListEKSAddons,
  'describe-eks-addon': handleDescribeEKSAddon,
};
