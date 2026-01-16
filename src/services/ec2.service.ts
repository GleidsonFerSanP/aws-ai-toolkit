/**
 * EC2 Service
 * AWS EC2 instance management operations
 */

import {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  DescribeKeyPairsCommand,
  CreateKeyPairCommand,
  DescribeInstanceStatusCommand,
  Instance,
  InstanceStateName,
} from '@aws-sdk/client-ec2';

import { EC2Instance, BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

/**
 * EC2 Service
 * Handles EC2 instance operations
 */
export class EC2Service {
  private static instance: EC2Service;

  private constructor() {
    logger.info('EC2 Service initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EC2Service {
    if (!EC2Service.instance) {
      EC2Service.instance = new EC2Service();
    }
    return EC2Service.instance;
  }

  /**
   * Convert AWS Instance to EC2Instance model
   */
  private convertToEC2Instance(instance: Instance, region: AWSRegion): EC2Instance {
    return {
      id: instance.InstanceId || '',
      instanceId: instance.InstanceId || '',
      instanceType: instance.InstanceType || '',
      state: instance.State?.Name || 'unknown',
      publicIpAddress: instance.PublicIpAddress,
      privateIpAddress: instance.PrivateIpAddress,
      vpcId: instance.VpcId,
      subnetId: instance.SubnetId,
      launchTime: instance.LaunchTime?.toISOString(),
      platform: instance.Platform,
      type: 'ec2:instance',
      region,
      name: instance.Tags?.find((tag) => tag.Key === 'Name')?.Value,
      tags: instance.Tags?.map((tag) => ({
        Key: tag.Key || '',
        Value: tag.Value || '',
      })),
      arn: `arn:aws:ec2:${region}:*:instance/${instance.InstanceId}`,
      metadata: {
        imageId: instance.ImageId,
        keyName: instance.KeyName,
        securityGroups: instance.SecurityGroups?.map((sg) => sg.GroupId),
        monitoring: instance.Monitoring?.State,
        placement: instance.Placement?.AvailabilityZone,
      },
    };
  }

  /**
   * List EC2 instances
   */
  public async listInstances(
    region?: AWSRegion,
    profileName?: string,
    filters?: { state?: InstanceStateName; tags?: Record<string, string> }
  ): Promise<BaseResponse<EC2Instance[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      // Check cache
      const cacheKey = cache.generateKey('ec2', 'list', effectiveRegion, JSON.stringify(filters));
      const cached = cache.get<EC2Instance[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached EC2 instances');
        return {
          success: true,
          data: cached,
          metadata: {
            timestamp: new Date().toISOString(),
            region: effectiveRegion,
          },
        };
      }

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      // Build filters
      const ec2Filters = [];
      if (filters?.state) {
        ec2Filters.push({
          Name: 'instance-state-name',
          Values: [filters.state],
        });
      }
      if (filters?.tags) {
        Object.entries(filters.tags).forEach(([key, value]) => {
          ec2Filters.push({
            Name: `tag:${key}`,
            Values: [value],
          });
        });
      }

      const command = new DescribeInstancesCommand({
        Filters: ec2Filters.length > 0 ? ec2Filters : undefined,
      });

      const response = await ec2Client.send(command);

      const instances: EC2Instance[] = [];
      response.Reservations?.forEach((reservation) => {
        reservation.Instances?.forEach((instance) => {
          instances.push(this.convertToEC2Instance(instance, effectiveRegion));
        });
      });

      // Cache results
      cache.set(cacheKey, instances);

      logger.info(`Listed ${instances.length} EC2 instances in ${effectiveRegion}`);

      return {
        success: true,
        data: instances,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error listing EC2 instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe specific instance
   */
  public async describeInstance(
    instanceId: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<EC2Instance>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      if (!instance) {
        throw ErrorHandler.handleValidationError('instanceId', `Instance ${instanceId} not found`);
      }

      const ec2Instance = this.convertToEC2Instance(instance, effectiveRegion);

      logger.info(`Described instance: ${instanceId}`);

      return {
        success: true,
        data: ec2Instance,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing EC2 instance', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Start instances
   */
  public async startInstances(
    instanceIds: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<{ instanceIds: string[]; currentState: string }[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new StartInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);

      const results = response.StartingInstances?.map((instance) => ({
        instanceIds: [instance.InstanceId || ''],
        currentState: instance.CurrentState?.Name || 'unknown',
      })) || [];

      // Clear cache for affected instances
      cache.deletePattern('ec2:list');

      logger.info(`Started ${instanceIds.length} instances`, { instanceIds });

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error starting EC2 instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Stop instances
   */
  public async stopInstances(
    instanceIds: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<{ instanceIds: string[]; currentState: string }[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new StopInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);

      const results = response.StoppingInstances?.map((instance) => ({
        instanceIds: [instance.InstanceId || ''],
        currentState: instance.CurrentState?.Name || 'unknown',
      })) || [];

      // Clear cache
      cache.deletePattern('ec2:list');

      logger.info(`Stopped ${instanceIds.length} instances`, { instanceIds });

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error stopping EC2 instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Reboot instances
   */
  public async rebootInstances(
    instanceIds: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<void>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new RebootInstancesCommand({
        InstanceIds: instanceIds,
      });

      await ec2Client.send(command);

      // Clear cache
      cache.deletePattern('ec2:list');

      logger.info(`Rebooted ${instanceIds.length} instances`, { instanceIds });

      return {
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error rebooting EC2 instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Terminate instances
   */
  public async terminateInstances(
    instanceIds: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<{ instanceIds: string[]; currentState: string }[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new TerminateInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);

      const results = response.TerminatingInstances?.map((instance) => ({
        instanceIds: [instance.InstanceId || ''],
        currentState: instance.CurrentState?.Name || 'unknown',
      })) || [];

      // Clear cache
      cache.deletePattern('ec2:list');

      logger.warn(`Terminated ${instanceIds.length} instances`, { instanceIds });

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error terminating EC2 instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get instance status
   */
  public async getInstanceStatus(
    instanceIds: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<any[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new DescribeInstanceStatusCommand({
        InstanceIds: instanceIds,
        IncludeAllInstances: true,
      });

      const response = await ec2Client.send(command);

      const statuses = response.InstanceStatuses?.map((status) => ({
        instanceId: status.InstanceId,
        instanceState: status.InstanceState?.Name,
        systemStatus: status.SystemStatus?.Status,
        instanceStatus: status.InstanceStatus?.Status,
        events: status.Events,
      }));

      logger.info(`Retrieved status for ${instanceIds.length} instances`);

      return {
        success: true,
        data: statuses || [],
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error getting instance status', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List key pairs
   */
  public async listKeyPairs(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<any[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new DescribeKeyPairsCommand({});
      const response = await ec2Client.send(command);

      const keyPairs = response.KeyPairs?.map((kp) => ({
        keyName: kp.KeyName,
        keyFingerprint: kp.KeyFingerprint,
        keyType: kp.KeyType,
        keyPairId: kp.KeyPairId,
      }));

      logger.info(`Listed ${keyPairs?.length || 0} key pairs`);

      return {
        success: true,
        data: keyPairs || [],
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error listing key pairs', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Create key pair
   */
  public async createKeyPair(
    keyName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<{ keyName: string; keyMaterial: string; keyFingerprint: string }>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      const command = new CreateKeyPairCommand({
        KeyName: keyName,
      });

      const response = await ec2Client.send(command);

      logger.info(`Created key pair: ${keyName}`);

      return {
        success: true,
        data: {
          keyName: response.KeyName || '',
          keyMaterial: response.KeyMaterial || '',
          keyFingerprint: response.KeyFingerprint || '',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error creating key pair', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

// Export singleton instance
export const ec2Service = EC2Service.getInstance();
