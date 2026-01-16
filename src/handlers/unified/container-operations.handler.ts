/**
 * Unified Container Operations Handler
 * Handles ECS and EKS unified operations
 */

import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  ListTaskDefinitionsCommand,
  DescribeTaskDefinitionCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  StopTaskCommand,
} from '@aws-sdk/client-ecs';
import {
  EKSClient,
  ListClustersCommand as ListEKSClustersCommand,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  ListAddonsCommand,
  DescribeAddonCommand,
  UpdateNodegroupConfigCommand,
  DeleteNodegroupCommand,
} from '@aws-sdk/client-eks';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { profileService } from '../../services/profile.service';

interface ContainerOperationsArgs {
  platform: string;
  resourceType: string;
  operation: string;
  clusterName?: string;
  resourceIds?: string[];
  operationParams?: Record<string, any>;
  region?: string;
  profile?: string;
}

export async function handleContainerOperations(args: ContainerOperationsArgs): Promise<CallToolResult> {
  // Get profile credentials
  const profileData = args.profile
    ? await profileService.getProfile(args.profile)
    : await profileService.getActiveProfile();

  if (!profileData || !profileData.data) {
    throw new Error(args.profile ? `Profile '${args.profile}' not found` : 'No active profile configured');
  }

  const profile = profileData.data;
  const region = args.region || profile.region;
  const credentials = {
    accessKeyId: profile.accessKeyId,
    secretAccessKey: profile.secretAccessKey,
    sessionToken: profile.sessionToken,
  };

  // Route to appropriate platform
  if (args.platform === 'ecs') {
    return await handleECSOperations(region, credentials, args);
  } else if (args.platform === 'eks') {
    return await handleEKSOperations(region, credentials, args);
  } else {
    throw new Error(`Unsupported container platform: ${args.platform}`);
  }
}

// ============================================================================
// ECS Operations
// ============================================================================

async function handleECSOperations(
  region: string,
  credentials: any,
  args: ContainerOperationsArgs
): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const handlerKey = `${args.resourceType}:${args.operation}`;

  switch (handlerKey) {
    case 'clusters:list':
      return await ecsListClusters(client);
    
    case 'clusters:describe':
      return await ecsDescribeClusters(client, args);
    
    case 'services:list':
      return await ecsListServices(client, args);
    
    case 'services:describe':
      return await ecsDescribeServices(client, args);
    
    case 'services:update':
    case 'services:scale':
      return await ecsUpdateService(client, args);
    
    case 'services:restart':
      return await ecsRestartService(client, args);
    
    case 'services:delete':
      return await ecsDeleteService(client, args);
    
    case 'tasks:list':
      return await ecsListTasks(client, args);
    
    case 'tasks:describe':
      return await ecsDescribeTasks(client, args);
    
    case 'tasks:stop':
      return await ecsStopTasks(client, args);
    
    case 'task-definitions:list':
      return await ecsListTaskDefinitions(client);
    
    case 'task-definitions:describe':
      return await ecsDescribeTaskDefinition(client, args);
    
    default:
      throw new Error(`Unsupported ECS operation: ${args.resourceType}:${args.operation}`);
  }
}

async function ecsListClusters(client: ECSClient): Promise<CallToolResult> {
  const response = await client.send(new ListClustersCommand({}));
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'clusters',
        operation: 'list',
        count: response.clusterArns?.length || 0,
        clusterArns: response.clusterArns || [],
      }, null, 2),
    }],
  };
}

async function ecsDescribeClusters(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  const clusterNames = args.resourceIds || (args.clusterName ? [args.clusterName] : undefined);
  const response = await client.send(new DescribeClustersCommand({
    clusters: clusterNames,
    include: ['STATISTICS', 'TAGS'],
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'clusters',
        operation: 'describe',
        clusters: response.clusters,
      }, null, 2),
    }],
  };
}

async function ecsListServices(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  const response = await client.send(new ListServicesCommand({
    cluster: args.clusterName || 'default',
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'services',
        operation: 'list',
        cluster: args.clusterName || 'default',
        count: response.serviceArns?.length || 0,
        serviceArns: response.serviceArns || [],
      }, null, 2),
    }],
  };
}

