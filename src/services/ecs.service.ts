/**
 * ECS Service
 * AWS ECS (Elastic Container Service) operations
 */

import {
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  ListTaskDefinitionsCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface ECSCluster {
  clusterArn: string;
  clusterName: string;
  status?: string;
  registeredContainerInstancesCount?: number;
  runningTasksCount?: number;
  pendingTasksCount?: number;
  activeServicesCount?: number;
  statistics?: Array<{ name?: string; value?: string }>;
  tags?: Array<{ key?: string; value?: string }>;
}

export interface ECSServiceInfo {
  serviceArn: string;
  serviceName: string;
  clusterArn: string;
  status?: string;
  taskDefinition?: string;
  desiredCount?: number;
  runningCount?: number;
  pendingCount?: number;
  launchType?: string;
  loadBalancers?: Array<{
    targetGroupArn?: string;
    containerName?: string;
    containerPort?: number;
  }>;
  createdAt?: string;
  deployments?: Array<{
    id?: string;
    status?: string;
    taskDefinition?: string;
    desiredCount?: number;
    runningCount?: number;
  }>;
}

export interface ECSTask {
  taskArn: string;
  clusterArn?: string;
  taskDefinitionArn?: string;
  containerInstanceArn?: string;
  lastStatus?: string;
  desiredStatus?: string;
  cpu?: string;
  memory?: string;
  containers?: Array<{
    name?: string;
    image?: string;
    lastStatus?: string;
    networkBindings?: Array<{
      containerPort?: number;
      hostPort?: number;
      protocol?: string;
    }>;
  }>;
  startedAt?: string;
  createdAt?: string;
  launchType?: string;
}

export interface ECSTaskDefinition {
  taskDefinitionArn: string;
  family: string;
  revision?: number;
  status?: string;
  cpu?: string;
  memory?: string;
  networkMode?: string;
  requiresCompatibilities?: string[];
  containerDefinitions?: Array<{
    name?: string;
    image?: string;
    cpu?: number;
    memory?: number;
    essential?: boolean;
    portMappings?: Array<{
      containerPort?: number;
      hostPort?: number;
      protocol?: string;
    }>;
    environment?: Array<{ name?: string; value?: string }>;
  }>;
}

/**
 * ECS Service
 * Manages AWS ECS operations
 */
export class ECSService {
  private static instance: ECSService;

  private constructor() {
    logger.info('ECS Service initialized');
  }

  public static getInstance(): ECSService {
    if (!ECSService.instance) {
      ECSService.instance = new ECSService();
    }
    return ECSService.instance;
  }

  /**
   * List ECS clusters
   */
  public async listClusters(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey('ecs', 'list-clusters', effectiveRegion);
      const cached = cache.get<string[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached ECS clusters');
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

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new ListClustersCommand({});
      const response = await ecsClient.send(command);

      const clusterArns = response.clusterArns || [];

      cache.set(cacheKey, clusterArns, 300);

      logger.info(`Listed ${clusterArns.length} ECS clusters in ${effectiveRegion}`);

      return {
        success: true,
        data: clusterArns,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: clusterArns.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing ECS clusters', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe ECS clusters
   */
  public async describeClusters(
    clusterArns: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ECSCluster[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new DescribeClustersCommand({
        clusters: clusterArns,
        include: ['STATISTICS', 'TAGS'],
      });

      const response = await ecsClient.send(command);

      const clusters: ECSCluster[] = (response.clusters || []).map((cluster) => ({
        clusterArn: cluster.clusterArn || '',
        clusterName: cluster.clusterName || '',
        status: cluster.status,
        registeredContainerInstancesCount: cluster.registeredContainerInstancesCount,
        runningTasksCount: cluster.runningTasksCount,
        pendingTasksCount: cluster.pendingTasksCount,
        activeServicesCount: cluster.activeServicesCount,
        statistics: cluster.statistics?.map((s) => ({ name: s.name, value: s.value })),
        tags: cluster.tags?.map((t) => ({ key: t.key, value: t.value })),
      }));

      logger.info(`Described ${clusters.length} ECS clusters`);

      return {
        success: true,
        data: clusters,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing ECS clusters', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List services in a cluster
   */
  public async listServices(
    clusterArn: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new ListServicesCommand({
        cluster: clusterArn,
      });

      const response = await ecsClient.send(command);

      const serviceArns = response.serviceArns || [];

      logger.info(`Listed ${serviceArns.length} services in cluster ${clusterArn}`);

      return {
        success: true,
        data: serviceArns,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          clusterArn,
          count: serviceArns.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing ECS services', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe ECS services
   */
  public async describeServices(
    clusterArn: string,
    serviceArns: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ECSServiceInfo[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new DescribeServicesCommand({
        cluster: clusterArn,
        services: serviceArns,
      });

      const response = await ecsClient.send(command);

      const services: ECSServiceInfo[] = (response.services || []).map((svc) => ({
        serviceArn: svc.serviceArn || '',
        serviceName: svc.serviceName || '',
        clusterArn: svc.clusterArn || '',
        status: svc.status,
        taskDefinition: svc.taskDefinition,
        desiredCount: svc.desiredCount,
        runningCount: svc.runningCount,
        pendingCount: svc.pendingCount,
        launchType: svc.launchType,
        loadBalancers: svc.loadBalancers?.map((lb) => ({
          targetGroupArn: lb.targetGroupArn,
          containerName: lb.containerName,
          containerPort: lb.containerPort,
        })),
        createdAt: svc.createdAt?.toISOString(),
        deployments: svc.deployments?.map((d) => ({
          id: d.id,
          status: d.status,
          taskDefinition: d.taskDefinition,
          desiredCount: d.desiredCount,
          runningCount: d.runningCount,
        })),
      }));

      logger.info(`Described ${services.length} ECS services`);

      return {
        success: true,
        data: services,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing ECS services', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List tasks in a cluster
   */
  public async listTasks(
    clusterArn: string,
    serviceName?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new ListTasksCommand({
        cluster: clusterArn,
        serviceName,
      });

      const response = await ecsClient.send(command);

      const taskArns = response.taskArns || [];

      logger.info(`Listed ${taskArns.length} tasks in cluster ${clusterArn}`);

      return {
        success: true,
        data: taskArns,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          clusterArn,
          count: taskArns.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing ECS tasks', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe ECS tasks
   */
  public async describeTasks(
    clusterArn: string,
    taskArns: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ECSTask[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new DescribeTasksCommand({
        cluster: clusterArn,
        tasks: taskArns,
      });

      const response = await ecsClient.send(command);

      const tasks: ECSTask[] = (response.tasks || []).map((task) => ({
        taskArn: task.taskArn || '',
        clusterArn: task.clusterArn,
        taskDefinitionArn: task.taskDefinitionArn,
        containerInstanceArn: task.containerInstanceArn,
        lastStatus: task.lastStatus,
        desiredStatus: task.desiredStatus,
        cpu: task.cpu,
        memory: task.memory,
        containers: task.containers?.map((c) => ({
          name: c.name,
          image: c.image,
          lastStatus: c.lastStatus,
          networkBindings: c.networkBindings?.map((nb) => ({
            containerPort: nb.containerPort,
            hostPort: nb.hostPort,
            protocol: nb.protocol,
          })),
        })),
        startedAt: task.startedAt?.toISOString(),
        createdAt: task.createdAt?.toISOString(),
        launchType: task.launchType,
      }));

      logger.info(`Described ${tasks.length} ECS tasks`);

      return {
        success: true,
        data: tasks,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing ECS tasks', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List task definitions
   */
  public async listTaskDefinitions(
    familyPrefix?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new ListTaskDefinitionsCommand({
        familyPrefix,
        sort: 'DESC',
      });

      const response = await ecsClient.send(command);

      const taskDefinitionArns = response.taskDefinitionArns || [];

      logger.info(`Listed ${taskDefinitionArns.length} task definitions`);

      return {
        success: true,
        data: taskDefinitionArns,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: taskDefinitionArns.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing task definitions', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe task definition
   */
  public async describeTaskDefinition(
    taskDefinitionArn: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ECSTaskDefinition>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const ecsClient = awsClientFactory.getECSClient(effectiveRegion, credentials);

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);

      if (!response.taskDefinition) {
        throw new Error('Task definition not found');
      }

      const td = response.taskDefinition;

      const taskDefinition: ECSTaskDefinition = {
        taskDefinitionArn: td.taskDefinitionArn || '',
        family: td.family || '',
        revision: td.revision,
        status: td.status,
        cpu: td.cpu,
        memory: td.memory,
        networkMode: td.networkMode,
        requiresCompatibilities: td.requiresCompatibilities,
        containerDefinitions: td.containerDefinitions?.map((cd) => ({
          name: cd.name,
          image: cd.image,
          cpu: cd.cpu,
          memory: cd.memory,
          essential: cd.essential,
          portMappings: cd.portMappings?.map((pm) => ({
            containerPort: pm.containerPort,
            hostPort: pm.hostPort,
            protocol: pm.protocol,
          })),
          environment: cd.environment?.map((e) => ({ name: e.name, value: e.value })),
        })),
      };

      logger.info(`Described task definition ${taskDefinitionArn}`);

      return {
        success: true,
        data: taskDefinition,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing task definition', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const ecsService = ECSService.getInstance();
