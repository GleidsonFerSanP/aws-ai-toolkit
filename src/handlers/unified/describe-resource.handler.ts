/**
 * Unified Describe Resource Handler
 * Handles detailed information retrieval for any AWS resource
 */

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeKeyPairsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
  DescribeDBSnapshotsCommand,
} from '@aws-sdk/client-rds';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeBackupCommand,
  DescribeTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  DescribeAddonCommand,
} from '@aws-sdk/client-eks';
import {
  S3Client,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials, getRegion } from '../../utils';

interface DescribeResourceArgs {
  resourceType: string;
  resourceId: string;
  region?: string;
  profile?: string;
  additionalParams?: Record<string, any>;
}

export async function handleDescribeResource(args: DescribeResourceArgs): Promise<CallToolResult> {
  // Get credentials intelligently
  const region = getRegion(args.region);
  const credResult = await getIntelligentCredentials(args.profile, region);
  
  // If credentials not found, return helpful message instead of error
  if (credResult.needsConfiguration) {
    return {
      content: [{
        type: 'text',
        text: credResult.message || 'AWS credentials not configured.',
      }],
      isError: false,
    };
  }

  const credentials = credResult.credentials!;

  // Route to appropriate handler based on resource type
  switch (args.resourceType) {
    case 'ec2-instance':
      return await describeEC2Instance(region, credentials, args.resourceId);
    
    case 'ec2-key-pair':
      return await describeKeyPair(region, credentials, args.resourceId);
    
    case 'ec2-security-group':
      return await describeSecurityGroup(region, credentials, args.resourceId);
    
    case 'rds-instance':
      return await describeRDSInstance(region, credentials, args.resourceId);
    
    case 'rds-cluster':
      return await describeRDSCluster(region, credentials, args.resourceId);
    
    case 'rds-snapshot':
      return await describeRDSSnapshot(region, credentials, args.resourceId);
    
    case 'dynamodb-table':
      return await describeDynamoDBTable(region, credentials, args.resourceId);
    
    case 'dynamodb-backup':
      return await describeDynamoDBBackup(region, credentials, args.resourceId);
    
    case 'dynamodb-ttl':
      return await describeDynamoDBTTL(region, credentials, args.resourceId);
    
    case 'ecs-cluster':
      return await describeECSCluster(region, credentials, args.resourceId);
    
    case 'ecs-service':
      return await describeECSService(region, credentials, args.resourceId, args.additionalParams?.cluster);
    
    case 'ecs-task':
      return await describeECSTask(region, credentials, args.resourceId, args.additionalParams?.cluster);
    
    case 'ecs-task-definition':
      return await describeTaskDefinition(region, credentials, args.resourceId);
    
    case 'eks-cluster':
      return await describeEKSCluster(region, credentials, args.resourceId);
    
    case 'eks-nodegroup':
      return await describeEKSNodegroup(region, credentials, args.resourceId, args.additionalParams?.cluster);
    
    case 'eks-addon':
      return await describeEKSAddon(region, credentials, args.resourceId, args.additionalParams?.cluster);
    
    case 's3-bucket':
      return await describeS3Bucket(region, credentials, args.resourceId);
    
    case 'lambda-function':
      return await describeLambdaFunction(region, credentials, args.resourceId);
    
    default:
      throw new Error(`Unsupported resource type: ${args.resourceType}`);
  }
}