async function ecsDescribeServices(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for describe services operation');
  }

  const response = await client.send(new DescribeServicesCommand({
    cluster: args.clusterName || 'default',
    services: args.resourceIds,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'services',
        operation: 'describe',
        services: response.services,
      }, null, 2),
    }],
  };
}

async function ecsUpdateService(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for update/scale service operation');
  }

  const results = [];
  for (const serviceName of args.resourceIds) {
    try {
      const response = await client.send(new UpdateServiceCommand({
        cluster: args.clusterName || 'default',
        service: serviceName,
        desiredCount: args.operationParams?.desiredCount,
        taskDefinition: args.operationParams?.taskDefinition,
      }));
      results.push({ serviceName, success: true, service: response.service });
    } catch (error: any) {
      results.push({ serviceName, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'services',
        operation: args.operation,
        results,
      }, null, 2),
    }],
  };
}

async function ecsRestartService(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for restart service operation');
  }

  const results = [];
  for (const serviceName of args.resourceIds) {
    try {
      const response = await client.send(new UpdateServiceCommand({
        cluster: args.clusterName || 'default',
        service: serviceName,
        forceNewDeployment: true,
      }));
      results.push({ serviceName, success: true, service: response.service });
    } catch (error: any) {
      results.push({ serviceName, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'services',
        operation: 'restart',
        results,
      }, null, 2),
    }],
  };
}

async function ecsDeleteService(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for delete service operation');
  }

  const results = [];
  for (const serviceName of args.resourceIds) {
    try {
      const response = await client.send(new DeleteServiceCommand({
        cluster: args.clusterName || 'default',
        service: serviceName,
        force: args.operationParams?.force,
      }));
      results.push({ serviceName, success: true, service: response.service });
    } catch (error: any) {
      results.push({ serviceName, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'services',
        operation: 'delete',
        results,
      }, null, 2),
    }],
  };
}

async function ecsListTasks(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  const response = await client.send(new ListTasksCommand({
    cluster: args.clusterName || 'default',
    serviceName: args.operationParams?.serviceName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'tasks',
        operation: 'list',
        cluster: args.clusterName || 'default',
        count: response.taskArns?.length || 0,
        taskArns: response.taskArns || [],
      }, null, 2),
    }],
  };
}

async function ecsDescribeTasks(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for describe tasks operation');
  }

  const response = await client.send(new DescribeTasksCommand({
    cluster: args.clusterName || 'default',
    tasks: args.resourceIds,
    include: ['TAGS'],
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'tasks',
        operation: 'describe',
        tasks: response.tasks,
      }, null, 2),
    }],
  };
}

async function ecsStopTasks(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for stop tasks operation');
  }

  const results = [];
  for (const taskArn of args.resourceIds) {
    try {
      const response = await client.send(new StopTaskCommand({
        cluster: args.clusterName || 'default',
        task: taskArn,
        reason: args.operationParams?.reason || 'Stopped via MCP AWS CLI',
      }));
      results.push({ taskArn, success: true, task: response.task });
    } catch (error: any) {
      results.push({ taskArn, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'tasks',
        operation: 'stop',
        results,
      }, null, 2),
    }],
  };
}

async function ecsListTaskDefinitions(client: ECSClient): Promise<CallToolResult> {
  const response = await client.send(new ListTaskDefinitionsCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'task-definitions',
        operation: 'list',
        count: response.taskDefinitionArns?.length || 0,
        taskDefinitionArns: response.taskDefinitionArns || [],
      }, null, 2),
    }],
  };
}

async function ecsDescribeTaskDefinition(client: ECSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for describe task definition operation');
  }

  const response = await client.send(new DescribeTaskDefinitionCommand({
    taskDefinition: args.resourceIds[0],
    include: ['TAGS'],
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'ecs',
        resourceType: 'task-definitions',
        operation: 'describe',
        taskDefinition: response.taskDefinition,
        tags: response.tags,
      }, null, 2),
    }],
  };
}

// ============================================================================
// EKS Operations
// ============================================================================

