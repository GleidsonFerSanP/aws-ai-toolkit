/**
 * Unified Execute Action Handler
 * Handles actions on AWS resources: start, stop, reboot, terminate, create, delete, update
 */

import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  StartDBInstanceCommand,
  StopDBInstanceCommand,
  RebootDBInstanceCommand,
  DeleteDBInstanceCommand,
  StartDBClusterCommand,
  StopDBClusterCommand,
} from '@aws-sdk/client-rds';
import {
  ECSClient,
  UpdateServiceCommand,
  StopTaskCommand,
  DeleteServiceCommand,
} from '@aws-sdk/client-ecs';
import {
  EKSClient,
  UpdateNodegroupConfigCommand,
  DeleteNodegroupCommand,
} from '@aws-sdk/client-eks';
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  DeleteFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  UpdateTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials, getRegion } from '../../utils';

interface ExecuteActionArgs {
  action: string;
  resourceType: string;
  resourceIds: string[];
  region?: string;
  profile?: string;
  actionParams?: Record<string, any>;
}

export async function handleExecuteAction(args: ExecuteActionArgs): Promise<CallToolResult> {
  // Get credentials intelligently
  const region = getRegion(args.region);
  const credResult = await getIntelligentCredentials(args.profile, region);
  
  if (credResult.needsConfiguration) {
    return {
      content: [{ type: 'text', text: credResult.message || 'AWS credentials not configured.' }],
      isError: false,
    };
  }

  const credentials = credResult.credentials!;

  // Route to appropriate handler based on resource type and action
  const handlerKey = `${args.resourceType}:${args.action}`;

  switch (handlerKey) {
    // EC2 Instance Actions
    case 'ec2-instances:start':
      return await startEC2Instances(region, credentials, args.resourceIds);
    
    case 'ec2-instances:stop':
      return await stopEC2Instances(region, credentials, args.resourceIds);
    
    case 'ec2-instances:reboot':
      return await rebootEC2Instances(region, credentials, args.resourceIds);
    
    case 'ec2-instances:terminate':
      return await terminateEC2Instances(region, credentials, args.resourceIds);
    
    // RDS Instance Actions
    case 'rds-instances:start':
      return await startRDSInstances(region, credentials, args.resourceIds);
    
    case 'rds-instances:stop':
      return await stopRDSInstances(region, credentials, args.resourceIds);
    
    case 'rds-instances:reboot':
      return await rebootRDSInstances(region, credentials, args.resourceIds);
    
    case 'rds-instances:delete':
      return await deleteRDSInstances(region, credentials, args.resourceIds, args.actionParams);
    
    // RDS Cluster Actions
    case 'rds-clusters:start':
      return await startRDSClusters(region, credentials, args.resourceIds);
    
    case 'rds-clusters:stop':
      return await stopRDSClusters(region, credentials, args.resourceIds);
    
    // ECS Service Actions
    case 'ecs-services:update':
      return await updateECSServices(region, credentials, args.resourceIds, args.actionParams);
    
    case 'ecs-services:delete':
      return await deleteECSServices(region, credentials, args.resourceIds, args.actionParams);
    
    case 'ecs-services:restart':
      return await restartECSServices(region, credentials, args.resourceIds, args.actionParams);
    
    // ECS Task Actions
    case 'ecs-tasks:stop':
      return await stopECSTasks(region, credentials, args.resourceIds, args.actionParams);
    
    // EKS Nodegroup Actions
    case 'eks-nodegroups:update':
      return await updateEKSNodegroups(region, credentials, args.resourceIds, args.actionParams);
    
    case 'eks-nodegroups:delete':
      return await deleteEKSNodegroups(region, credentials, args.resourceIds, args.actionParams);
    
    // Lambda Function Actions
    case 'lambda-functions:update':
      return await updateLambdaFunctions(region, credentials, args.resourceIds, args.actionParams);
    
    case 'lambda-functions:delete':
      return await deleteLambdaFunctions(region, credentials, args.resourceIds);
    
    // DynamoDB Table Actions
    case 'dynamodb-tables:update':
      return await updateDynamoDBTables(region, credentials, args.resourceIds, args.actionParams);
    
    case 'dynamodb-tables:delete':
      return await deleteDynamoDBTables(region, credentials, args.resourceIds);
    
    default:
      throw new Error(`Unsupported action '${args.action}' for resource type '${args.resourceType}'`);
  }
}

