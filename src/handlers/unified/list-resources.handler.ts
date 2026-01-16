/**
 * Unified List Resources Handler
 * Consolidates all list operations into one handler
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { EC2Client, DescribeInstancesCommand, DescribeKeyPairsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand, DescribeDBSnapshotsCommand, DescribeDBClusterSnapshotsCommand } from '@aws-sdk/client-rds';
import { DynamoDBClient, ListTablesCommand, ListBackupsCommand, ListGlobalTablesCommand } from '@aws-sdk/client-dynamodb';
import { ECSClient, ListClustersCommand, ListServicesCommand, ListTasksCommand, ListTaskDefinitionsCommand } from '@aws-sdk/client-ecs';
import { EKSClient, ListClustersCommand as ListEKSClustersCommand, ListNodegroupsCommand, ListAddonsCommand } from '@aws-sdk/client-eks';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { logger, getIntelligentCredentials, getRegion } from '../../utils';

interface ListResourcesArgs {
  resourceType: string;
  region?: string;
  profile?: string;
  filters?: Record<string, any>;
  maxResults?: number;
}

export async function handleListResources(args: ListResourcesArgs): Promise<CallToolResult> {
  try {
    logger.info(`Listing resources: ${args.resourceType}`);

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
        isError: false, // Not an error, just needs configuration
      };
    }

    const credentials = credResult.credentials!;

    switch (args.resourceType) {
      case 'ec2-instances':
        return await listEC2Instances(region, credentials, args.filters, args.maxResults);
      
      case 'ec2-key-pairs':
        return await listKeyPairs(region, credentials);
      
      case 'rds-instances':
        return await listRDSInstances(region, credentials, args.maxResults);
      
      case 'rds-clusters':
        return await listRDSClusters(region, credentials, args.maxResults);
      
      case 'rds-snapshots':
        return await listRDSSnapshots(region, credentials, args.maxResults);
      
      case 'rds-cluster-snapshots':
        return await listRDSClusterSnapshots(region, credentials, args.maxResults);
      
      case 'dynamodb-tables':
        return await listDynamoDBTables(region, credentials);
      
      case 'dynamodb-backups':
        return await listDynamoDBBackups(region, credentials, args.filters);
      
      case 'dynamodb-global-tables':
        return await listDynamoDBGlobalTables(region, credentials);
      
      case 'ecs-clusters':
        return await listECSClusters(region, credentials, args.maxResults);
      
      case 'ecs-services':
        return await listECSServices(region, credentials, args.filters?.clusterName, args.maxResults);
      
      case 'ecs-tasks':
        return await listECSTasks(region, credentials, args.filters?.clusterName, args.filters?.serviceName, args.maxResults);
      
      case 'ecs-task-definitions':
        return await listECSTaskDefinitions(region, credentials, args.maxResults);
      
      case 'eks-clusters':
        return await listEKSClusters(region, credentials, args.maxResults);
      
      case 'eks-nodegroups':
        return await listEKSNodegroups(region, credentials, args.filters?.clusterName, args.maxResults);
      
      case 'eks-addons':
        return await listEKSAddons(region, credentials, args.filters?.clusterName, args.maxResults);
      
      case 'log-groups':
        return await listLogGroups(region, credentials, args.filters?.prefix, args.maxResults);
      
      case 'log-streams':
        return await listLogStreams(region, credentials, args.filters?.logGroupName, args.maxResults);
      
      default:
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Unsupported resource type: ${args.resourceType}`,
              supportedTypes: [
                'ec2-instances', 'ec2-key-pairs',
                'rds-instances', 'rds-clusters', 'rds-snapshots',
                'dynamodb-tables', 'dynamodb-backups', 'dynamodb-global-tables',
                'ecs-clusters', 'ecs-services', 'ecs-tasks', 'ecs-task-definitions',
                'eks-clusters', 'eks-nodegroups', 'eks-addons',
                'log-groups', 'log-streams',
              ],
            }, null, 2),
          }],
          isError: true,
        };
    }
  } catch (error) {
    logger.error('List resources error', error as Error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: (error as Error).message,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

async function listEC2Instances(region: string, credentials: any, filters?: any, maxResults?: number): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const command = new DescribeInstancesCommand({
    MaxResults: maxResults,
    Filters: filters ? Object.entries(filters).map(([Name, Values]) => ({
      Name,
      Values: Array.isArray(Values) ? Values : [Values],
    })) : undefined,
  });

  const response = await client.send(command);
  const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ec2-instances',
        count: instances.length,
        resources: instances.map(i => ({
          instanceId: i.InstanceId,
          instanceType: i.InstanceType,
          state: i.State?.Name,
          launchTime: i.LaunchTime,
          publicIp: i.PublicIpAddress,
          privateIp: i.PrivateIpAddress,
          tags: i.Tags?.reduce((acc, t) => ({ ...acc, [t.Key!]: t.Value }), {}),
        })),
      }, null, 2),
    }],
  };
}

async function listKeyPairs(region: string, credentials: any): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const command = new DescribeKeyPairsCommand({});
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ec2-key-pairs',
        count: response.KeyPairs?.length || 0,
        resources: response.KeyPairs?.map(kp => ({
          keyName: kp.KeyName,
          keyFingerprint: kp.KeyFingerprint,
          keyType: kp.KeyType,
          tags: kp.Tags?.reduce((acc, t) => ({ ...acc, [t.Key!]: t.Value }), {}),
        })),
      }, null, 2),
    }],
  };
}

async function listRDSInstances(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const command = new DescribeDBInstancesCommand({ MaxRecords: maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-instances',
        count: response.DBInstances?.length || 0,
        resources: response.DBInstances?.map(db => ({
          identifier: db.DBInstanceIdentifier,
          engine: db.Engine,
          engineVersion: db.EngineVersion,
          status: db.DBInstanceStatus,
          instanceClass: db.DBInstanceClass,
          endpoint: db.Endpoint?.Address,
          port: db.Endpoint?.Port,
        })),
      }, null, 2),
    }],
  };
}

async function listRDSClusters(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const command = new DescribeDBClustersCommand({ MaxRecords: maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-clusters',
        count: response.DBClusters?.length || 0,
        resources: response.DBClusters?.map(c => ({
          identifier: c.DBClusterIdentifier,
          engine: c.Engine,
          engineVersion: c.EngineVersion,
          status: c.Status,
          endpoint: c.Endpoint,
          readerEndpoint: c.ReaderEndpoint,
        })),
      }, null, 2),
    }],
  };
}

async function listRDSSnapshots(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const command = new DescribeDBSnapshotsCommand({ MaxRecords: maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-snapshots',
        count: response.DBSnapshots?.length || 0,
        resources: response.DBSnapshots?.map(s => ({
          identifier: s.DBSnapshotIdentifier,
          instanceIdentifier: s.DBInstanceIdentifier,
          status: s.Status,
          snapshotType: s.SnapshotType,
          createTime: s.SnapshotCreateTime,
        })),
      }, null, 2),
    }],
  };
}

async function listRDSClusterSnapshots(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new RDSClient({ region, credentials });
  const command = new DescribeDBClusterSnapshotsCommand({ MaxRecords: maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'rds-cluster-snapshots',
        count: response.DBClusterSnapshots?.length || 0,
        resources: response.DBClusterSnapshots?.map(s => ({
          identifier: s.DBClusterSnapshotIdentifier,
          clusterIdentifier: s.DBClusterIdentifier,
          status: s.Status,
          snapshotType: s.SnapshotType,
          createTime: s.SnapshotCreateTime,
        })),
      }, null, 2),
    }],
  };
}

async function listDynamoDBTables(region: string, credentials: any): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const command = new ListTablesCommand({});
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-tables',
        count: response.TableNames?.length || 0,
        resources: response.TableNames,
      }, null, 2),
    }],
  };
}

async function listDynamoDBBackups(region: string, credentials: any, filters?: any): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const command = new ListBackupsCommand({
    TableName: filters?.tableName,
  });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-backups',
        count: response.BackupSummaries?.length || 0,
        resources: response.BackupSummaries?.map(b => ({
          backupArn: b.BackupArn,
          tableName: b.TableName,
          backupName: b.BackupName,
          backupStatus: b.BackupStatus,
          backupCreationDateTime: b.BackupCreationDateTime,
        })),
      }, null, 2),
    }],
  };
}

async function listDynamoDBGlobalTables(region: string, credentials: any): Promise<CallToolResult> {
  const client = new DynamoDBClient({ region, credentials });
  const command = new ListGlobalTablesCommand({});
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'dynamodb-global-tables',
        count: response.GlobalTables?.length || 0,
        resources: response.GlobalTables?.map(gt => ({
          globalTableName: gt.GlobalTableName,
          replicationGroup: gt.ReplicationGroup,
        })),
      }, null, 2),
    }],
  };
}

async function listECSClusters(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const command = new ListClustersCommand({ maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-clusters',
        count: response.clusterArns?.length || 0,
        resources: response.clusterArns,
      }, null, 2),
    }],
  };
}

async function listECSServices(region: string, credentials: any, clusterName?: string, maxResults?: number): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in filters for listing ECS services');
  }

  const client = new ECSClient({ region, credentials });
  const command = new ListServicesCommand({ cluster: clusterName, maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-services',
        clusterName,
        count: response.serviceArns?.length || 0,
        resources: response.serviceArns,
      }, null, 2),
    }],
  };
}

async function listECSTasks(region: string, credentials: any, clusterName?: string, serviceName?: string, maxResults?: number): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in filters for listing ECS tasks');
  }

  const client = new ECSClient({ region, credentials });
  const command = new ListTasksCommand({
    cluster: clusterName,
    serviceName,
    maxResults,
  });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-tasks',
        clusterName,
        serviceName: serviceName || 'all',
        count: response.taskArns?.length || 0,
        resources: response.taskArns,
      }, null, 2),
    }],
  };
}

async function listECSTaskDefinitions(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new ECSClient({ region, credentials });
  const command = new ListTaskDefinitionsCommand({ maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'ecs-task-definitions',
        count: response.taskDefinitionArns?.length || 0,
        resources: response.taskDefinitionArns,
      }, null, 2),
    }],
  };
}

async function listEKSClusters(region: string, credentials: any, maxResults?: number): Promise<CallToolResult> {
  const client = new EKSClient({ region, credentials });
  const command = new ListEKSClustersCommand({ maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-clusters',
        count: response.clusters?.length || 0,
        resources: response.clusters,
      }, null, 2),
    }],
  };
}

async function listEKSNodegroups(region: string, credentials: any, clusterName?: string, maxResults?: number): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in filters for listing EKS nodegroups');
  }

  const client = new EKSClient({ region, credentials });
  const command = new ListNodegroupsCommand({ clusterName, maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-nodegroups',
        clusterName,
        count: response.nodegroups?.length || 0,
        resources: response.nodegroups,
      }, null, 2),
    }],
  };
}

async function listEKSAddons(region: string, credentials: any, clusterName?: string, maxResults?: number): Promise<CallToolResult> {
  if (!clusterName) {
    throw new Error('clusterName is required in filters for listing EKS addons');
  }

  const client = new EKSClient({ region, credentials });
  const command = new ListAddonsCommand({ clusterName, maxResults });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'eks-addons',
        clusterName,
        count: response.addons?.length || 0,
        resources: response.addons,
      }, null, 2),
    }],
  };
}

async function listLogGroups(region: string, credentials: any, prefix?: string, maxResults?: number): Promise<CallToolResult> {
  const client = new CloudWatchLogsClient({ region, credentials });
  const command = new DescribeLogGroupsCommand({
    logGroupNamePrefix: prefix,
    limit: maxResults,
  });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'log-groups',
        count: response.logGroups?.length || 0,
        resources: response.logGroups?.map(lg => ({
          logGroupName: lg.logGroupName,
          creationTime: lg.creationTime,
          storedBytes: lg.storedBytes,
          retentionInDays: lg.retentionInDays,
        })),
      }, null, 2),
    }],
  };
}

async function listLogStreams(region: string, credentials: any, logGroupName?: string, maxResults?: number): Promise<CallToolResult> {
  if (!logGroupName) {
    throw new Error('logGroupName is required in filters for listing log streams');
  }

  const client = new CloudWatchLogsClient({ region, credentials });
  const command = new DescribeLogStreamsCommand({
    logGroupName,
    limit: maxResults,
  });
  const response = await client.send(command);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        resourceType: 'log-streams',
        logGroupName,
        count: response.logStreams?.length || 0,
        resources: response.logStreams?.map(ls => ({
          logStreamName: ls.logStreamName,
          creationTime: ls.creationTime,
          firstEventTimestamp: ls.firstEventTimestamp,
          lastEventTimestamp: ls.lastEventTimestamp,
          lastIngestionTime: ls.lastIngestionTime,
        })),
      }, null, 2),
    }],
  };
}
