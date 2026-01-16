/**
 * Unified Account Info Handler
 * Handles AWS account information: identity, regions, quotas, contact
 */

import {
  STSClient,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';
import {
  EC2Client,
  DescribeRegionsCommand,
} from '@aws-sdk/client-ec2';
import {
  ServiceQuotasClient,
  ListServiceQuotasCommand,
  GetServiceQuotaCommand,
  GetAWSDefaultServiceQuotaCommand,
} from '@aws-sdk/client-service-quotas';
import {
  AccountClient,
  GetContactInformationCommand,
} from '@aws-sdk/client-account';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { profileService } from '../../services/profile.service';

interface AccountInfoArgs {
  infoType: string;
  serviceCode?: string;
  quotaCode?: string;
  region?: string;
  profile?: string;
}

export async function handleAccountInfo(args: AccountInfoArgs): Promise<CallToolResult> {
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

  // Route to appropriate operation
  switch (args.infoType) {
    case 'identity':
      return await getIdentity(region, credentials);
    
    case 'regions':
      return await listRegions(region, credentials);
    
    case 'quotas':
      return await listServiceQuotas(region, credentials, args);
    
    case 'quota-details':
      return await getQuotaDetails(region, credentials, args);
    
    case 'default-quotas':
      return await getDefaultQuota(region, credentials, args);
    
    case 'contact':
      return await getContactInfo(region, credentials);
    
    default:
      throw new Error(`Unsupported account info type: ${args.infoType}`);
  }
}

// ============================================================================
// Get Caller Identity
// ============================================================================

async function getIdentity(region: string, credentials: any): Promise<CallToolResult> {
  const client = new STSClient({ region, credentials });
  const response = await client.send(new GetCallerIdentityCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        infoType: 'identity',
        identity: {
          userId: response.UserId,
          account: response.Account,
          arn: response.Arn,
        },
      }, null, 2),
    }],
  };
}

// ============================================================================
// List AWS Regions
// ============================================================================

async function listRegions(region: string, credentials: any): Promise<CallToolResult> {
  const client = new EC2Client({ region, credentials });
  const response = await client.send(new DescribeRegionsCommand({
    AllRegions: true,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        infoType: 'regions',
        count: response.Regions?.length || 0,
        regions: response.Regions?.map(r => ({
          name: r.RegionName,
          endpoint: r.Endpoint,
          optInStatus: r.OptInStatus,
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// List Service Quotas
// ============================================================================

async function listServiceQuotas(
  region: string,
  credentials: any,
  args: AccountInfoArgs
): Promise<CallToolResult> {
  if (!args.serviceCode) {
    throw new Error('serviceCode is required for quotas info type');
  }

  const client = new ServiceQuotasClient({ region, credentials });
  const response = await client.send(new ListServiceQuotasCommand({
    ServiceCode: args.serviceCode,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        infoType: 'quotas',
        serviceCode: args.serviceCode,
        count: response.Quotas?.length || 0,
        quotas: response.Quotas?.map(quota => ({
          quotaName: quota.QuotaName,
          quotaCode: quota.QuotaCode,
          value: quota.Value,
          unit: quota.Unit,
          adjustable: quota.Adjustable,
          globalQuota: quota.GlobalQuota,
          usageMetric: quota.UsageMetric,
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Quota Details
// ============================================================================

async function getQuotaDetails(
  region: string,
  credentials: any,
  args: AccountInfoArgs
): Promise<CallToolResult> {
  if (!args.serviceCode) {
    throw new Error('serviceCode is required for quota-details info type');
  }

  if (!args.quotaCode) {
    throw new Error('quotaCode is required for quota-details info type');
  }

  const client = new ServiceQuotasClient({ region, credentials });
  const response = await client.send(new GetServiceQuotaCommand({
    ServiceCode: args.serviceCode,
    QuotaCode: args.quotaCode,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        infoType: 'quota-details',
        serviceCode: args.serviceCode,
        quotaCode: args.quotaCode,
        quota: {
          quotaName: response.Quota?.QuotaName,
          quotaArn: response.Quota?.QuotaArn,
          value: response.Quota?.Value,
          unit: response.Quota?.Unit,
          adjustable: response.Quota?.Adjustable,
          globalQuota: response.Quota?.GlobalQuota,
          usageMetric: response.Quota?.UsageMetric,
          period: response.Quota?.Period,
          errorReason: response.Quota?.ErrorReason,
        },
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Default Service Quota
// ============================================================================

async function getDefaultQuota(
  region: string,
  credentials: any,
  args: AccountInfoArgs
): Promise<CallToolResult> {
  if (!args.serviceCode) {
    throw new Error('serviceCode is required for default-quotas info type');
  }

  if (!args.quotaCode) {
    throw new Error('quotaCode is required for default-quotas info type');
  }

  const client = new ServiceQuotasClient({ region, credentials });
  const response = await client.send(new GetAWSDefaultServiceQuotaCommand({
    ServiceCode: args.serviceCode,
    QuotaCode: args.quotaCode,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        infoType: 'default-quotas',
        serviceCode: args.serviceCode,
        quotaCode: args.quotaCode,
        defaultQuota: {
          quotaName: response.Quota?.QuotaName,
          value: response.Quota?.Value,
          unit: response.Quota?.Unit,
          adjustable: response.Quota?.Adjustable,
          globalQuota: response.Quota?.GlobalQuota,
        },
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Contact Information
// ============================================================================

async function getContactInfo(region: string, credentials: any): Promise<CallToolResult> {
  const client = new AccountClient({ region, credentials });
  
  try {
    const response = await client.send(new GetContactInformationCommand({}));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          infoType: 'contact',
          contactInformation: response.ContactInformation,
        }, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          infoType: 'contact',
          error: error.message,
          note: 'Contact information access may require additional IAM permissions',
        }, null, 2),
      }],
      isError: true,
    };
  }
}
