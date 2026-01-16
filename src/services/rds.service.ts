/**
 * RDS Service
 * AWS RDS (Relational Database Service) operations
 */

import {
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
  DescribeDBSnapshotsCommand,
  DescribeDBClusterSnapshotsCommand,
  DescribeDBEngineVersionsCommand,
  DescribeEventsCommand,
} from '@aws-sdk/client-rds';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface RDSInstance {
  dbInstanceIdentifier: string;
  dbInstanceArn: string;
  dbInstanceClass: string;
  engine: string;
  engineVersion?: string;
  dbInstanceStatus?: string;
  masterUsername?: string;
  dbName?: string;
  endpoint?: any;
  allocatedStorage?: number;
  storageType?: string;
  storageEncrypted?: boolean;
  availabilityZone?: string;
  multiAZ?: boolean;
  publiclyAccessible?: boolean;
  vpcSecurityGroups?: any[];
  dbSubnetGroup?: any;
  backupRetentionPeriod?: number;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  latestRestorableTime?: string;
  instanceCreateTime?: string;
  tags?: Array<{ key?: string; value?: string }>;
}

export interface RDSCluster {
  dbClusterIdentifier: string;
  dbClusterArn: string;
  engine: string;
  engineVersion?: string;
  status?: string;
  endpoint?: string;
  readerEndpoint?: string;
  port?: number;
  masterUsername?: string;
  dbClusterMembers?: any[];
  allocatedStorage?: number;
  storageEncrypted?: boolean;
  availabilityZones?: string[];
  multiAZ?: boolean;
  backupRetentionPeriod?: number;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  clusterCreateTime?: string;
  tags?: Array<{ key?: string; value?: string }>;
}

export interface RDSSnapshot {
  dbSnapshotIdentifier: string;
  dbSnapshotArn: string;
  dbInstanceIdentifier?: string;
  snapshotCreateTime?: string;
  engine?: string;
  engineVersion?: string;
  allocatedStorage?: number;
  status?: string;
  port?: number;
  availabilityZone?: string;
  vpcId?: string;
  instanceCreateTime?: string;
  storageType?: string;
  encrypted?: boolean;
  snapshotType?: string;
  percentProgress?: number;
}

export interface RDSEvent {
  sourceIdentifier?: string;
  sourceType?: string;
  message?: string;
  eventCategories?: string[];
  date?: string;
  sourceArn?: string;
}

/**
 * RDS Service
 * Manages AWS RDS operations
 */
export class RDSService {
  private static instance: RDSService;

  private constructor() {
    logger.info('RDS Service initialized');
  }

  public static getInstance(): RDSService {
    if (!RDSService.instance) {
      RDSService.instance = new RDSService();
    }
    return RDSService.instance;
  }

