/**
 * AWS Client Factory
 * Factory for creating and managing AWS SDK v3 clients
 */

import { STSClient } from '@aws-sdk/client-sts';
import { EC2Client } from '@aws-sdk/client-ec2';
import { RDSClient } from '@aws-sdk/client-rds';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ECSClient } from '@aws-sdk/client-ecs';
import { EKSClient } from '@aws-sdk/client-eks';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { IAMClient } from '@aws-sdk/client-iam';
import { ServiceQuotasClient } from '@aws-sdk/client-service-quotas';
import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';
import { ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';

import { AWSCredentials, AWSRegion } from '../models';
import { logger, config as configManager, ErrorHandler } from '../utils';

/**
 * AWS Client types
 */
export type AWSClientType =
  | 'sts'
  | 'ec2'
  | 'rds'
  | 'dynamodb'
  | 'ecs'
  | 'eks'
  | 'cloudwatch-logs'
  | 'cloudwatch'
  | 's3'
  | 'lambda'
  | 'iam'
  | 'service-quotas'
  | 'cost-explorer'
  | 'resource-groups-tagging-api';

/**
 * Generic AWS Client
 */
export type AWSClient =
  | STSClient
  | EC2Client
  | RDSClient
  | DynamoDBClient
  | ECSClient
  | EKSClient
  | CloudWatchLogsClient
  | CloudWatchClient
  | S3Client
  | LambdaClient
  | IAMClient
  | ServiceQuotasClient
  | CostExplorerClient
  | ResourceGroupsTaggingAPIClient;

/**
 * Client configuration options
 */
interface ClientConfig {
  region: AWSRegion;
  credentials?: AWSCredentials;
  maxAttempts?: number;
}

/**
 * AWS Client Factory
 * Manages creation and caching of AWS SDK v3 clients
 */
export class AWSClientFactory {
  private static instance: AWSClientFactory;
  private clientCache: Map<string, AWSClient>;

  private constructor() {
    this.clientCache = new Map();
    logger.info('AWS Client Factory initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AWSClientFactory {
    if (!AWSClientFactory.instance) {
      AWSClientFactory.instance = new AWSClientFactory();
    }
    return AWSClientFactory.instance;
  }

  /**
   * Generate cache key for client
   */
  private getCacheKey(clientType: AWSClientType, region: AWSRegion, profileName?: string): string {
    return `${clientType}:${region}:${profileName || 'default'}`;
  }

  /**
   * Get common client configuration
   */
  private getClientConfig(options: ClientConfig) {
    const retryConfig = configManager.getRetryConfig();

    return {
      region: options.region,
      credentials: options.credentials,
      maxAttempts: options.maxAttempts || retryConfig.maxRetries,
      requestHandler: {
        requestTimeout: 30000, // 30 seconds
      },
    };
  }

  /**
   * Create client based on type
   */
  private createClient<T extends AWSClient>(
    clientType: AWSClientType,
    config: ClientConfig
  ): T {
    const clientConfig = this.getClientConfig(config);

    logger.debug(`Creating ${clientType} client`, {
      region: config.region,
      maxAttempts: clientConfig.maxAttempts,
    });

    switch (clientType) {
      case 'sts':
        return new STSClient(clientConfig) as T;
      case 'ec2':
        return new EC2Client(clientConfig) as T;
      case 'rds':
        return new RDSClient(clientConfig) as T;
      case 'dynamodb':
        return new DynamoDBClient(clientConfig) as T;
      case 'ecs':
        return new ECSClient(clientConfig) as T;
      case 'eks':
        return new EKSClient(clientConfig) as T;
      case 'cloudwatch-logs':
        return new CloudWatchLogsClient(clientConfig) as T;
      case 'cloudwatch':
        return new CloudWatchClient(clientConfig) as T;
      case 's3':
        return new S3Client(clientConfig) as T;
      case 'lambda':
        return new LambdaClient(clientConfig) as T;
      case 'iam':
        return new IAMClient({ ...clientConfig, region: 'us-east-1' }) as T; // IAM is global
      case 'service-quotas':
        return new ServiceQuotasClient(clientConfig) as T;
      case 'cost-explorer':
        return new CostExplorerClient({ ...clientConfig, region: 'us-east-1' }) as T; // Cost Explorer is global
      case 'resource-groups-tagging-api':
        return new ResourceGroupsTaggingAPIClient(clientConfig) as T;
      default:
        throw ErrorHandler.handleValidationError('clientType', `Unknown client type: ${clientType}`);
    }
  }

  /**
   * Get or create client
   */
  public getClient<T extends AWSClient>(
    clientType: AWSClientType,
    region?: AWSRegion,
    credentials?: AWSCredentials,
    profileName?: string
  ): T {
    const appConfig = configManager.getConfig();
    const effectiveRegion = region || appConfig.defaultRegion;
    const cacheKey = this.getCacheKey(clientType, effectiveRegion, profileName);

    // Check in-memory cache first
    if (this.clientCache.has(cacheKey)) {
      logger.debug(`Using cached ${clientType} client`, { region: effectiveRegion });
      return this.clientCache.get(cacheKey) as T;
    }

    // Create new client
    const client = this.createClient<T>(clientType, {
      region: effectiveRegion,
      credentials,
    });

    // Cache the client
    this.clientCache.set(cacheKey, client);

    return client;
  }

  /**
   * Get STS client
   */
  public getSTSClient(region?: AWSRegion, credentials?: AWSCredentials): STSClient {
    return this.getClient<STSClient>('sts', region, credentials);
  }

  /**
   * Get EC2 client
   */
  public getEC2Client(region?: AWSRegion, credentials?: AWSCredentials): EC2Client {
    return this.getClient<EC2Client>('ec2', region, credentials);
  }

  /**
   * Get RDS client
   */
  public getRDSClient(region?: AWSRegion, credentials?: AWSCredentials): RDSClient {
    return this.getClient<RDSClient>('rds', region, credentials);
  }

  /**
   * Get DynamoDB client
   */
  public getDynamoDBClient(region?: AWSRegion, credentials?: AWSCredentials): DynamoDBClient {
    return this.getClient<DynamoDBClient>('dynamodb', region, credentials);
  }

  /**
   * Get ECS client
   */
  public getECSClient(region?: AWSRegion, credentials?: AWSCredentials): ECSClient {
    return this.getClient<ECSClient>('ecs', region, credentials);
  }

  /**
   * Get EKS client
   */
  public getEKSClient(region?: AWSRegion, credentials?: AWSCredentials): EKSClient {
    return this.getClient<EKSClient>('eks', region, credentials);
  }

  /**
   * Get CloudWatch Logs client
   */
  public getCloudWatchLogsClient(
    region?: AWSRegion,
    credentials?: AWSCredentials
  ): CloudWatchLogsClient {
    return this.getClient<CloudWatchLogsClient>('cloudwatch-logs', region, credentials);
  }

  /**
   * Get CloudWatch client
   */
  public getCloudWatchClient(region?: AWSRegion, credentials?: AWSCredentials): CloudWatchClient {
    return this.getClient<CloudWatchClient>('cloudwatch', region, credentials);
  }

  /**
   * Get S3 client
   */
  public getS3Client(region?: AWSRegion, credentials?: AWSCredentials): S3Client {
    return this.getClient<S3Client>('s3', region, credentials);
  }

  /**
   * Get Lambda client
   */
  public getLambdaClient(region?: AWSRegion, credentials?: AWSCredentials): LambdaClient {
    return this.getClient<LambdaClient>('lambda', region, credentials);
  }

  /**
   * Get IAM client
   */
  public getIAMClient(credentials?: AWSCredentials): IAMClient {
    return this.getClient<IAMClient>('iam', 'us-east-1', credentials);
  }

  /**
   * Get Service Quotas client
   */
  public getServiceQuotasClient(
    region?: AWSRegion,
    credentials?: AWSCredentials
  ): ServiceQuotasClient {
    return this.getClient<ServiceQuotasClient>('service-quotas', region, credentials);
  }

  /**
   * Get Cost Explorer client
   */
  public getCostExplorerClient(credentials?: AWSCredentials): CostExplorerClient {
    return this.getClient<CostExplorerClient>('cost-explorer', 'us-east-1', credentials);
  }

  /**
   * Get Resource Groups Tagging API client
   */
  public getResourceGroupsTaggingAPIClient(
    region: AWSRegion = 'us-east-1',
    credentials?: AWSCredentials
  ): ResourceGroupsTaggingAPIClient {
    return this.getClient<ResourceGroupsTaggingAPIClient>('resource-groups-tagging-api', region, credentials);
  }

  /**
   * Clear client cache
   */
  public clearCache(clientType?: AWSClientType, region?: AWSRegion): void {
    if (clientType && region) {
      const cacheKey = this.getCacheKey(clientType, region);
      this.clientCache.delete(cacheKey);
      logger.debug(`Cleared cache for ${clientType} client in ${region}`);
    } else {
      this.clientCache.clear();
      logger.info('Cleared all AWS client cache');
    }
  }

  /**
   * Destroy all clients (cleanup)
   */
  public async destroy(): Promise<void> {
    for (const [key, client] of this.clientCache.entries()) {
      try {
        if (client && 'destroy' in client && typeof client.destroy === 'function') {
          await client.destroy();
        }
      } catch (error) {
        logger.error(`Error destroying client ${key}`, error as Error);
      }
    }
    this.clientCache.clear();
    logger.info('AWS Client Factory destroyed');
  }
}

// Export singleton instance
export const awsClientFactory = AWSClientFactory.getInstance();