// EC2 Resource Descriptions
async function describeEC2Instance(region: string, credentials: any, instanceId: string): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new DescribeInstancesCommand({
    InstanceIds: [instanceId],
  }));

  const instance = response.Reservations?.[0]?.Instances?.[0];
  if (!instance) {
    throw new Error(`EC2 instance '${instanceId}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ec2-instance',
        resource: {
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          availabilityZone: instance.Placement?.AvailabilityZone,
          privateIpAddress: instance.PrivateIpAddress,
          publicIpAddress: instance.PublicIpAddress,
          vpcId: instance.VpcId,
          subnetId: instance.SubnetId,
          securityGroups: instance.SecurityGroups?.map(sg => ({
            id: sg.GroupId,
            name: sg.GroupName,
          })),
          keyName: instance.KeyName,
          launchTime: instance.LaunchTime,
          platform: instance.Platform,
          architecture: instance.Architecture,
          tags: instance.Tags?.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeKeyPair(region: string, credentials: any, keyName: string): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new DescribeKeyPairsCommand({
    KeyNames: [keyName],
  }));

  const keyPair = response.KeyPairs?.[0];
  if (!keyPair) {
    throw new Error(`Key pair '${keyName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ec2-key-pair',
        resource: {
          keyName: keyPair.KeyName,
          keyFingerprint: keyPair.KeyFingerprint,
          keyType: keyPair.KeyType,
          createTime: keyPair.CreateTime,
          tags: keyPair.Tags?.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeSecurityGroup(region: string, credentials: any, groupId: string): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new DescribeSecurityGroupsCommand({
    GroupIds: [groupId],
  }));

  const securityGroup = response.SecurityGroups?.[0];
  if (!securityGroup) {
    throw new Error(`Security group '${groupId}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ec2-security-group',
        resource: {
          groupId: securityGroup.GroupId,
          groupName: securityGroup.GroupName,
          description: securityGroup.Description,
          vpcId: securityGroup.VpcId,
          ingressRules: securityGroup.IpPermissions,
          egressRules: securityGroup.IpPermissionsEgress,
          tags: securityGroup.Tags?.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
        },
      }, null, 2),
    }],
  };
}

// RDS Resource Descriptions
async function describeRDSInstance(region: string, credentials: any, dbInstanceId: string): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const response = await client.send(new DescribeDBInstancesCommand({
    DBInstanceIdentifier: dbInstanceId,
  }));

  const dbInstance = response.DBInstances?.[0];
  if (!dbInstance) {
    throw new Error(`RDS instance '${dbInstanceId}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-instance',
        resource: {
          dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
          dbInstanceClass: dbInstance.DBInstanceClass,
          engine: dbInstance.Engine,
          engineVersion: dbInstance.EngineVersion,
          status: dbInstance.DBInstanceStatus,
          availabilityZone: dbInstance.AvailabilityZone,
          multiAZ: dbInstance.MultiAZ,
          endpoint: dbInstance.Endpoint ? {
            address: dbInstance.Endpoint.Address,
            port: dbInstance.Endpoint.Port,
          } : null,
          allocatedStorage: dbInstance.AllocatedStorage,
          storageType: dbInstance.StorageType,
          vpcId: dbInstance.DBSubnetGroup?.VpcId,
          securityGroups: dbInstance.VpcSecurityGroups?.map(sg => ({
            id: sg.VpcSecurityGroupId,
            status: sg.Status,
          })),
          backupRetentionPeriod: dbInstance.BackupRetentionPeriod,
          publiclyAccessible: dbInstance.PubliclyAccessible,
          tags: dbInstance.TagList?.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeRDSCluster(region: string, credentials: any, dbClusterId: string): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const response = await client.send(new DescribeDBClustersCommand({
    DBClusterIdentifier: dbClusterId,
  }));

  const cluster = response.DBClusters?.[0];
  if (!cluster) {
    throw new Error(`RDS cluster '${dbClusterId}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-cluster',
        resource: {
          dbClusterIdentifier: cluster.DBClusterIdentifier,
          engine: cluster.Engine,
          engineVersion: cluster.EngineVersion,
          status: cluster.Status,
          endpoint: cluster.Endpoint,
          readerEndpoint: cluster.ReaderEndpoint,
          multiAZ: cluster.MultiAZ,
          members: cluster.DBClusterMembers?.map(m => ({
            instanceId: m.DBInstanceIdentifier,
            isWriter: m.IsClusterWriter,
          })),
          availabilityZones: cluster.AvailabilityZones,
          backupRetentionPeriod: cluster.BackupRetentionPeriod,
          tags: cluster.TagList?.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeRDSSnapshot(region: string, credentials: any, snapshotId: string): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const response = await client.send(new DescribeDBSnapshotsCommand({
    DBSnapshotIdentifier: snapshotId,
  }));

  const snapshot = response.DBSnapshots?.[0];
  if (!snapshot) {
    throw new Error(`RDS snapshot '${snapshotId}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-snapshot',
        resource: {
          snapshotId: snapshot.DBSnapshotIdentifier,
          dbInstanceId: snapshot.DBInstanceIdentifier,
          snapshotType: snapshot.SnapshotType,
          status: snapshot.Status,
          engine: snapshot.Engine,
          engineVersion: snapshot.EngineVersion,
          allocatedStorage: snapshot.AllocatedStorage,
          snapshotCreateTime: snapshot.SnapshotCreateTime,
          encrypted: snapshot.Encrypted,
          availabilityZone: snapshot.AvailabilityZone,
        },
      }, null, 2),
    }],
  };
}

// DynamoDB Resource Descriptions
async function describeDynamoDBTable(region: string, credentials: any, tableName: string): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const response = await client.send(new DescribeTableCommand({
    TableName: tableName,
  }));

  const table = response.Table;
  if (!table) {
    throw new Error(`DynamoDB table '${tableName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-table',
        resource: {
          tableName: table.TableName,
          tableStatus: table.TableStatus,
          tableArn: table.TableArn,
          tableId: table.TableId,
          itemCount: table.ItemCount,
          tableSizeBytes: table.TableSizeBytes,
          keySchema: table.KeySchema,
          attributeDefinitions: table.AttributeDefinitions,
          provisionedThroughput: table.ProvisionedThroughput,
          billingModeSummary: table.BillingModeSummary,
          globalSecondaryIndexes: table.GlobalSecondaryIndexes?.map(gsi => ({
            indexName: gsi.IndexName,
            keySchema: gsi.KeySchema,
            projection: gsi.Projection,
            indexStatus: gsi.IndexStatus,
          })),
          streamSpecification: table.StreamSpecification,
          creationDateTime: table.CreationDateTime,
        },
      }, null, 2),
    }],
  };
}

async function describeDynamoDBBackup(region: string, credentials: any, backupArn: string): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const response = await client.send(new DescribeBackupCommand({
    BackupArn: backupArn,
  }));

  const backup = response.BackupDescription;
  if (!backup) {
    throw new Error(`DynamoDB backup '${backupArn}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-backup',
        resource: {
          backupArn: backup.BackupDetails?.BackupArn,
          backupName: backup.BackupDetails?.BackupName,
          backupStatus: backup.BackupDetails?.BackupStatus,
          backupType: backup.BackupDetails?.BackupType,
          backupCreationDateTime: backup.BackupDetails?.BackupCreationDateTime,
          backupSizeBytes: backup.BackupDetails?.BackupSizeBytes,
          tableName: backup.SourceTableDetails?.TableName,
          tableArn: backup.SourceTableDetails?.TableArn,
        },
      }, null, 2),
    }],
  };
}

