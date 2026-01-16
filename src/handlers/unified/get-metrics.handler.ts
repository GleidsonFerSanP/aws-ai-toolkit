/**
 * Unified Get Metrics Handler
 * Handles CloudWatch metrics retrieval for any AWS resource
 */

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getIntelligentCredentials, getRegion } from '../../utils';

interface GetMetricsArgs {
  namespace: string;
  metricName: string;
  dimensions?: Record<string, string>;
  statistics?: string[];
  period?: number;
  startTime?: string;
  endTime?: string;
  region?: string;
  profile?: string;
}

export async function handleGetMetrics(args: GetMetricsArgs): Promise<CallToolResult> {
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

  const client = new CloudWatchClient({ region, credentials });

  // If no metricName specified, list available metrics for namespace
  if (!args.metricName) {
    return await listMetrics(client, args.namespace, args.dimensions);
  }

  // Get metric statistics
  return await getMetricStatistics(client, args);
}

// ============================================================================
// List Metrics
// ============================================================================

async function listMetrics(
  client: CloudWatchClient,
  namespace: string,
  dimensions?: Record<string, string>
): Promise<CallToolResult> {
  const params: any = {
    Namespace: namespace,
  };

  // Convert dimensions object to AWS format
  if (dimensions && Object.keys(dimensions).length > 0) {
    params.Dimensions = Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: value,
    }));
  }

  const response = await client.send(new ListMetricsCommand(params));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'list-metrics',
        namespace,
        count: response.Metrics?.length || 0,
        metrics: response.Metrics?.map(metric => ({
          metricName: metric.MetricName,
          namespace: metric.Namespace,
          dimensions: metric.Dimensions?.reduce((acc, dim) => ({
            ...acc,
            [dim.Name!]: dim.Value,
          }), {}),
        })) || [],
      }, null, 2),
    }],
  };
}

// ============================================================================
// Get Metric Statistics
// ============================================================================

async function getMetricStatistics(
  client: CloudWatchClient,
  args: GetMetricsArgs
): Promise<CallToolResult> {
  // Default time range: last hour
  const endTime = args.endTime ? parseTimestamp(args.endTime) : new Date();
  const startTime = args.startTime 
    ? parseTimestamp(args.startTime) 
    : new Date(endTime.getTime() - (60 * 60 * 1000)); // 1 hour ago

  // Default statistics
  const statistics = args.statistics && args.statistics.length > 0
    ? args.statistics
    : ['Average'];

  // Default period: 5 minutes
  const period = args.period || 300;

  const params: any = {
    Namespace: args.namespace,
    MetricName: args.metricName,
    StartTime: startTime,
    EndTime: endTime,
    Period: period,
    Statistics: statistics,
  };

  // Convert dimensions object to AWS format
  if (args.dimensions && Object.keys(args.dimensions).length > 0) {
    params.Dimensions = Object.entries(args.dimensions).map(([name, value]) => ({
      Name: name,
      Value: value,
    }));
  }

  const response = await client.send(new GetMetricStatisticsCommand(params));

  // Sort datapoints by timestamp
  const datapoints = response.Datapoints?.sort((a, b) => 
    (a.Timestamp?.getTime() || 0) - (b.Timestamp?.getTime() || 0)
  ) || [];

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        operation: 'get-metric-statistics',
        namespace: args.namespace,
        metricName: args.metricName,
        dimensions: args.dimensions,
        statistics,
        period,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        datapoints: datapoints.map(dp => ({
          timestamp: dp.Timestamp?.toISOString(),
          average: dp.Average,
          sum: dp.Sum,
          maximum: dp.Maximum,
          minimum: dp.Minimum,
          sampleCount: dp.SampleCount,
          unit: dp.Unit,
        })),
        label: response.Label,
      }, null, 2),
    }],
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseTimestamp(timestamp: string): Date {
  // Check if it's already epoch milliseconds (numeric string)
  if (/^\d+$/.test(timestamp)) {
    return new Date(parseInt(timestamp, 10));
  }

  // Parse as ISO 8601 date
  const parsed = new Date(timestamp);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp format: ${timestamp}. Use ISO 8601 or epoch milliseconds.`);
  }

  return parsed;
}
