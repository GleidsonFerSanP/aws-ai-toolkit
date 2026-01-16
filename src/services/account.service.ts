/**
 * AWS Account Service
 * AWS Account information, regions, quotas, and costs
 */

import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import {
  ListServiceQuotasCommand,
  GetServiceQuotaCommand,
  ListAWSDefaultServiceQuotasCommand,
} from '@aws-sdk/client-service-quotas';
import {
  GetCostAndUsageCommand,
  GetCostForecastCommand,
} from '@aws-sdk/client-cost-explorer';
import { GetContactInformationCommand } from '@aws-sdk/client-account';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler } from '../utils';

export interface AccountIdentity {
  account: string;
  userId: string;
  arn: string;
}

export interface RegionInfo {
  regionName: string;
  endpoint?: string;
  optInStatus?: string;
}

export interface ServiceQuota {
  serviceCode?: string;
  serviceName?: string;
  quotaName?: string;
  quotaArn?: string;
  value?: number;
  unit?: string;
  adjustable?: boolean;
  globalQuota?: boolean;
  usageMetric?: any;
}

export interface CostAndUsage {
  timePeriod: {
    start: string;
    end: string;
  };
  total: Record<string, { amount: string; unit: string }>;
  groups?: any[];
}

export interface CostForecast {
  timePeriod: {
    start: string;
    end: string;
  };
  total: {
    amount: string;
    unit: string;
  };
  predictionIntervalLowerBound?: {
    amount: string;
    unit: string;
  };
  predictionIntervalUpperBound?: {
    amount: string;
    unit: string;
  };
}

/**
 * AWS Account Service
 * Manages AWS account information and metadata
 */
export class AWSAccountService {
  private static instance: AWSAccountService;

  // AWS Regions
  private readonly awsRegions: RegionInfo[] = [
    { regionName: 'us-east-1', endpoint: 'ec2.us-east-1.amazonaws.com' },
    { regionName: 'us-east-2', endpoint: 'ec2.us-east-2.amazonaws.com' },
    { regionName: 'us-west-1', endpoint: 'ec2.us-west-1.amazonaws.com' },
    { regionName: 'us-west-2', endpoint: 'ec2.us-west-2.amazonaws.com' },
    { regionName: 'af-south-1', endpoint: 'ec2.af-south-1.amazonaws.com' },
    { regionName: 'ap-east-1', endpoint: 'ec2.ap-east-1.amazonaws.com' },
    { regionName: 'ap-south-1', endpoint: 'ec2.ap-south-1.amazonaws.com' },
    { regionName: 'ap-northeast-1', endpoint: 'ec2.ap-northeast-1.amazonaws.com' },
    { regionName: 'ap-northeast-2', endpoint: 'ec2.ap-northeast-2.amazonaws.com' },
    { regionName: 'ap-northeast-3', endpoint: 'ec2.ap-northeast-3.amazonaws.com' },
    { regionName: 'ap-southeast-1', endpoint: 'ec2.ap-southeast-1.amazonaws.com' },
    { regionName: 'ap-southeast-2', endpoint: 'ec2.ap-southeast-2.amazonaws.com' },
    { regionName: 'ca-central-1', endpoint: 'ec2.ca-central-1.amazonaws.com' },
    { regionName: 'eu-central-1', endpoint: 'ec2.eu-central-1.amazonaws.com' },
    { regionName: 'eu-west-1', endpoint: 'ec2.eu-west-1.amazonaws.com' },
    { regionName: 'eu-west-2', endpoint: 'ec2.eu-west-2.amazonaws.com' },
    { regionName: 'eu-west-3', endpoint: 'ec2.eu-west-3.amazonaws.com' },
    { regionName: 'eu-south-1', endpoint: 'ec2.eu-south-1.amazonaws.com' },
    { regionName: 'eu-north-1', endpoint: 'ec2.eu-north-1.amazonaws.com' },
    { regionName: 'me-south-1', endpoint: 'ec2.me-south-1.amazonaws.com' },
    { regionName: 'sa-east-1', endpoint: 'ec2.sa-east-1.amazonaws.com' },
  ];

  private constructor() {
    logger.info('AWS Account Service initialized');
  }

  public static getInstance(): AWSAccountService {
    if (!AWSAccountService.instance) {
      AWSAccountService.instance = new AWSAccountService();
    }
    return AWSAccountService.instance;
  }