async function describeDynamoDBTTL(region: string, credentials: any, tableName: string): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const response = await client.send(new DescribeTimeToLiveCommand({
    TableName: tableName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-ttl',
        resource: {
          tableName,
          ttlStatus: response.TimeToLiveDescription?.TimeToLiveStatus,
          attributeName: response.TimeToLiveDescription?.AttributeName,
        },
      }, null, 2),
    }],
  };
}

// ECS Resource Descriptions
async function describeECSCluster(region: string, credentials: any, clusterName: string): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const response = await client.send(new DescribeClustersCommand({
    clusters: [clusterName],
    include: ['STATISTICS', 'TAGS'],
  }));

  const cluster = response.clusters?.[0];
  if (!cluster) {
    throw new Error(`ECS cluster '${clusterName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-cluster',
        resource: {
          clusterArn: cluster.clusterArn,
          clusterName: cluster.clusterName,
          status: cluster.status,
          registeredContainerInstancesCount: cluster.registeredContainerInstancesCount,
          runningTasksCount: cluster.runningTasksCount,
          pendingTasksCount: cluster.pendingTasksCount,
          activeServicesCount: cluster.activeServicesCount,
          statistics: cluster.statistics,
          tags: cluster.tags?.reduce((acc, tag) => ({ ...acc, [tag.key!]: tag.value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeECSService(region: string, credentials: any, serviceName: string, cluster?: string): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const response = await client.send(new DescribeServicesCommand({
    services: [serviceName],
    cluster: cluster || 'default',
  }));

  const service = response.services?.[0];
  if (!service) {
    throw new Error(`ECS service '${serviceName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-service',
        resource: {
          serviceArn: service.serviceArn,
          serviceName: service.serviceName,
          clusterArn: service.clusterArn,
          status: service.status,
          desiredCount: service.desiredCount,
          runningCount: service.runningCount,
          pendingCount: service.pendingCount,
          taskDefinition: service.taskDefinition,
          deployments: service.deployments,
          loadBalancers: service.loadBalancers,
          createdAt: service.createdAt,
        },
      }, null, 2),
    }],
  };
}