// ============================================================================
// EC2 Instance Actions
// ============================================================================

async function startEC2Instances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new StartInstancesCommand({
    InstanceIds: instanceIds,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'start',
        resourceType: 'ec2-instances',
        results: response.StartingInstances?.map(instance => ({
          instanceId: instance.InstanceId,
          previousState: instance.PreviousState?.Name,
          currentState: instance.CurrentState?.Name,
        })),
      }, null, 2),
    }],
  };
}

async function stopEC2Instances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new StopInstancesCommand({
    InstanceIds: instanceIds,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'stop',
        resourceType: 'ec2-instances',
        results: response.StoppingInstances?.map(instance => ({
          instanceId: instance.InstanceId,
          previousState: instance.PreviousState?.Name,
          currentState: instance.CurrentState?.Name,
        })),
      }, null, 2),
    }],
  };
}

async function rebootEC2Instances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  await client.send(new RebootInstancesCommand({
    InstanceIds: instanceIds,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'reboot',
        resourceType: 'ec2-instances',
        message: `Rebooted ${instanceIds.length} instance(s)`,
        instanceIds,
      }, null, 2),
    }],
  };
}

async function terminateEC2Instances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new TerminateInstancesCommand({
    InstanceIds: instanceIds,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'terminate',
        resourceType: 'ec2-instances',
        results: response.TerminatingInstances?.map(instance => ({
          instanceId: instance.InstanceId,
          previousState: instance.PreviousState?.Name,
          currentState: instance.CurrentState?.Name,
        })),
      }, null, 2),
    }],
  };
}

// ============================================================================
// RDS Instance Actions
// ============================================================================

async function startRDSInstances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const instanceId of instanceIds) {
    try {
      const response = await client.send(new StartDBInstanceCommand({
        DBInstanceIdentifier: instanceId,
      }));
      results.push({
        instanceId,
        success: true,
        status: response.DBInstance?.DBInstanceStatus,
      });
    } catch (error: any) {
      results.push({
        instanceId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'start',
        resourceType: 'rds-instances',
        results,
      }, null, 2),
    }],
  };
}

async function stopRDSInstances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const instanceId of instanceIds) {
    try {
      const response = await client.send(new StopDBInstanceCommand({
        DBInstanceIdentifier: instanceId,
      }));
      results.push({
        instanceId,
        success: true,
        status: response.DBInstance?.DBInstanceStatus,
      });
    } catch (error: any) {
      results.push({
        instanceId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'stop',
        resourceType: 'rds-instances',
        results,
      }, null, 2),
    }],
  };
}

async function rebootRDSInstances(region: string, credentials: any, instanceIds: string[]): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const instanceId of instanceIds) {
    try {
      const response = await client.send(new RebootDBInstanceCommand({
        DBInstanceIdentifier: instanceId,
      }));
      results.push({
        instanceId,
        success: true,
        status: response.DBInstance?.DBInstanceStatus,
      });
    } catch (error: any) {
      results.push({
        instanceId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'reboot',
        resourceType: 'rds-instances',
        results,
      }, null, 2),
    }],
  };
}

