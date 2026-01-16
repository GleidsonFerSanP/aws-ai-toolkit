/**
 * Unified Search Resources Handler
 * Handles AWS resource discovery: by service, tag, ARN, summaries
 */

import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials, getRegion } from '../../utils';

interface SearchResourcesArgs {
  searchType: string;
  serviceName?: string;
  tagKey?: string;
  tagValue?: string;
  arn?: string;
  region?: string;
  profile?: string;
  filters?: Record<string, any>;
}

export async function handleSearchResources(args: SearchResourcesArgs): Promise<CallToolResult> {
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

  const client = new ResourceGroupsTaggingAPIClient({ region, credentials });

  // Route to appropriate search operation
  switch (args.searchType) {
    case 'by-service':
      return await searchByService(client, args);
    
    case 'by-tag':
      return await searchByTag(client, args);
    
    case 'by-arn':
      return await searchByArn(client, args);
    
    case 'all-resources':
      return await searchAllResources(client, args);
    
    case 'resource-summary':
      return await getResourceSummary(client, args);
    
    case 'tag-keys':
      return await listTagKeys(client);
    
    case 'tag-values':
      return await listTagValues(client, args);
    
    default:
      throw new Error(`Unsupported search type: ${args.searchType}`);
  }
}

// ============================================================================
// Search by Service
// ============================================================================

async function searchByService(
  client: ResourceGroupsTaggingAPIClient,
  args: SearchResourcesArgs
): Promise<CallToolResult> {
  if (!args.serviceName) {
    throw new Error('serviceName is required for by-service search');
  }

  const params: any = {
    ResourceTypeFilters: [args.serviceName],
  };

  const response = await client.send(new GetResourcesCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'by-service',
        serviceName: args.serviceName,
        count: response.ResourceTagMappingList?.length || 0,
        resources: response.ResourceTagMappingList?.map(resource => ({
          arn: resource.ResourceARN,
          tags: resource.Tags?.reduce((acc, tag) => ({
            ...acc,
            [tag.Key!]: tag.Value,
          }), {}),
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Search by Tag
// ============================================================================

async function searchByTag(
  client: ResourceGroupsTaggingAPIClient,
  args: SearchResourcesArgs
): Promise<CallToolResult> {
  if (!args.tagKey) {
    throw new Error('tagKey is required for by-tag search');
  }

  const tagFilters: any = [{
    Key: args.tagKey,
  }];

  if (args.tagValue) {
    tagFilters[0].Values = [args.tagValue];
  }

  const params: any = {
    TagFilters: tagFilters,
  };

  // Optional service filter
  if (args.serviceName) {
    params.ResourceTypeFilters = [args.serviceName];
  }

  const response = await client.send(new GetResourcesCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'by-tag',
        tagKey: args.tagKey,
        tagValue: args.tagValue,
        count: response.ResourceTagMappingList?.length || 0,
        resources: response.ResourceTagMappingList?.map(resource => ({
          arn: resource.ResourceARN,
          tags: resource.Tags?.reduce((acc, tag) => ({
            ...acc,
            [tag.Key!]: tag.Value,
          }), {}),
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Search by ARN
// ============================================================================

async function searchByArn(
  client: ResourceGroupsTaggingAPIClient,
  args: SearchResourcesArgs
): Promise<CallToolResult> {
  if (!args.arn) {
    throw new Error('arn is required for by-arn search');
  }

  const params = {
    ResourceARNList: [args.arn],
  };

  const response = await client.send(new GetResourcesCommand(params));

  const resource = response.ResourceTagMappingList?.[0];

  if (!resource) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          searchType: 'by-arn',
          arn: args.arn,
          found: false,
          message: 'Resource not found',
        }, null, 2),
      }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'by-arn',
        found: true,
        resource: {
          arn: resource.ResourceARN,
          tags: resource.Tags?.reduce((acc, tag) => ({
            ...acc,
            [tag.Key!]: tag.Value,
          }), {}),
        },
      }, null, 2),
    }],
  };
}

// ============================================================================
// Search All Resources
// ============================================================================

async function searchAllResources(
  client: ResourceGroupsTaggingAPIClient,
  args: SearchResourcesArgs
): Promise<CallToolResult> {
  const params: any = {};

  // Apply filters if provided
  if (args.filters?.resourceTypes && Array.isArray(args.filters.resourceTypes)) {
    params.ResourceTypeFilters = args.filters.resourceTypes;
  }

  if (args.filters?.tagFilters && Array.isArray(args.filters.tagFilters)) {
    params.TagFilters = args.filters.tagFilters;
  }

  const response = await client.send(new GetResourcesCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'all-resources',
        count: response.ResourceTagMappingList?.length || 0,
        resources: response.ResourceTagMappingList?.map(resource => ({
          arn: resource.ResourceARN,
          tags: resource.Tags?.reduce((acc, tag) => ({
            ...acc,
            [tag.Key!]: tag.Value,
          }), {}),
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Resource Summary (grouped by service)
// ============================================================================

async function getResourceSummary(
  client: ResourceGroupsTaggingAPIClient,
  _args: SearchResourcesArgs
): Promise<CallToolResult> {
  const response = await client.send(new GetResourcesCommand({}));

  // Group resources by service type
  const summary: Record<string, number> = {};
  
  response.ResourceTagMappingList?.forEach(resource => {
    // Extract service type from ARN (format: arn:aws:service:region:account:resource)
    const arnParts = resource.ResourceARN?.split(':');
    if (arnParts && arnParts.length >= 3) {
      const service = arnParts[2];
      summary[service] = (summary[service] || 0) + 1;
    }
  });

  const totalResources = response.ResourceTagMappingList?.length || 0;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'resource-summary',
        totalResources,
        byService: summary,
        services: Object.entries(summary)
          .map(([service, count]) => ({ service, count }))
          .sort((a, b) => b.count - a.count),
      }, null, 2),
    }],
  };
}

// ============================================================================
// List Tag Keys
// ============================================================================

async function listTagKeys(client: ResourceGroupsTaggingAPIClient): Promise<CallToolResult> {
  const response = await client.send(new GetTagKeysCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'tag-keys',
        count: response.TagKeys?.length || 0,
        tagKeys: response.TagKeys || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// List Tag Values
// ============================================================================

async function listTagValues(
  client: ResourceGroupsTaggingAPIClient,
  args: SearchResourcesArgs
): Promise<CallToolResult> {
  if (!args.tagKey) {
    throw new Error('tagKey is required for tag-values search');
  }

  const response = await client.send(new GetTagValuesCommand({
    Key: args.tagKey,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        searchType: 'tag-values',
        tagKey: args.tagKey,
        count: response.TagValues?.length || 0,
        tagValues: response.TagValues || [],
      }, null, 2),
    }],
  };
}