  /**
   * List RDS instances
   */
  public async listInstances(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSInstance[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey('rds', 'list-instances', effectiveRegion);
      const cached = cache.get<RDSInstance[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached RDS instances');
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

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const instances: RDSInstance[] = (response.DBInstances || []).map((db) => ({
        dbInstanceIdentifier: db.DBInstanceIdentifier || '',
        dbInstanceArn: db.DBInstanceArn || '',
        dbInstanceClass: db.DBInstanceClass || '',
        engine: db.Engine || '',
        engineVersion: db.EngineVersion,
        dbInstanceStatus: db.DBInstanceStatus,
        masterUsername: db.MasterUsername,
        dbName: db.DBName,
        endpoint: db.Endpoint,
        allocatedStorage: db.AllocatedStorage,
        storageType: db.StorageType,
        storageEncrypted: db.StorageEncrypted,
        availabilityZone: db.AvailabilityZone,
        multiAZ: db.MultiAZ,
        publiclyAccessible: db.PubliclyAccessible,
        vpcSecurityGroups: db.VpcSecurityGroups,
        dbSubnetGroup: db.DBSubnetGroup,
        backupRetentionPeriod: db.BackupRetentionPeriod,
        preferredBackupWindow: db.PreferredBackupWindow,
        preferredMaintenanceWindow: db.PreferredMaintenanceWindow,
        latestRestorableTime: db.LatestRestorableTime?.toISOString(),
        instanceCreateTime: db.InstanceCreateTime?.toISOString(),
        tags: db.TagList?.map((t) => ({ key: t.Key, value: t.Value })),
      }));

      cache.set(cacheKey, instances, 300);

      logger.info(`Listed ${instances.length} RDS instances in ${effectiveRegion}`);

      return {
        success: true,
        data: instances,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: instances.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing RDS instances', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe specific RDS instance
   */
  public async describeInstance(
    dbInstanceIdentifier: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSInstance>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });

      const response = await rdsClient.send(command);

      if (!response.DBInstances || response.DBInstances.length === 0) {
        throw new Error(`Instance ${dbInstanceIdentifier} not found`);
      }

      const db = response.DBInstances[0];

      const instance: RDSInstance = {
        dbInstanceIdentifier: db.DBInstanceIdentifier || '',
        dbInstanceArn: db.DBInstanceArn || '',
        dbInstanceClass: db.DBInstanceClass || '',
        engine: db.Engine || '',
        engineVersion: db.EngineVersion,
        dbInstanceStatus: db.DBInstanceStatus,
        masterUsername: db.MasterUsername,
        dbName: db.DBName,
        endpoint: db.Endpoint,
        allocatedStorage: db.AllocatedStorage,
        storageType: db.StorageType,
        storageEncrypted: db.StorageEncrypted,
        availabilityZone: db.AvailabilityZone,
        multiAZ: db.MultiAZ,
        publiclyAccessible: db.PubliclyAccessible,
        vpcSecurityGroups: db.VpcSecurityGroups,
        dbSubnetGroup: db.DBSubnetGroup,
        backupRetentionPeriod: db.BackupRetentionPeriod,
        preferredBackupWindow: db.PreferredBackupWindow,
        preferredMaintenanceWindow: db.PreferredMaintenanceWindow,
        latestRestorableTime: db.LatestRestorableTime?.toISOString(),
        instanceCreateTime: db.InstanceCreateTime?.toISOString(),
        tags: db.TagList?.map((t) => ({ key: t.Key, value: t.Value })),
      };

      logger.info(`Described RDS instance ${dbInstanceIdentifier}`);

      return {
        success: true,
        data: instance,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing RDS instance', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List RDS clusters (Aurora)
   */
  public async listClusters(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSCluster[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey('rds', 'list-clusters', effectiveRegion);
      const cached = cache.get<RDSCluster[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached RDS clusters');
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

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const clusters: RDSCluster[] = (response.DBClusters || []).map((cluster) => ({
        dbClusterIdentifier: cluster.DBClusterIdentifier || '',
        dbClusterArn: cluster.DBClusterArn || '',
        engine: cluster.Engine || '',
        engineVersion: cluster.EngineVersion,
        status: cluster.Status,
        endpoint: cluster.Endpoint,
        readerEndpoint: cluster.ReaderEndpoint,
        port: cluster.Port,
        masterUsername: cluster.MasterUsername,
        dbClusterMembers: cluster.DBClusterMembers,
        allocatedStorage: cluster.AllocatedStorage,
        storageEncrypted: cluster.StorageEncrypted,
        availabilityZones: cluster.AvailabilityZones,
        multiAZ: cluster.MultiAZ,
        backupRetentionPeriod: cluster.BackupRetentionPeriod,
        preferredBackupWindow: cluster.PreferredBackupWindow,
        preferredMaintenanceWindow: cluster.PreferredMaintenanceWindow,
        clusterCreateTime: cluster.ClusterCreateTime?.toISOString(),
        tags: cluster.TagList?.map((t) => ({ key: t.Key, value: t.Value })),
      }));

      cache.set(cacheKey, clusters, 300);

      logger.info(`Listed ${clusters.length} RDS clusters in ${effectiveRegion}`);

      return {
        success: true,
        data: clusters,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: clusters.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing RDS clusters', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Describe specific RDS cluster
   */
  public async describeCluster(
    dbClusterIdentifier: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSCluster>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: dbClusterIdentifier,
      });

      const response = await rdsClient.send(command);

      if (!response.DBClusters || response.DBClusters.length === 0) {
        throw new Error(`Cluster ${dbClusterIdentifier} not found`);
      }

      const cluster = response.DBClusters[0];

      const clusterData: RDSCluster = {
        dbClusterIdentifier: cluster.DBClusterIdentifier || '',
        dbClusterArn: cluster.DBClusterArn || '',
        engine: cluster.Engine || '',
        engineVersion: cluster.EngineVersion,
        status: cluster.Status,
        endpoint: cluster.Endpoint,
        readerEndpoint: cluster.ReaderEndpoint,
        port: cluster.Port,
        masterUsername: cluster.MasterUsername,
        dbClusterMembers: cluster.DBClusterMembers,
        allocatedStorage: cluster.AllocatedStorage,
        storageEncrypted: cluster.StorageEncrypted,
        availabilityZones: cluster.AvailabilityZones,
        multiAZ: cluster.MultiAZ,
        backupRetentionPeriod: cluster.BackupRetentionPeriod,
        preferredBackupWindow: cluster.PreferredBackupWindow,
        preferredMaintenanceWindow: cluster.PreferredMaintenanceWindow,
        clusterCreateTime: cluster.ClusterCreateTime?.toISOString(),
        tags: cluster.TagList?.map((t) => ({ key: t.Key, value: t.Value })),
      };

      logger.info(`Described RDS cluster ${dbClusterIdentifier}`);

      return {
        success: true,
        data: clusterData,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error describing RDS cluster', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List DB snapshots
   */
  public async listSnapshots(
    dbInstanceIdentifier?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSSnapshot[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBSnapshotsCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });

      const response = await rdsClient.send(command);

      const snapshots: RDSSnapshot[] = (response.DBSnapshots || []).map((snap) => ({
        dbSnapshotIdentifier: snap.DBSnapshotIdentifier || '',
        dbSnapshotArn: snap.DBSnapshotArn || '',
        dbInstanceIdentifier: snap.DBInstanceIdentifier,
        snapshotCreateTime: snap.SnapshotCreateTime?.toISOString(),
        engine: snap.Engine,
        engineVersion: snap.EngineVersion,
        allocatedStorage: snap.AllocatedStorage,
        status: snap.Status,
        port: snap.Port,
        availabilityZone: snap.AvailabilityZone,
        vpcId: snap.VpcId,
        instanceCreateTime: snap.InstanceCreateTime?.toISOString(),
        storageType: snap.StorageType,
        encrypted: snap.Encrypted,
        snapshotType: snap.SnapshotType,
        percentProgress: snap.PercentProgress,
      }));

      logger.info(`Listed ${snapshots.length} RDS snapshots`);

      return {
        success: true,
        data: snapshots,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: snapshots.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing RDS snapshots', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List DB cluster snapshots (Aurora)
   */
  public async listClusterSnapshots(
    dbClusterIdentifier?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSSnapshot[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBClusterSnapshotsCommand({
        DBClusterIdentifier: dbClusterIdentifier,
      });

      const response = await rdsClient.send(command);

      const snapshots: RDSSnapshot[] = (response.DBClusterSnapshots || []).map((snap) => ({
        dbSnapshotIdentifier: snap.DBClusterSnapshotIdentifier || '',
        dbSnapshotArn: snap.DBClusterSnapshotArn || '',
        dbInstanceIdentifier: snap.DBClusterIdentifier,
        snapshotCreateTime: snap.SnapshotCreateTime?.toISOString(),
        engine: snap.Engine,
        engineVersion: snap.EngineVersion,
        allocatedStorage: snap.AllocatedStorage,
        status: snap.Status,
        port: snap.Port,
        availabilityZone: snap.AvailabilityZones?.[0],
        vpcId: snap.VpcId,
        storageType: snap.StorageType,
        encrypted: snap.StorageEncrypted,
        snapshotType: snap.SnapshotType,
        percentProgress: snap.PercentProgress,
      }));

      logger.info(`Listed ${snapshots.length} RDS cluster snapshots`);

      return {
        success: true,
        data: snapshots,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: snapshots.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing RDS cluster snapshots', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List available DB engines
   */
  public async listEngineVersions(
    engine?: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<Array<{ engine?: string; engineVersion?: string }>>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeDBEngineVersionsCommand({
        Engine: engine,
        ListSupportedCharacterSets: false,
        ListSupportedTimezones: false,
      });

      const response = await rdsClient.send(command);

      const versions = (response.DBEngineVersions || []).map((v) => ({
        engine: v.Engine,
        engineVersion: v.EngineVersion,
      }));

      logger.info(`Listed ${versions.length} engine versions`);

      return {
        success: true,
        data: versions,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: versions.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing engine versions', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List RDS events
   */
  public async listEvents(
    sourceIdentifier?: string,
    sourceType?: string,
    startTime?: Date,
    endTime?: Date,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<RDSEvent[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const rdsClient = awsClientFactory.getRDSClient(effectiveRegion, credentials);

      const command = new DescribeEventsCommand({
        SourceIdentifier: sourceIdentifier,
        SourceType: sourceType as any,
        StartTime: startTime,
        EndTime: endTime,
        Duration: !startTime && !endTime ? 60 : undefined, // Last hour by default
      });

      const response = await rdsClient.send(command);

      const events: RDSEvent[] = (response.Events || []).map((evt) => ({
        sourceIdentifier: evt.SourceIdentifier,
        sourceType: evt.SourceType,
        message: evt.Message,
        eventCategories: evt.EventCategories,
        date: evt.Date?.toISOString(),
        sourceArn: evt.SourceArn,
      }));

      logger.info(`Listed ${events.length} RDS events`);

      return {
        success: true,
        data: events,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: events.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing RDS events', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const rdsService = RDSService.getInstance();