async function deleteRDSInstances(region: string, credentials: any, instanceIds: string[], params?: any): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const instanceId of instanceIds) {
    try {
      const response = await client.send(new DeleteDBInstanceCommand({
        DBInstanceIdentifier: instanceId,
        SkipFinalSnapshot: params?.skipFinalSnapshot ?? true,
        FinalDBSnapshotIdentifier: params?.finalSnapshotIdentifier,
      }));
      results.push({
        instanceId,
        success: true,
        status: response.DBInstance?.DBInstanceStatus,
      });
    } catch (error: any) {
      results.push({
        instanceId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'delete',
        resourceType: 'rds-instances',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// RDS Cluster Actions
// ============================================================================

async function startRDSClusters(region: string, credentials: any, clusterIds: string[]): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const clusterId of clusterIds) {
    try {
      const response = await client.send(new StartDBClusterCommand({
        DBClusterIdentifier: clusterId,
      }));
      results.push({
        clusterId,
        success: true,
        status: response.DBCluster?.Status,
      });
    } catch (error: any) {
      results.push({
        clusterId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'start',
        resourceType: 'rds-clusters',
        results,
      }, null, 2),
    }],
  };
}

async function stopRDSClusters(region: string, credentials: any, clusterIds: string[]): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const results = [];

  for (const clusterId of clusterIds) {
    try {
      const response = await client.send(new StopDBClusterCommand({
        DBClusterIdentifier: clusterId,
      }));
      results.push({
        clusterId,
        success: true,
        status: response.DBCluster?.Status,
      });
    } catch (error: any) {
      results.push({
        clusterId,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'stop',
        resourceType: 'rds-clusters',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// ECS Service Actions
// ============================================================================

async function updateECSServices(region: string, credentials: any, serviceNames: string[], params?: any): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const results = [];

  for (const serviceName of serviceNames) {
    try {
      const response = await client.send(new UpdateServiceCommand({
        cluster: params?.cluster || 'default',
        service: serviceName,
        desiredCount: params?.desiredCount,
        taskDefinition: params?.taskDefinition,
        forceNewDeployment: params?.forceNewDeployment,
      }));
      results.push({
        serviceName,
        success: true,
        status: response.service?.status,
        desiredCount: response.service?.desiredCount,
      });
    } catch (error: any) {
      results.push({
        serviceName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'update',
        resourceType: 'ecs-services',
        results,
      }, null, 2),
    }],
  };
}

async function deleteECSServices(region: string, credentials: any, serviceNames: string[], params?: any): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const results = [];

  for (const serviceName of serviceNames) {
    try {
      const response = await client.send(new DeleteServiceCommand({
        cluster: params?.cluster || 'default',
        service: serviceName,
        force: params?.force,
      }));
      results.push({
        serviceName,
        success: true,
        status: response.service?.status,
      });
    } catch (error: any) {
      results.push({
        serviceName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'delete',
        resourceType: 'ecs-services',
        results,
      }, null, 2),
    }],
  };
}

async function restartECSServices(region: string, credentials: any, serviceNames: string[], params?: any): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const results = [];

  for (const serviceName of serviceNames) {
    try {
      const response = await client.send(new UpdateServiceCommand({
        cluster: params?.cluster || 'default',
        service: serviceName,
        forceNewDeployment: true,
      }));
      results.push({
        serviceName,
        success: true,
        status: response.service?.status,
      });
    } catch (error: any) {
      results.push({
        serviceName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'restart',
        resourceType: 'ecs-services',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// ECS Task Actions
// ============================================================================

async function stopECSTasks(region: string, credentials: any, taskArns: string[], params?: any): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const results = [];

  for (const taskArn of taskArns) {
    try {
      const response = await client.send(new StopTaskCommand({
        cluster: params?.cluster || 'default',
        task: taskArn,
        reason: params?.reason || 'Stopped via MCP AWS CLI',
      }));
      results.push({
        taskArn,
        success: true,
        status: response.task?.lastStatus,
      });
    } catch (error: any) {
      results.push({
        taskArn,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'stop',
        resourceType: 'ecs-tasks',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// EKS Nodegroup Actions
// ============================================================================

async function updateEKSNodegroups(region: string, credentials: any, nodegroupNames: string[], params?: any): Promise<CallToolResult> {
  if (!params?.clusterName) {
    throw new Error('clusterName is required in actionParams for EKS nodegroup operations');
  }

  const client = new EKSClient({ region, credentials });
  const results = [];

  for (const nodegroupName of nodegroupNames) {
    try {
      const response = await client.send(new UpdateNodegroupConfigCommand({
        clusterName: params.clusterName,
        nodegroupName,
        scalingConfig: params.scalingConfig,
        labels: params.labels,
      }));
      results.push({
        nodegroupName,
        success: true,
        updateId: response.update?.id,
        status: response.update?.status,
      });
    } catch (error: any) {
      results.push({
        nodegroupName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'update',
        resourceType: 'eks-nodegroups',
        results,
      }, null, 2),
    }],
  };
}

async function deleteEKSNodegroups(region: string, credentials: any, nodegroupNames: string[], params?: any): Promise<CallToolResult> {
  if (!params?.clusterName) {
    throw new Error('clusterName is required in actionParams for EKS nodegroup operations');
  }

  const client = new EKSClient({ region, credentials });
  const results = [];

  for (const nodegroupName of nodegroupNames) {
    try {
      const response = await client.send(new DeleteNodegroupCommand({
        clusterName: params.clusterName,
        nodegroupName,
      }));
      results.push({
        nodegroupName,
        success: true,
        status: response.nodegroup?.status,
      });
    } catch (error: any) {
      results.push({
        nodegroupName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'delete',
        resourceType: 'eks-nodegroups',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// Lambda Function Actions
// ============================================================================

async function updateLambdaFunctions(region: string, credentials: any, functionNames: string[], params?: any): Promise<CallToolResult> {
  const client = new LambdaClient({ region, credentials });
  const results = [];

  for (const functionName of functionNames) {
    try {
      const response = await client.send(new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Timeout: params?.timeout,
        MemorySize: params?.memorySize,
        Environment: params?.environment,
        Runtime: params?.runtime,
        Handler: params?.handler,
      }));
      results.push({
        functionName,
        success: true,
        state: response.State,
        lastModified: response.LastModified,
      });
    } catch (error: any) {
      results.push({
        functionName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'update',
        resourceType: 'lambda-functions',
        results,
      }, null, 2),
    }],
  };
}

async function deleteLambdaFunctions(region: string, credentials: any, functionNames: string[]): Promise<CallToolResult> {
  const client = new LambdaClient({ region, credentials });
  const results = [];

  for (const functionName of functionNames) {
    try {
      await client.send(new DeleteFunctionCommand({
        FunctionName: functionName,
      }));
      results.push({
        functionName,
        success: true,
      });
    } catch (error: any) {
      results.push({
        functionName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'delete',
        resourceType: 'lambda-functions',
        results,
      }, null, 2),
    }],
  };
}

// ============================================================================
// DynamoDB Table Actions
// ============================================================================

async function updateDynamoDBTables(region: string, credentials: any, tableNames: string[], params?: any): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const results = [];

  for (const tableName of tableNames) {
    try {
      const response = await client.send(new UpdateTableCommand({
        TableName: tableName,
        BillingMode: params?.billingMode,
        ProvisionedThroughput: params?.provisionedThroughput,
        StreamSpecification: params?.streamSpecification,
      }));
      results.push({
        tableName,
        success: true,
        status: response.TableDescription?.TableStatus,
      });
    } catch (error: any) {
      results.push({
        tableName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'update',
        resourceType: 'dynamodb-tables',
        results,
      }, null, 2),
    }],
  };
}

async function deleteDynamoDBTables(region: string, credentials: any, tableNames: string[]): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const results = [];

  for (const tableName of tableNames) {
    try {
      const response = await client.send(new DeleteTableCommand({
        TableName: tableName,
      }));
      results.push({
        tableName,
        success: true,
        status: response.TableDescription?.TableStatus,
      });
    } catch (error: any) {
      results.push({
        tableName,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'delete',
        resourceType: 'dynamodb-tables',
        results,
      }, null, 2),
    }],
  };
}