  /**
   * Get AWS account identity (account ID, user ID, ARN)
   */
  public async getAccountIdentity(
    profileName?: string
  ): Promise<BaseResponse<AccountIdentity>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const stsClient = awsClientFactory.getSTSClient('us-east-1', credentials);

      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);

      const identity: AccountIdentity = {
        account: response.Account || '',
        userId: response.UserId || '',
        arn: response.Arn || '',
      };

      logger.info(`Retrieved account identity: ${identity.account}`);

      return {
        success: true,
        data: identity,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting account identity', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List all AWS regions
   */
  public async listRegions(): Promise<BaseResponse<RegionInfo[]>> {
    try {
      logger.info(`Listing ${this.awsRegions.length} AWS regions`);

      return {
        success: true,
        data: this.awsRegions,
        metadata: {
          timestamp: new Date().toISOString(),
          count: this.awsRegions.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing regions', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get service quotas for a specific service
   */
  public async getServiceQuotas(
    serviceCode: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ServiceQuota[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getServiceQuotasClient(effectiveRegion, credentials);

      const command = new ListServiceQuotasCommand({
        ServiceCode: serviceCode,
      });

      const response = await client.send(command);

      const quotas: ServiceQuota[] = (response.Quotas || []).map((quota) => ({
        serviceCode: quota.ServiceCode,
        serviceName: quota.ServiceName,
        quotaName: quota.QuotaName,
        quotaArn: quota.QuotaArn,
        value: quota.Value,
        unit: quota.Unit,
        adjustable: quota.Adjustable,
        globalQuota: quota.GlobalQuota,
        usageMetric: quota.UsageMetric,
      }));

      logger.info(`Retrieved ${quotas.length} service quotas for ${serviceCode}`);

      return {
        success: true,
        data: quotas,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          serviceCode,
          count: quotas.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error getting service quotas', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get specific service quota
   */
  public async getServiceQuota(
    serviceCode: string,
    quotaCode: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ServiceQuota>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getServiceQuotasClient(effectiveRegion, credentials);

      const command = new GetServiceQuotaCommand({
        ServiceCode: serviceCode,
        QuotaCode: quotaCode,
      });

      const response = await client.send(command);

      if (!response.Quota) {
        throw new Error(`Quota ${quotaCode} not found for service ${serviceCode}`);
      }

      const quota: ServiceQuota = {
        serviceCode: response.Quota.ServiceCode,
        serviceName: response.Quota.ServiceName,
        quotaName: response.Quota.QuotaName,
        quotaArn: response.Quota.QuotaArn,
        value: response.Quota.Value,
        unit: response.Quota.Unit,
        adjustable: response.Quota.Adjustable,
        globalQuota: response.Quota.GlobalQuota,
        usageMetric: response.Quota.UsageMetric,
      };

      logger.info(`Retrieved service quota: ${quota.quotaName}`);

      return {
        success: true,
        data: quota,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
        },
      };
    } catch (error) {
      logger.error('Error getting service quota', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get AWS default service quotas
   */
  public async getDefaultServiceQuotas(
    serviceCode: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ServiceQuota[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getServiceQuotasClient(effectiveRegion, credentials);

      const command = new ListAWSDefaultServiceQuotasCommand({
        ServiceCode: serviceCode,
      });

      const response = await client.send(command);

      const quotas: ServiceQuota[] = (response.Quotas || []).map((quota) => ({
        serviceCode: quota.ServiceCode,
        serviceName: quota.ServiceName,
        quotaName: quota.QuotaName,
        quotaArn: quota.QuotaArn,
        value: quota.Value,
        unit: quota.Unit,
        adjustable: quota.Adjustable,
        globalQuota: quota.GlobalQuota,
      }));

      logger.info(`Retrieved ${quotas.length} default service quotas for ${serviceCode}`);

      return {
        success: true,
        data: quotas,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          serviceCode,
          count: quotas.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error getting default service quotas', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get cost and usage for a time period
   */
  public async getCostAndUsage(
    startDate: string,
    endDate: string,
    granularity: 'DAILY' | 'MONTHLY' | 'HOURLY' = 'DAILY',
    metrics: string[] = ['UnblendedCost'],
    groupBy?: Array<{ type: string; key: string }>,
    profileName?: string
  ): Promise<BaseResponse<CostAndUsage[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const client = awsClientFactory.getCostExplorerClient(credentials);

      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate,
          End: endDate,
        },
        Granularity: granularity,
        Metrics: metrics,
        GroupBy: groupBy as any,
      });

      const response = await client.send(command);

      const results: CostAndUsage[] = (response.ResultsByTime || []).map((result) => ({
        timePeriod: {
          start: result.TimePeriod?.Start || '',
          end: result.TimePeriod?.End || '',
        },
        total: result.Total as any || {},
        groups: result.Groups,
      }));

      logger.info(`Retrieved cost data for ${startDate} to ${endDate}`);

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          startDate,
          endDate,
          granularity,
          count: results.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error getting cost and usage', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get cost forecast
   */
  public async getCostForecast(
    startDate: string,
    endDate: string,
    metric: string = 'UNBLENDED_COST',
    granularity: 'DAILY' | 'MONTHLY' | 'HOURLY' = 'MONTHLY',
    profileName?: string
  ): Promise<BaseResponse<CostForecast>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const client = awsClientFactory.getCostExplorerClient(credentials);

      const command = new GetCostForecastCommand({
        TimePeriod: {
          Start: startDate,
          End: endDate,
        },
        Metric: metric as any,
        Granularity: granularity,
      });

      const response = await client.send(command);

      const forecast: CostForecast = {
        timePeriod: {
          start: startDate,
          end: endDate,
        },
        total: {
          amount: response.Total?.Amount || '0',
          unit: response.Total?.Unit || 'USD',
        },
        predictionIntervalLowerBound: response.ForecastResultsByTime?.[0]?.MeanValue
          ? {
              amount: response.ForecastResultsByTime[0].MeanValue,
              unit: 'USD',
            }
          : undefined,
        predictionIntervalUpperBound: response.ForecastResultsByTime?.[response.ForecastResultsByTime.length - 1]
          ?.MeanValue
          ? {
              amount:
                response.ForecastResultsByTime[response.ForecastResultsByTime.length - 1].MeanValue || '0',
              unit: 'USD',
            }
          : undefined,
      };

      logger.info(`Retrieved cost forecast for ${startDate} to ${endDate}`);

      return {
        success: true,
        data: forecast,
        metadata: {
          timestamp: new Date().toISOString(),
          startDate,
          endDate,
          metric,
        } as any,
      };
    } catch (error) {
      logger.error('Error getting cost forecast', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get account contact information
   */
  public async getContactInformation(
    profileName?: string
  ): Promise<BaseResponse<any>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      // Account API client needs to be added to factory
      const accountClient = awsClientFactory.getClient('account' as any, 'us-east-1', credentials);

      const command = new GetContactInformationCommand({});
      const response = await (accountClient as any).send(command);

      logger.info('Retrieved account contact information');

      return {
        success: true,
        data: response.ContactInformation,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting contact information', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const awsAccountService = AWSAccountService.getInstance();
