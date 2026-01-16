/**
 * AWS Resource types and interfaces
 */

import { AWSRegion, AWSTag, PaginationParams } from './common';

/**
 * Generic AWS Resource interface
 */
export interface AWSResource {
  id: string;
  arn?: string;
  name?: string;
  type: string;
  region: AWSRegion;
  tags?: AWSTag[];
  status?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resource type enum
 */
export enum ResourceType {
  EC2_INSTANCE = 'ec2:instance',
  EC2_VOLUME = 'ec2:volume',
  EC2_SNAPSHOT = 'ec2:snapshot',
  EC2_AMI = 'ec2:ami',
  EC2_SECURITY_GROUP = 'ec2:security-group',
  S3_BUCKET = 's3:bucket',
  LAMBDA_FUNCTION = 'lambda:function',
  RDS_INSTANCE = 'rds:instance',
  RDS_CLUSTER = 'rds:cluster',
  DYNAMODB_TABLE = 'dynamodb:table',
  ECS_CLUSTER = 'ecs:cluster',
  ECS_SERVICE = 'ecs:service',
  ECS_TASK = 'ecs:task',
  EKS_CLUSTER = 'eks:cluster',
  VPC = 'vpc',
  SUBNET = 'vpc:subnet',
  IAM_USER = 'iam:user',
  IAM_ROLE = 'iam:role',
  IAM_POLICY = 'iam:policy',
}

/**
 * Resource search parameters
 */
export interface ResourceSearchParams extends PaginationParams {
  resourceType: ResourceType | string;
  region?: AWSRegion;
  tags?: Record<string, string>;
  filters?: Record<string, string[]>;
}

/**
 * EC2 Instance details
 */
export interface EC2Instance extends AWSResource {
  instanceId: string;
  instanceType: string;
  state: string;
  publicIpAddress?: string;
  privateIpAddress?: string;
  vpcId?: string;
  subnetId?: string;
  launchTime?: string;
  platform?: string;
}

/**
 * RDS Instance details
 */
export interface RDSInstance extends AWSResource {
  dbInstanceIdentifier: string;
  dbInstanceClass: string;
  engine: string;
  engineVersion: string;
  dbInstanceStatus: string;
  endpoint?: string;
  port?: number;
  allocatedStorage?: number;
  multiAZ?: boolean;
}

/**
 * DynamoDB Table details
 */
export interface DynamoDBTable extends AWSResource {
  tableName: string;
  tableStatus: string;
  itemCount?: number;
  tableSizeBytes?: number;
  billingMode?: string;
  readCapacity?: number;
  writeCapacity?: number;
}

/**
 * ECS Cluster details
 */
export interface ECSCluster extends AWSResource {
  clusterName: string;
  clusterArn: string;
  status: string;
  runningTasksCount?: number;
  pendingTasksCount?: number;
  activeServicesCount?: number;
  registeredContainerInstancesCount?: number;
}

/**
 * EKS Cluster details
 */
export interface EKSCluster extends AWSResource {
  clusterName: string;
  clusterArn: string;
  status: string;
  version?: string;
  endpoint?: string;
  platformVersion?: string;
}

/**
 * CloudWatch Log Group details
 */
export interface CloudWatchLogGroup {
  logGroupName: string;
  arn?: string;
  creationTime?: number;
  retentionInDays?: number;
  storedBytes?: number;
}

/**
 * CloudWatch Log Event
 */
export interface CloudWatchLogEvent {
  timestamp: number;
  message: string;
  ingestionTime?: number;
  eventId?: string;
}
