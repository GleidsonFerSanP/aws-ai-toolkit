/**
 * Bastion Host Service
 * Specialized service for creating secure bastion hosts
 */

import {
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  _InstanceType,
} from '@aws-sdk/client-ec2';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { ec2Service } from './ec2.service';
import { logger, ErrorHandler } from '../utils';

export interface BastionHostConfig {
  vpcId: string;
  subnetId: string;
  keyName?: string;
  instanceType?: string;
  allowedCidr?: string;
  name?: string;
}

export interface BastionHostResult {
  instanceId: string;
  publicIp?: string;
  securityGroupId: string;
  keyName: string;
  sshCommand?: string;
}

/**
 * Bastion Host Service
 * Creates and manages bastion hosts for secure access
 */
export class BastionHostService {
  private static instance: BastionHostService;
  private readonly DEFAULT_INSTANCE_TYPE: _InstanceType = 't3.micro';

  private constructor() {
    logger.info('Bastion Host Service initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BastionHostService {
    if (!BastionHostService.instance) {
      BastionHostService.instance = new BastionHostService();
    }
    return BastionHostService.instance;
  }

  /**
   * Get latest Amazon Linux 2 AMI ID
   * In production, you'd query SSM Parameter Store or use DescribeImages
   */
  private getDefaultAMI(region: string): string {
    // These are example AMI IDs - in production, query dynamically
    const amiMap: Record<string, string> = {
      'us-east-1': 'ami-0c02fb55c47d2f234',
      'us-west-2': 'ami-0d70546e43a941d70',
      'eu-west-1': 'ami-0d71ea30463e0ff8d',
      'ap-southeast-1': 'ami-0c802847a7dd848c0',
    };
    return amiMap[region] || amiMap['us-east-1']!;
  }

  /**
   * Create secure bastion host
   */
  public async createBastionHost(
    config: BastionHostConfig,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<BastionHostResult>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ec2Client = awsClientFactory.getEC2Client(effectiveRegion, credentials);

      // Step 1: Create or use key pair
      let keyName = config.keyName;
      if (!keyName) {
        const timestamp = Date.now();
        keyName = `bastion-key-${timestamp}`;
        
        const keyPairResult = await ec2Service.createKeyPair(keyName, effectiveRegion, profileName);
        
        if (!keyPairResult.success || !keyPairResult.data) {
          throw new Error('Failed to create key pair');
        }

        // In a real scenario, save the private key securely
        logger.info('Key pair created. Private key material should be saved securely', {
          keyName,
          fingerprint: keyPairResult.data.keyFingerprint,
        });
      }

      // Step 2: Create security group
      const sgName = `bastion-sg-${Date.now()}`;
      const createSGCommand = new CreateSecurityGroupCommand({
        GroupName: sgName,
        Description: 'Security group for bastion host - allows SSH access',
        VpcId: config.vpcId,
      });

      const sgResponse = await ec2Client.send(createSGCommand);
      const securityGroupId = sgResponse.GroupId!;

      logger.info(`Created security group: ${securityGroupId}`);

      // Step 3: Configure security group rules
      const allowedCidr = config.allowedCidr || '0.0.0.0/0'; // Default allows all (not recommended for production)
      
      const authorizeSGCommand = new AuthorizeSecurityGroupIngressCommand({
        GroupId: securityGroupId,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [
              {
                CidrIp: allowedCidr,
                Description: 'SSH access',
              },
            ],
          },
        ],
      });

      await ec2Client.send(authorizeSGCommand);

      logger.info(`Configured security group with SSH access from ${allowedCidr}`);

      // Step 4: Launch instance
      const instanceName = config.name || `bastion-host-${Date.now()}`;
      const runInstancesCommand = new RunInstancesCommand({
        ImageId: this.getDefaultAMI(effectiveRegion),
        InstanceType: (config.instanceType || this.DEFAULT_INSTANCE_TYPE) as _InstanceType,
        KeyName: keyName,
        MinCount: 1,
        MaxCount: 1,
        NetworkInterfaces: [
          {
            AssociatePublicIpAddress: true,
            DeviceIndex: 0,
            SubnetId: config.subnetId,
            Groups: [securityGroupId],
          },
        ],
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: instanceName,
              },
              {
                Key: 'Purpose',
                Value: 'bastion-host',
              },
              {
                Key: 'ManagedBy',
                Value: 'mcp-aws-cli',
              },
            ],
          },
        ],
      });

      const runResponse = await ec2Client.send(runInstancesCommand);
      const instance = runResponse.Instances?.[0];

      if (!instance || !instance.InstanceId) {
        throw new Error('Failed to launch bastion host instance');
      }

      const instanceId = instance.InstanceId;

      logger.info(`Launched bastion host instance: ${instanceId}`);

      // Wait a moment and get public IP
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const instanceDetails = await ec2Service.describeInstance(instanceId, effectiveRegion, profileName);
      const publicIp = instanceDetails.data?.publicIpAddress;

      const result: BastionHostResult = {
        instanceId,
        publicIp,
        securityGroupId,
        keyName,
        sshCommand: publicIp ? `ssh -i ${keyName}.pem ec2-user@${publicIp}` : undefined,
      };

      logger.info('Bastion host created successfully', {
        instanceId,
        publicIp,
        securityGroupId,
      });

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error creating bastion host', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

// Export singleton instance
export const bastionHostService = BastionHostService.getInstance();
