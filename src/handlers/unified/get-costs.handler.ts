/**
 * Unified Get Costs Handler
 * Handles AWS Cost Explorer: cost-and-usage, forecast
 */

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
} from '@aws-sdk/client-cost-explorer';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials } from '../../utils';

interface GetCostsArgs {
  operation: string;
  startDate?: string;
  endDate?: string;
  granularity?: string;
  groupBy?: string[];
  metrics?: string[];
  filters?: Record<string, any>;
  profile?: string;
}

export async function handleGetCosts(args: GetCostsArgs): Promise<CallToolResult> {
  // Cost Explorer is a global service, use us-east-1
  const region = 'us-east-1';
  
  // Get credentials intelligently
  const credResult = await getIntelligentCredentials(args.profile, region);
  
  if (credResult.needsConfiguration) {
    return {
      content: [{ type: 'text', text: credResult.message || 'AWS credentials not configured.' }],
      isError: false,
    };
  }

  const credentials = credResult.credentials!;

  const client = new CostExplorerClient({ region, credentials });

  // Route to appropriate operation
  switch (args.operation) {
    case 'cost-and-usage':
      return await getCostAndUsage(client, args);
    
    case 'forecast':
      return await getCostForecast(client, args);
    
    default:
      throw new Error(`Unsupported costs operation: ${args.operation}`);
  }
}

// ============================================================================
// Get Cost and Usage
// ============================================================================

async function getCostAndUsage(
  client: CostExplorerClient,
  args: GetCostsArgs
): Promise<CallToolResult> {
  if (!args.startDate) {
    throw new Error('startDate is required for cost-and-usage operation (format: YYYY-MM-DD)');
  }

  if (!args.endDate) {
    throw new Error('endDate is required for cost-and-usage operation (format: YYYY-MM-DD)');
  }

  // Validate date format
  validateDateFormat(args.startDate);
  validateDateFormat(args.endDate);

  const params: any = {
    TimePeriod: {
      Start: args.startDate,
      End: args.endDate,
    },
    Granularity: args.granularity || 'DAILY',
    Metrics: args.metrics || ['UnblendedCost'],
  };

  // Group by dimensions
  if (args.groupBy && args.groupBy.length > 0) {
    params.GroupBy = args.groupBy.map(dimension => ({
      Type: 'DIMENSION',
      Key: dimension,
    }));
  }

  // Apply filters
  if (args.filters) {
    params.Filter = buildCostFilter(args.filters);
  }

  const response = await client.send(new GetCostAndUsageCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'cost-and-usage',
        timePeriod: {
          start: args.startDate,
          end: args.endDate,
        },
        granularity: params.Granularity,
        metrics: params.Metrics,
        groupBy: args.groupBy,
        resultsByTime: response.ResultsByTime?.map(result => ({
          timePeriod: result.TimePeriod,
          total: result.Total,
          groups: result.Groups?.map(group => ({
            keys: group.Keys,
            metrics: group.Metrics,
          })),
          estimated: result.Estimated,
        })),
        dimensionValueAttributes: response.DimensionValueAttributes,
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Cost Forecast
// ============================================================================

async function getCostForecast(
  client: CostExplorerClient,
  args: GetCostsArgs
): Promise<CallToolResult> {
  if (!args.endDate) {
    throw new Error('endDate is required for forecast operation (format: YYYY-MM-DD)');
  }

  // Validate date format
  validateDateFormat(args.endDate);

  // Start date defaults to today
  const startDate = args.startDate || new Date().toISOString().split('T')[0];
  validateDateFormat(startDate);

  const params: any = {
    TimePeriod: {
      Start: startDate,
      End: args.endDate,
    },
    Metric: args.metrics?.[0] || 'UNBLENDED_COST',
    Granularity: args.granularity || 'DAILY',
  };

  // Apply filters
  if (args.filters) {
    params.Filter = buildCostFilter(args.filters);
  }

  const response = await client.send(new GetCostForecastCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'forecast',
        timePeriod: {
          start: startDate,
          end: args.endDate,
        },
        metric: params.Metric,
        granularity: params.Granularity,
        total: response.Total,
        forecastResultsByTime: response.ForecastResultsByTime?.map(result => ({
          timePeriod: result.TimePeriod,
          meanValue: result.MeanValue,
          predictionIntervalLowerBound: result.PredictionIntervalLowerBound,
          predictionIntervalUpperBound: result.PredictionIntervalUpperBound,
        })),
      }, null, 2),
    }],
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function validateDateFormat(date: string): void {
  // Validate YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Use YYYY-MM-DD format.`);
  }

  // Validate it's a real date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
}

function buildCostFilter(filters: Record<string, any>): any {
  const filterExpressions: any[] = [];

  // Service filter
  if (filters.services && Array.isArray(filters.services)) {
    filterExpressions.push({
      Dimensions: {
        Key: 'SERVICE',
        Values: filters.services,
      },
    });
  }

  // Region filter
  if (filters.regions && Array.isArray(filters.regions)) {
    filterExpressions.push({
      Dimensions: {
        Key: 'REGION',
        Values: filters.regions,
      },
    });
  }

  // Linked account filter
  if (filters.linkedAccounts && Array.isArray(filters.linkedAccounts)) {
    filterExpressions.push({
      Dimensions: {
        Key: 'LINKED_ACCOUNT',
        Values: filters.linkedAccounts,
      },
    });
  }

  // Usage type filter
  if (filters.usageTypes && Array.isArray(filters.usageTypes)) {
    filterExpressions.push({
      Dimensions: {
        Key: 'USAGE_TYPE',
        Values: filters.usageTypes,
      },
    });
  }

  // Tag filters
  if (filters.tags && typeof filters.tags === 'object') {
    Object.entries(filters.tags).forEach(([key, value]) => {
      if (typeof value === 'string') {
        filterExpressions.push({
          Tags: {
            Key: key,
            Values: [value],
          },
        });
      } else if (Array.isArray(value)) {
        filterExpressions.push({
          Tags: {
            Key: key,
            Values: value,
          },
        });
      }
    });
  }

  // Combine filters with AND logic
  if (filterExpressions.length === 0) {
    return undefined;
  }

  if (filterExpressions.length === 1) {
    return filterExpressions[0];
  }

  return {
    And: filterExpressions,
  };
}