async function handleEKSOperations(
  region: string,
  credentials: any,
  args: ContainerOperationsArgs
): Promise<CallToolResult> {
  const client = new EKSClient({ region, credentials });
  const handlerKey = `${args.resourceType}:${args.operation}`;

  switch (handlerKey) {
    case 'clusters:list':
      return await eksListClusters(client);
    
    case 'clusters:describe':
      return await eksDescribeCluster(client, args);
    
    case 'nodegroups:list':
      return await eksListNodegroups(client, args);
    
    case 'nodegroups:describe':
      return await eksDescribeNodegroup(client, args);
    
    case 'nodegroups:update':
    case 'nodegroups:scale':
      return await eksUpdateNodegroup(client, args);
    
    case 'nodegroups:delete':
      return await eksDeleteNodegroup(client, args);
    
    case 'addons:list':
      return await eksListAddons(client, args);
    
    case 'addons:describe':
      return await eksDescribeAddon(client, args);
    
    default:
      throw new Error(`Unsupported EKS operation: ${args.resourceType}:${args.operation}`);
  }
}

async function eksListClusters(client: EKSClient): Promise<CallToolResult> {
  const response = await client.send(new ListEKSClustersCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'clusters',
        operation: 'list',
        count: response.clusters?.length || 0,
        clusters: response.clusters || [],
      }, null, 2),
    }],
  };
}

async function eksDescribeCluster(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for describe cluster operation');
  }

  const response = await client.send(new DescribeClusterCommand({
    name: args.clusterName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'clusters',
        operation: 'describe',
        cluster: response.cluster,
      }, null, 2),
    }],
  };
}

async function eksListNodegroups(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for list nodegroups operation');
  }

  const response = await client.send(new ListNodegroupsCommand({
    clusterName: args.clusterName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'nodegroups',
        operation: 'list',
        clusterName: args.clusterName,
        count: response.nodegroups?.length || 0,
        nodegroups: response.nodegroups || [],
      }, null, 2),
    }],
  };
}

async function eksDescribeNodegroup(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for describe nodegroup operation');
  }

  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for describe nodegroup operation');
  }

  const response = await client.send(new DescribeNodegroupCommand({
    clusterName: args.clusterName,
    nodegroupName: args.resourceIds[0],
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'nodegroups',
        operation: 'describe',
        nodegroup: response.nodegroup,
      }, null, 2),
    }],
  };
}

async function eksUpdateNodegroup(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for update nodegroup operation');
  }

  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for update nodegroup operation');
  }

  const results = [];
  for (const nodegroupName of args.resourceIds) {
    try {
      const response = await client.send(new UpdateNodegroupConfigCommand({
        clusterName: args.clusterName,
        nodegroupName,
        scalingConfig: args.operationParams?.scalingConfig,
        labels: args.operationParams?.labels,
      }));
      results.push({ nodegroupName, success: true, update: response.update });
    } catch (error: any) {
      results.push({ nodegroupName, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'nodegroups',
        operation: args.operation,
        results,
      }, null, 2),
    }],
  };
}

async function eksDeleteNodegroup(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for delete nodegroup operation');
  }

  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for delete nodegroup operation');
  }

  const results = [];
  for (const nodegroupName of args.resourceIds) {
    try {
      const response = await client.send(new DeleteNodegroupCommand({
        clusterName: args.clusterName,
        nodegroupName,
      }));
      results.push({ nodegroupName, success: true, nodegroup: response.nodegroup });
    } catch (error: any) {
      results.push({ nodegroupName, success: false, error: error.message });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'nodegroups',
        operation: 'delete',
        results,
      }, null, 2),
    }],
  };
}

async function eksListAddons(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for list addons operation');
  }

  const response = await client.send(new ListAddonsCommand({
    clusterName: args.clusterName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'addons',
        operation: 'list',
        clusterName: args.clusterName,
        count: response.addons?.length || 0,
        addons: response.addons || [],
      }, null, 2),
    }],
  };
}

async function eksDescribeAddon(client: EKSClient, args: ContainerOperationsArgs): Promise<CallToolResult> {
  if (!args.clusterName) {
    throw new Error('clusterName is required for describe addon operation');
  }

  if (!args.resourceIds || args.resourceIds.length === 0) {
    throw new Error('resourceIds is required for describe addon operation');
  }

  const response = await client.send(new DescribeAddonCommand({
    clusterName: args.clusterName,
    addonName: args.resourceIds[0],
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        platform: 'eks',
        resourceType: 'addons',
        operation: 'describe',
        addon: response.addon,
      }, null, 2),
    }],
  };
}