async function describeECSTask(region: string, credentials: any, taskArn: string, cluster?: string): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const response = await client.send(new DescribeTasksCommand({
    tasks: [taskArn],
    cluster: cluster || 'default',
    include: ['TAGS'],
  }));

  const task = response.tasks?.[0];
  if (!task) {
    throw new Error(`ECS task '${taskArn}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-task',
        resource: {
          taskArn: task.taskArn,
          clusterArn: task.clusterArn,
          taskDefinitionArn: task.taskDefinitionArn,
          lastStatus: task.lastStatus,
          desiredStatus: task.desiredStatus,
          containers: task.containers,
          cpu: task.cpu,
          memory: task.memory,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          tags: task.tags?.reduce((acc, tag) => ({ ...acc, [tag.key!]: tag.value }), {}),
        },
      }, null, 2),
    }],
  };
}

async function describeTaskDefinition(region: string, credentials: any, taskDefinition: string): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const response = await client.send(new DescribeTaskDefinitionCommand({
    taskDefinition,
    include: ['TAGS'],
  }));

  const taskDef = response.taskDefinition;
  if (!taskDef) {
    throw new Error(`Task definition '${taskDefinition}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-task-definition',
        resource: {
          taskDefinitionArn: taskDef.taskDefinitionArn,
          family: taskDef.family,
          revision: taskDef.revision,
          status: taskDef.status,
          requiresCompatibilities: taskDef.requiresCompatibilities,
          networkMode: taskDef.networkMode,
          cpu: taskDef.cpu,
          memory: taskDef.memory,
          containerDefinitions: taskDef.containerDefinitions,
          tags: response.tags?.reduce((acc, tag) => ({ ...acc, [tag.key!]: tag.value }), {}),
        },
      }, null, 2),
    }],
  };
}

