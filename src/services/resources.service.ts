/**
 * AWS Resources Service
 * Universal AWS resource reader using Resource Groups Tagging API
 */

import {
  GetResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api';

import { BaseResponse, AWSRegion } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { profileService } from './profile.service';
import { logger, ErrorHandler, cache } from '../utils';

export interface AWSResource {
  resourceARN: string;
  tags?: Array<{ key?: string; value?: string }>;
  resourceType?: string;
  region?: string;
  service?: string;
}

export interface ResourceSummary {
  totalCount: number;
  byService: Record<string, number>;
  byRegion: Record<string, number>;
  byResourceType: Record<string, number>;
}

/**
 * AWS Resources Service
 * Universal resource reader across all AWS services
 */
export class AWSResourcesService {
  private static instance: AWSResourcesService;

  private constructor() {
    logger.info('AWS Resources Service initialized');
  }

  public static getInstance(): AWSResourcesService {
    if (!AWSResourcesService.instance) {
      AWSResourcesService.instance = new AWSResourcesService();
    }
    return AWSResourcesService.instance;
  }

  /**
   * Parse ARN to extract service and region
   */
  private parseARN(arn: string): { service?: string; region?: string; resourceType?: string } {
    try {
      // ARN format: arn:partition:service:region:account-id:resource-type/resource-id
      const parts = arn.split(':');
      if (parts.length < 6) {
        return {};
      }

      const service = parts[2];
      const region = parts[3] || 'global';
      const resourcePart = parts.slice(5).join(':');
      const resourceType = resourcePart.split('/')[0] || resourcePart.split(':')[0];

      return { service, region, resourceType };
    } catch (error) {
      logger.warn(`Failed to parse ARN: ${arn}`);
      return {};
    }
  }

  /**
   * List all AWS resources (with optional filters)
   */
  public async listResources(
    resourceTypeFilters?: string[],
    tagFilters?: Array<{ key: string; values?: string[] }>,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<AWSResource[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const cacheKey = cache.generateKey(
        'resources',
        'list',
        effectiveRegion,
        JSON.stringify(resourceTypeFilters || []),
        JSON.stringify(tagFilters || [])
      );
      const cached = cache.get<AWSResource[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached resources');
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

      const client = awsClientFactory.getResourceGroupsTaggingAPIClient(effectiveRegion, credentials);

      const command = new GetResourcesCommand({
        ResourceTypeFilters: resourceTypeFilters,
        TagFilters: tagFilters as any,
        ResourcesPerPage: 100,
      });

      const response = await client.send(command);

      const resources: AWSResource[] = (response.ResourceTagMappingList || []).map((resource) => {
        const arn = resource.ResourceARN || '';
        const parsed = this.parseARN(arn);

        return {
          resourceARN: arn,
          tags: resource.Tags?.map((t) => ({ key: t.Key, value: t.Value })),
          resourceType: parsed.resourceType,
          region: parsed.region,
          service: parsed.service,
        };
      });

      cache.set(cacheKey, resources, 180); // Cache for 3 minutes

      logger.info(`Listed ${resources.length} AWS resources in ${effectiveRegion}`);

      return {
        success: true,
        data: resources,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: resources.length,
          paginationToken: response.PaginationToken,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing AWS resources', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get resources by service (e.g., ec2, rds, s3)
   */
  public async getResourcesByService(
    serviceName: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<AWSResource[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getResourceGroupsTaggingAPIClient(effectiveRegion, credentials);

      const command = new GetResourcesCommand({
        ResourcesPerPage: 100,
      });

      const response = await client.send(command);

      const resources: AWSResource[] = (response.ResourceTagMappingList || [])
        .map((resource) => {
          const arn = resource.ResourceARN || '';
          const parsed = this.parseARN(arn);

          return {
            resourceARN: arn,
            tags: resource.Tags?.map((t) => ({ key: t.Key, value: t.Value })),
            resourceType: parsed.resourceType,
            region: parsed.region,
            service: parsed.service,
          };
        })
        .filter((resource) => resource.service === serviceName);

      logger.info(`Found ${resources.length} resources for service ${serviceName}`);

      return {
        success: true,
        data: resources,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          service: serviceName,
          count: resources.length,
        } as any,
      };
    } catch (error) {
      logger.error(`Error getting resources for service ${serviceName}`, error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get resources by tag
   */
  public async getResourcesByTag(
    tagKey: string,
    tagValues?: string[],
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<AWSResource[]>> {
    try {
      const tagFilters = [
        {
          key: tagKey,
          values: tagValues,
        },
      ];

      return await this.listResources(undefined, tagFilters, region, profileName);
    } catch (error) {
      logger.error('Error getting resources by tag', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get resource summary
   */
  public async getResourceSummary(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<ResourceSummary>> {
    try {
      const resourcesResponse = await this.listResources(undefined, undefined, region, profileName);

      if (!resourcesResponse.success || !resourcesResponse.data) {
        return {
          success: false,
          error: resourcesResponse.error || ErrorHandler.toErrorDetails(new Error('Failed to list resources')),
        };
      }

      const resources = resourcesResponse.data;

      const byService: Record<string, number> = {};
      const byRegion: Record<string, number> = {};
      const byResourceType: Record<string, number> = {};

      for (const resource of resources) {
        if (resource.service) {
          byService[resource.service] = (byService[resource.service] || 0) + 1;
        }
        if (resource.region) {
          byRegion[resource.region] = (byRegion[resource.region] || 0) + 1;
        }
        if (resource.resourceType) {
          byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + 1;
        }
      }

      const summary: ResourceSummary = {
        totalCount: resources.length,
        byService,
        byRegion,
        byResourceType,
      };

      logger.info(`Generated resource summary: ${summary.totalCount} total resources`);

      return {
        success: true,
        data: summary,
        metadata: {
          timestamp: new Date().toISOString(),
          region: region || 'all',
        },
      };
    } catch (error) {
      logger.error('Error generating resource summary', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List all tag keys used across resources
   */
  public async listTagKeys(
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getResourceGroupsTaggingAPIClient(effectiveRegion, credentials);

      const command = new GetTagKeysCommand({});

      const response = await client.send(command);

      const tagKeys = response.TagKeys || [];

      logger.info(`Listed ${tagKeys.length} tag keys`);

      return {
        success: true,
        data: tagKeys,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          count: tagKeys.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing tag keys', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List all tag values for a specific key
   */
  public async listTagValues(
    tagKey: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<string[]>> {
    try {
      const credentials = profileService.getCredentials(profileName);
      const effectiveRegion = region || (await profileService.getActiveProfile()).data?.region || 'us-east-1';

      const client = awsClientFactory.getResourceGroupsTaggingAPIClient(effectiveRegion, credentials);

      const command = new GetTagValuesCommand({
        Key: tagKey,
      });

      const response = await client.send(command);

      const tagValues = response.TagValues || [];

      logger.info(`Listed ${tagValues.length} values for tag key ${tagKey}`);

      return {
        success: true,
        data: tagValues,
        metadata: {
          timestamp: new Date().toISOString(),
          region: effectiveRegion,
          tagKey,
          count: tagValues.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error listing tag values', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Search resources by ARN pattern
   */
  public async searchResourcesByARN(
    arnPattern: string,
    region?: AWSRegion,
    profileName?: string
  ): Promise<BaseResponse<AWSResource[]>> {
    try {
      const resourcesResponse = await this.listResources(undefined, undefined, region, profileName);

      if (!resourcesResponse.success || !resourcesResponse.data) {
        return {
          success: false,
          error: resourcesResponse.error || ErrorHandler.toErrorDetails(new Error('Failed to list resources')),
        };
      }

      const pattern = new RegExp(arnPattern, 'i');
      const matchedResources = resourcesResponse.data.filter((resource) =>
        pattern.test(resource.resourceARN)
      );

      logger.info(`Found ${matchedResources.length} resources matching ARN pattern: ${arnPattern}`);

      return {
        success: true,
        data: matchedResources,
        metadata: {
          timestamp: new Date().toISOString(),
          region: region || 'all',
          pattern: arnPattern,
          count: matchedResources.length,
        } as any,
      };
    } catch (error) {
      logger.error('Error searching resources by ARN', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }
}

export const awsResourcesService = AWSResourcesService.getInstance();
