/**
 * EKS Service
 * AWS EKS (Elastic Kubernetes Service) operations
 */

import {
  ListClustersCommand,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  ListAddonsCommand,
  DescribeAddonCommand,
} from '@aws-sdk/client-eks';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface EKSCluster {
  name: string;
  arn: string;
  createdAt?: string;
  version?: string;
  endpoint?: string;
  status?: string;
  certificateAuthority?: {
    data?: string;
  };
  resourcesVpcConfig?: {
    subnetIds?: string[];
    securityGroupIds?: string[];
    clusterSecurityGroupId?: string;
    vpcId?: string;
    endpointPublicAccess?: boolean;
    endpointPrivateAccess?: boolean;
    publicAccessCidrs?: string[];
  };
  logging?: {
    clusterLogging?: Array<{
      types?: string[];
      enabled?: boolean;
    }>;
  };
  platformVersion?: string;
  tags?: Record<string, string>;
}

export interface EKSNodegroup {
  nodegroupName: string;
  nodegroupArn: string;
  clusterName: string;
  version?: string;
  releaseVersion?: string;
  createdAt?: string;
  modifiedAt?: string;
  status?: string;
  capacityType?: string;
  scalingConfig?: {
    minSize?: number;
    maxSize?: number;
    desiredSize?: number;
  };
  instanceTypes?: string[];
  subnets?: string[];
  remoteAccess?: {
    ec2SshKey?: string;
    sourceSecurityGroups?: string[];
  };
  amiType?: string;
  nodeRole?: string;
  labels?: Record<string, string>;
  resources?: {
    autoScalingGroups?: Array<{
      name?: string;
    }>;
  };
  diskSize?: number;
  health?: {
    issues?: Array<{
      code?: string;
      message?: string;
      resourceIds?: string[];
    }>;
  };
  tags?: Record<string, string>;
}

export interface EKSAddon {
  addonName: string;
  clusterName: string;
  addonVersion?: string;
  addonArn: string;
  createdAt?: string;
  modifiedAt?: string;
  serviceAccountRoleArn?: string;
  status?: string;
  health?: {
    issues?: Array<{
      code?: string;
      message?: string;
      resourceIds?: string[];
    }>;
  };
  tags?: Record<string, string>;
}

/**
 * EKS Service
 * Manages AWS EKS operations
 */
export class EKSService {
  private static instance: EKSService;

  private constructor() {
    logger.info('EKS Service initialized');
  }

  public static getInstance(): EKSService {
    if (!EKSService.instance) {
      EKSService.instance = new EKSService();
    }
    return EKSService.instance;
  }

  /**
   * List EKS clusters
   */
  public async listClusters(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey('eks', 'list-clusters', effectiveRegion);
      const cached = cache.get<string[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached EKS clusters');
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

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new ListClustersCommand({});
      const response = await eksClient.send(command);

      const clusterNames = response.clusters || [];

      cache.set(cacheKey, clusterNames, 300);

      logger.info(`Listed ${clusterNames.length} EKS clusters in ${effectiveRegion}`);

      return {
        success: true,
        data: clusterNames,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: clusterNames.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing EKS clusters', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe EKS cluster
   */
  public async describeCluster(
    clusterName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<EKSCluster>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);

      if (!response.cluster) {
        throw new Error(`Cluster ${clusterName} not found`);
      }

      const c = response.cluster;

      const cluster: EKSCluster = {
        name: c.name || '',
        arn: c.arn || '',
        createdAt: c.createdAt?.toISOString(),
        version: c.version,
        endpoint: c.endpoint,
        status: c.status,
        certificateAuthority: c.certificateAuthority,
        resourcesVpcConfig: c.resourcesVpcConfig,
        logging: c.logging,
        platformVersion: c.platformVersion,
        tags: c.tags,
      };

      logger.info(`Described EKS cluster ${clusterName}`);

      return {
        success: true,
        data: cluster,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing EKS cluster', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List node groups in a cluster
   */
  public async listNodegroups(
    clusterName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new ListNodegroupsCommand({
        clusterName,
      });

      const response = await eksClient.send(command);

      const nodegroupNames = response.nodegroups || [];

      logger.info(`Listed ${nodegroupNames.length} nodegroups in cluster ${clusterName}`);

      return {
        success: true,
        data: nodegroupNames,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          clusterName,
          count: nodegroupNames.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing EKS nodegroups', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe node group
   */
  public async describeNodegroup(
    clusterName: string,
    nodegroupName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<EKSNodegroup>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      if (!response.nodegroup) {
        throw new Error(`Nodegroup ${nodegroupName} not found`);
      }

      const ng = response.nodegroup;

      const nodegroup: EKSNodegroup = {
        nodegroupName: ng.nodegroupName || '',
        nodegroupArn: ng.nodegroupArn || '',
        clusterName: ng.clusterName || '',
        version: ng.version,
        releaseVersion: ng.releaseVersion,
        createdAt: ng.createdAt?.toISOString(),
        modifiedAt: ng.modifiedAt?.toISOString(),
        status: ng.status,
        capacityType: ng.capacityType,
        scalingConfig: ng.scalingConfig,
        instanceTypes: ng.instanceTypes,
        subnets: ng.subnets,
        remoteAccess: ng.remoteAccess,
        amiType: ng.amiType,
        nodeRole: ng.nodeRole,
        labels: ng.labels,
        resources: ng.resources,
        diskSize: ng.diskSize,
        health: ng.health,
        tags: ng.tags,
      };

      logger.info(`Described nodegroup ${nodegroupName} in cluster ${clusterName}`);

      return {
        success: true,
        data: nodegroup,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing EKS nodegroup', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List addons in a cluster
   */
  public async listAddons(
    clusterName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new ListAddonsCommand({
        clusterName,
      });

      const response = await eksClient.send(command);

      const addonNames = response.addons || [];

      logger.info(`Listed ${addonNames.length} addons in cluster ${clusterName}`);

      return {
        success: true,
        data: addonNames,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          clusterName,
          count: addonNames.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing EKS addons', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe addon
   */
  public async describeAddon(
    clusterName: string,
    addonName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<EKSAddon>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const eksClient = awsClientFactory.getEKSClient(effectiveRegion, credentials);

      const command = new DescribeAddonCommand({
        clusterName,
        addonName,
      });

      const response = await eksClient.send(command);

      if (!response.addon) {
        throw new Error(`Addon ${addonName} not found`);
      }

      const a = response.addon;

      const addon: EKSAddon = {
        addonName: a.addonName || '',
        clusterName: a.clusterName || '',
        addonVersion: a.addonVersion,
        addonArn: a.addonArn || '',
        createdAt: a.createdAt?.toISOString(),
        modifiedAt: a.modifiedAt?.toISOString(),
        serviceAccountRoleArn: a.serviceAccountRoleArn,
        status: a.status,
        health: a.health,
        tags: a.tags,
      };

      logger.info(`Described addon ${addonName} in cluster ${clusterName}`);

      return {
        success: true,
        data: addon,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing EKS addon', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const eksService = EKSService.getInstance();
