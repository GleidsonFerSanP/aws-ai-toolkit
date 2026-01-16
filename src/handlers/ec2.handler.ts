/**
 * EC2 Handlers
 * Handles MCP tool calls for EC2 operations
 */

import { ec2Service } from '../services/ec2.service';
import { bastionHostService, BastionHostConfig } from '../services/bastion-host.service';
import { AWSRegion } from '../models';
import { logger, ErrorHandler } from '../utils';

/**
 * Handle list-ec2-instances tool
 */
export async function handleListEC2Instances(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-ec2-instances', args);

    const { region, profileName, state, tags } = args;

    const filters: { state?: string; tags?: Record<string, string> } = {};
    
    if (state && typeof state === 'string') {
      filters.state = state;
    }

    if (tags && typeof tags === 'object') {
      filters.tags = tags as Record<string, string>;
    }

    const result = await ec2Service.listInstances(
      region as AWSRegion | undefined,
      profileName as string | undefined,
      Object.keys(filters).length > 0 ? filters as any : undefined
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
    logger.error('Error in handleListEC2Instances', error as Error);
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
 * Handle describe-ec2-instance tool
 */
export async function handleDescribeEC2Instance(args: Record<string, unknown>) {
  try {
    logger.info('Handling describe-ec2-instance', args);

    const { instanceId, region, profileName } = args;

    if (!instanceId || typeof instanceId !== 'string') {
      throw new Error('instanceId is required');
    }

    const result = await ec2Service.describeInstance(
      instanceId,
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
    logger.error('Error in handleDescribeEC2Instance', error as Error);
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
 * Handle start-ec2-instances tool
 */
export async function handleStartEC2Instances(args: Record<string, unknown>) {
  try {
    logger.info('Handling start-ec2-instances', args);

    const { instanceIds, region, profileName } = args;

    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new Error('instanceIds array is required');
    }

    const result = await ec2Service.startInstances(
      instanceIds as string[],
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
    logger.error('Error in handleStartEC2Instances', error as Error);
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
 * Handle stop-ec2-instances tool
 */
export async function handleStopEC2Instances(args: Record<string, unknown>) {
  try {
    logger.info('Handling stop-ec2-instances', args);

    const { instanceIds, region, profileName } = args;

    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new Error('instanceIds array is required');
    }

    const result = await ec2Service.stopInstances(
      instanceIds as string[],
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
    logger.error('Error in handleStopEC2Instances', error as Error);
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
 * Handle reboot-ec2-instances tool
 */
export async function handleRebootEC2Instances(args: Record<string, unknown>) {
  try {
    logger.info('Handling reboot-ec2-instances', args);

    const { instanceIds, region, profileName } = args;

    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new Error('instanceIds array is required');
    }

    const result = await ec2Service.rebootInstances(
      instanceIds as string[],
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
    logger.error('Error in handleRebootEC2Instances', error as Error);
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
 * Handle terminate-ec2-instances tool
 */
export async function handleTerminateEC2Instances(args: Record<string, unknown>) {
  try {
    logger.info('Handling terminate-ec2-instances', args);

    const { instanceIds, region, profileName } = args;

    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new Error('instanceIds array is required');
    }

    const result = await ec2Service.terminateInstances(
      instanceIds as string[],
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
    logger.error('Error in handleTerminateEC2Instances', error as Error);
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
 * Handle get-ec2-instance-status tool
 */
export async function handleGetEC2InstanceStatus(args: Record<string, unknown>) {
  try {
    logger.info('Handling get-ec2-instance-status', args);

    const { instanceIds, region, profileName } = args;

    if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
      throw new Error('instanceIds array is required');
    }

    const result = await ec2Service.getInstanceStatus(
      instanceIds as string[],
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
    logger.error('Error in handleGetEC2InstanceStatus', error as Error);
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
 * Handle list-key-pairs tool
 */
export async function handleListKeyPairs(args: Record<string, unknown>) {
  try {
    logger.info('Handling list-key-pairs', args);

    const { region, profileName } = args;

    const result = await ec2Service.listKeyPairs(
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
    logger.error('Error in handleListKeyPairs', error as Error);
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
 * Handle create-key-pair tool
 */
export async function handleCreateKeyPair(args: Record<string, unknown>) {
  try {
    logger.info('Handling create-key-pair', args);

    const { keyName, region, profileName } = args;

    if (!keyName || typeof keyName !== 'string') {
      throw new Error('keyName is required');
    }

    const result = await ec2Service.createKeyPair(
      keyName,
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
    logger.error('Error in handleCreateKeyPair', error as Error);
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
 * Handle create-bastion-host tool
 */
export async function handleCreateBastionHost(args: Record<string, unknown>) {
  try {
    logger.info('Handling create-bastion-host', args);

    const {
      vpcId,
      subnetId,
      keyName,
      instanceType,
      allowedCidr,
      name,
      region,
      profileName,
    } = args;

    if (!vpcId || typeof vpcId !== 'string') {
      throw new Error('vpcId is required');
    }

    if (!subnetId || typeof subnetId !== 'string') {
      throw new Error('subnetId is required');
    }

    const config: BastionHostConfig = {
      vpcId,
      subnetId,
      keyName: keyName as string | undefined,
      instanceType: instanceType as string | undefined,
      allowedCidr: allowedCidr as string | undefined,
      name: name as string | undefined,
    };

    const result = await bastionHostService.createBastionHost(
      config,
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
    logger.error('Error in handleCreateBastionHost', error as Error);
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
 * Export all EC2 handlers
 */
export const ec2Handlers = {
  'list-ec2-instances': handleListEC2Instances,
  'describe-ec2-instance': handleDescribeEC2Instance,
  'start-ec2-instances': handleStartEC2Instances,
  'stop-ec2-instances': handleStopEC2Instances,
  'reboot-ec2-instances': handleRebootEC2Instances,
  'terminate-ec2-instances': handleTerminateEC2Instances,
  'get-ec2-instance-status': handleGetEC2InstanceStatus,
  'list-key-pairs': handleListKeyPairs,
  'create-key-pair': handleCreateKeyPair,
  'create-bastion-host': handleCreateBastionHost,
};