// EKS Resource Descriptions
async function describeEKSCluster(region: string, credentials: any, clusterName: string): Promise<CallToolResult> {
  const client = new EKSClient({ region, credentials });
  const response = await client.send(new DescribeClusterCommand({
    name: clusterName,
  }));

  const cluster = response.cluster;
  if (!cluster) {
    throw new Error(`EKS cluster '${clusterName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-cluster',
        resource: {
          name: cluster.name,
          arn: cluster.arn,
          status: cluster.status,
          version: cluster.version,
          endpoint: cluster.endpoint,
          roleArn: cluster.roleArn,
          resourcesVpcConfig: cluster.resourcesVpcConfig,
          createdAt: cluster.createdAt,
          tags: cluster.tags,
        },
      }, null, 2),
    }],
  };
}

async function describeEKSNodegroup(region: string, credentials: any, nodegroupName: string, clusterName?: string): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in additionalParams for EKS nodegroup');
  }

  const client = new EKSClient({ region, credentials });
  const response = await client.send(new DescribeNodegroupCommand({
    clusterName,
    nodegroupName,
  }));

  const nodegroup = response.nodegroup;
  if (!nodegroup) {
    throw new Error(`EKS nodegroup '${nodegroupName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-nodegroup',
        resource: {
          nodegroupName: nodegroup.nodegroupName,
          nodegroupArn: nodegroup.nodegroupArn,
          clusterName: nodegroup.clusterName,
          status: nodegroup.status,
          version: nodegroup.version,
          instanceTypes: nodegroup.instanceTypes,
          scalingConfig: nodegroup.scalingConfig,
          diskSize: nodegroup.diskSize,
          createdAt: nodegroup.createdAt,
          tags: nodegroup.tags,
        },
      }, null, 2),
    }],
  };
}

async function describeEKSAddon(region: string, credentials: any, addonName: string, clusterName?: string): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in additionalParams for EKS addon');
  }

  const client = new EKSClient({ region, credentials });
  const response = await client.send(new DescribeAddonCommand({
    clusterName,
    addonName,
  }));

  const addon = response.addon;
  if (!addon) {
    throw new Error(`EKS addon '${addonName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-addon',
        resource: {
          addonName: addon.addonName,
          addonArn: addon.addonArn,
          clusterName: addon.clusterName,
          status: addon.status,
          addonVersion: addon.addonVersion,
          createdAt: addon.createdAt,
          modifiedAt: addon.modifiedAt,
          tags: addon.tags,
        },
      }, null, 2),
    }],
  };
}

// S3 Resource Descriptions
async function describeS3Bucket(region: string, credentials: any, bucketName: string): Promise<CallToolResult> {
  const client = new S3Client({ region, credentials });
  
  try {
    const [locationResponse, versioningResponse, encryptionResponse] = await Promise.allSettled([
      client.send(new GetBucketLocationCommand({ Bucket: bucketName })),
      client.send(new GetBucketVersioningCommand({ Bucket: bucketName })),
      client.send(new GetBucketEncryptionCommand({ Bucket: bucketName })),
    ]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          resourceType: 's3-bucket',
          resource: {
            bucketName,
            location: locationResponse.status === 'fulfilled' ? locationResponse.value.LocationConstraint : null,
            versioning: versioningResponse.status === 'fulfilled' ? {
              status: versioningResponse.value.Status,
              mfaDelete: versioningResponse.value.MFADelete,
            } : null,
            encryption: encryptionResponse.status === 'fulfilled' ? {
              rules: encryptionResponse.value.ServerSideEncryptionConfiguration?.Rules,
            } : null,
          },
        }, null, 2),
      }],
    };
  } catch (error: any) {
    throw new Error(`Failed to describe S3 bucket '${bucketName}': ${error.message}`);
  }
}

// Lambda Resource Descriptions
async function describeLambdaFunction(region: string, credentials: any, functionName: string): Promise<CallToolResult> {
  const client = new LambdaClient({ region, credentials });
  const response = await client.send(new GetFunctionCommand({
    FunctionName: functionName,
  }));

  const config = response.Configuration;
  if (!config) {
    throw new Error(`Lambda function '${functionName}' not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'lambda-function',
        resource: {
          functionName: config.FunctionName,
          functionArn: config.FunctionArn,
          runtime: config.Runtime,
          role: config.Role,
          handler: config.Handler,
          codeSize: config.CodeSize,
          description: config.Description,
          timeout: config.Timeout,
          memorySize: config.MemorySize,
          lastModified: config.LastModified,
          state: config.State,
          environment: config.Environment,
          layers: config.Layers,
          codeLocation: response.Code?.Location,
        },
      }, null, 2),
    }],
  };
}
