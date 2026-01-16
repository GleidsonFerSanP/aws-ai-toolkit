/**
 * Unified AWS MCP Tools
 * 12 generic tools replacing 73 specific tools for better performance
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * 1. Profile Management - Unified
 */
export const profileManagementTool: Tool = {
  name: 'aws-manage-profiles',
  description: 'Manage AWS profiles: create, update, delete, list, get, set active, or validate profiles',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'update', 'delete', 'list', 'get', 'set-active', 'get-active', 'validate'],
        description: 'Profile operation to perform',
      },
      profileName: {
        type: 'string',
        description: 'Profile name (required for all operations except list and get-active)',
      },
      accessKeyId: {
        type: 'string',
        description: 'AWS Access Key ID (required for create)',
      },
      secretAccessKey: {
        type: 'string',
        description: 'AWS Secret Access Key (required for create)',
      },
      region: {
        type: 'string',
        description: 'Default AWS region (required for create)',
      },
      sessionToken: {
        type: 'string',
        description: 'Optional session token for temporary credentials',
      },
      environment: {
        type: 'string',
        enum: ['dev', 'staging', 'production', 'test'],
        description: 'Environment type (required for create)',
      },
      description: {
        type: 'string',
        description: 'Profile description (optional)',
      },
    },
    required: ['operation'],
  },
};

/**
 * 2. List Resources - Unified
 */
export const listResourcesTool: Tool = {
  name: 'aws-list-resources',
  description: 'List any AWS resources: EC2 instances, RDS databases, DynamoDB tables, ECS clusters, Lambda functions, S3 buckets, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      resourceType: {
        type: 'string',
        enum: [
          'ec2-instances', 'ec2-key-pairs', 'ec2-security-groups',
          'rds-instances', 'rds-clusters', 'rds-snapshots', 'rds-cluster-snapshots',
          'dynamodb-tables', 'dynamodb-backups', 'dynamodb-global-tables',
          'ecs-clusters', 'ecs-services', 'ecs-tasks', 'ecs-task-definitions',
          'eks-clusters', 'eks-nodegroups', 'eks-addons',
          's3-buckets', 'lambda-functions',
          'log-groups', 'log-streams',
          'secrets', 'parameters',
        ],
        description: 'Type of AWS resource to list',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional, uses profile default if not specified)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional, uses active profile if not specified)',
      },
      filters: {
        type: 'object',
        description: 'Resource-specific filters (e.g., status, tags, prefix)',
        additionalProperties: true,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (optional)',
      },
    },
    required: ['resourceType'],
  },
};

/**
 * 3. Describe Resource - Unified
 */
export const describeResourceTool: Tool = {
  name: 'aws-describe-resource',
  description: 'Get detailed information about a specific AWS resource by ID, name, or ARN',
  inputSchema: {
    type: 'object',
    properties: {
      resourceType: {
        type: 'string',
        enum: [
          'ec2-instance', 'rds-instance', 'rds-cluster', 'dynamodb-table',
          'ecs-cluster', 'ecs-service', 'ecs-task', 'ecs-task-definition',
          'eks-cluster', 'eks-nodegroup', 'eks-addon',
          'dynamodb-backup', 'dynamodb-ttl', 'rds-snapshot',
          's3-bucket', 'lambda-function',
        ],
        description: 'Type of AWS resource to describe',
      },
      resourceId: {
        type: 'string',
        description: 'Resource identifier (instance-id, table-name, cluster-arn, etc.)',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
      additionalParams: {
        type: 'object',
        description: 'Additional resource-specific parameters',
        additionalProperties: true,
      },
    },
    required: ['resourceType', 'resourceId'],
  },
};

/**
 * 4. Execute Action - Unified
 */
export const executeActionTool: Tool = {
  name: 'aws-execute-action',
  description: 'Execute actions on AWS resources: start, stop, reboot, terminate, create, delete, update',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start', 'stop', 'reboot', 'terminate', 'create', 'delete', 'update', 'restart'],
        description: 'Action to perform',
      },
      resourceType: {
        type: 'string',
        enum: [
          'ec2-instances', 'rds-instances', 'ecs-services', 'ecs-tasks',
          'eks-nodegroups', 'lambda-functions', 'dynamodb-tables',
        ],
        description: 'Type of AWS resource',
      },
      resourceIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of resource identifiers to act upon',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
      actionParams: {
        type: 'object',
        description: 'Additional parameters for create/update actions',
        additionalProperties: true,
      },
    },
    required: ['action', 'resourceType', 'resourceIds'],
  },
};

/**
 * 5. Query Database - Unified
 */
export const queryDatabaseTool: Tool = {
  name: 'aws-query-database',
  description: 'Query databases: DynamoDB (query/scan), RDS (execute SQL), batch operations',
  inputSchema: {
    type: 'object',
    properties: {
      databaseType: {
        type: 'string',
        enum: ['dynamodb', 'rds'],
        description: 'Database service type',
      },
      operation: {
        type: 'string',
        enum: ['query', 'scan', 'get-item', 'batch-get', 'execute-sql'],
        description: 'Database operation to perform',
      },
      tableName: {
        type: 'string',
        description: 'Table name (for DynamoDB)',
      },
      databaseName: {
        type: 'string',
        description: 'Database name (for RDS)',
      },
      queryParams: {
        type: 'object',
        description: 'Query parameters: conditions, filters, projections, SQL statement',
        additionalProperties: true,
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['databaseType', 'operation'],
  },
};

/**
 * 6. Logs Operations - Unified
 */
export const logsOperationsTool: Tool = {
  name: 'aws-logs-operations',
  description: 'CloudWatch Logs operations: list groups/streams, get events, tail logs, filter, run Insights queries',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: [
          'list-groups', 'list-streams', 'get-events', 'tail',
          'filter', 'insights-query', 'insights-results',
        ],
        description: 'CloudWatch Logs operation',
      },
      logGroup: {
        type: 'string',
        description: 'Log group name (required for most operations)',
      },
      logStream: {
        type: 'string',
        description: 'Log stream name (required for get-events)',
      },
      query: {
        type: 'string',
        description: 'Filter pattern or Insights query',
      },
      queryId: {
        type: 'string',
        description: 'Query ID (for insights-results)',
      },
      startTime: {
        type: 'string',
        description: 'Start time (ISO 8601 or epoch ms)',
      },
      endTime: {
        type: 'string',
        description: 'End time (ISO 8601 or epoch ms)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['operation'],
  },
};

/**
 * 7. Get Metrics - Unified
 */
export const getMetricsTool: Tool = {
  name: 'aws-get-metrics',
  description: 'Get CloudWatch metrics for any AWS resource: CPU, memory, network, custom metrics',
  inputSchema: {
    type: 'object',
    properties: {
      namespace: {
        type: 'string',
        description: 'Metric namespace (e.g., AWS/EC2, AWS/RDS, AWS/Lambda, AWS/DynamoDB)',
      },
      metricName: {
        type: 'string',
        description: 'Metric name (e.g., CPUUtilization, NetworkIn, FreeableMemory)',
      },
      dimensions: {
        type: 'object',
        description: 'Metric dimensions (e.g., {InstanceId: "i-1234", TableName: "users"})',
        additionalProperties: { type: 'string' },
      },
      statistics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['Average', 'Sum', 'Maximum', 'Minimum', 'SampleCount'],
        },
        description: 'Statistics to retrieve',
      },
      period: {
        type: 'number',
        description: 'Period in seconds (60, 300, 3600, etc.)',
      },
      startTime: {
        type: 'string',
        description: 'Start time (ISO 8601)',
      },
      endTime: {
        type: 'string',
        description: 'End time (ISO 8601)',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['namespace', 'metricName'],
  },
};

/**
 * 8. Search Resources - Unified
 */
export const searchResourcesTool: Tool = {
  name: 'aws-search-resources',
  description: 'Search and discover AWS resources by service, tags, ARN, or get resource summaries',
  inputSchema: {
    type: 'object',
    properties: {
      searchType: {
        type: 'string',
        enum: [
          'by-service', 'by-tag', 'by-arn',
          'all-resources', 'resource-summary',
          'tag-keys', 'tag-values',
        ],
        description: 'Type of search to perform',
      },
      serviceName: {
        type: 'string',
        description: 'AWS service name (for by-service search)',
      },
      tagKey: {
        type: 'string',
        description: 'Tag key (for by-tag or tag-values search)',
      },
      tagValue: {
        type: 'string',
        description: 'Tag value (for by-tag search)',
      },
      arn: {
        type: 'string',
        description: 'Resource ARN (for by-arn search)',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
      filters: {
        type: 'object',
        description: 'Additional search filters',
        additionalProperties: true,
      },
    },
    required: ['searchType'],
  },
};

/**
 * 9. Get Costs - Unified
 */
export const getCostsTool: Tool = {
  name: 'aws-get-costs',
  description: 'Get AWS cost and usage data, or forecast future costs',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['cost-and-usage', 'forecast'],
        description: 'Cost operation to perform',
      },
      startDate: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD) - required for cost-and-usage',
      },
      endDate: {
        type: 'string',
        description: 'End date (YYYY-MM-DD) - required for cost-and-usage and forecast',
      },
      granularity: {
        type: 'string',
        enum: ['DAILY', 'MONTHLY', 'HOURLY'],
        description: 'Time granularity (default: DAILY)',
      },
      groupBy: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['SERVICE', 'REGION', 'LINKED_ACCOUNT', 'USAGE_TYPE'],
        },
        description: 'Group results by dimension',
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['UnblendedCost', 'BlendedCost', 'UsageQuantity'],
        },
        description: 'Metrics to retrieve',
      },
      filters: {
        type: 'object',
        description: 'Cost filters (services, regions, etc.)',
        additionalProperties: true,
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['operation'],
  },
};

/**
 * 10. Account Info - Unified
 */
export const accountInfoTool: Tool = {
  name: 'aws-account-info',
  description: 'Get AWS account information: identity, regions, service quotas, contact info',
  inputSchema: {
    type: 'object',
    properties: {
      infoType: {
        type: 'string',
        enum: ['identity', 'regions', 'quotas', 'quota-details', 'default-quotas', 'contact'],
        description: 'Type of account information to retrieve',
      },
      serviceCode: {
        type: 'string',
        description: 'AWS service code (required for quotas)',
      },
      quotaCode: {
        type: 'string',
        description: 'Specific quota code (for quota-details)',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['infoType'],
  },
};

/**
 * 11. Manage Secrets - Unified
 */
export const manageSecretsTool: Tool = {
  name: 'aws-manage-secrets',
  description: 'Manage secrets and parameters: AWS Secrets Manager and Systems Manager Parameter Store',
  inputSchema: {
    type: 'object',
    properties: {
      service: {
        type: 'string',
        enum: ['secrets-manager', 'parameter-store'],
        description: 'Service to use',
      },
      operation: {
        type: 'string',
        enum: ['get', 'list', 'create', 'update', 'delete', 'get-by-path'],
        description: 'Operation to perform',
      },
      secretId: {
        type: 'string',
        description: 'Secret ID/name (for Secrets Manager)',
      },
      parameterName: {
        type: 'string',
        description: 'Parameter name/path (for Parameter Store)',
      },
      secretValue: {
        type: 'string',
        description: 'Secret/parameter value (for create/update)',
      },
      parameterType: {
        type: 'string',
        enum: ['String', 'StringList', 'SecureString'],
        description: 'Parameter type (for Parameter Store)',
      },
      withDecryption: {
        type: 'boolean',
        description: 'Decrypt SecureString parameters (default: true)',
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['service', 'operation'],
  },
};

/**
 * 12. Container Operations - Unified
 */
export const containerOperationsTool: Tool = {
  name: 'aws-container-operations',
  description: 'Manage containers: ECS (clusters, services, tasks) and EKS (clusters, nodegroups, addons)',
  inputSchema: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        enum: ['ecs', 'eks'],
        description: 'Container platform',
      },
      resourceType: {
        type: 'string',
        enum: [
          'clusters', 'services', 'tasks', 'task-definitions',
          'nodegroups', 'addons',
        ],
        description: 'Resource type to operate on',
      },
      operation: {
        type: 'string',
        enum: ['list', 'describe', 'create', 'update', 'delete', 'restart', 'scale'],
        description: 'Operation to perform',
      },
      clusterName: {
        type: 'string',
        description: 'Cluster name (required for most operations)',
      },
      resourceIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Resource identifiers (service names, task IDs, etc.)',
      },
      operationParams: {
        type: 'object',
        description: 'Additional parameters for create/update/scale operations',
        additionalProperties: true,
      },
      region: {
        type: 'string',
        description: 'AWS region (optional)',
      },
      profile: {
        type: 'string',
        description: 'AWS profile to use (optional)',
      },
    },
    required: ['platform', 'resourceType', 'operation'],
  },
};

/**
 * Export all unified tools
 */
export const unifiedTools: Tool[] = [
  profileManagementTool,
  listResourcesTool,
  describeResourceTool,
  executeActionTool,
  queryDatabaseTool,
  logsOperationsTool,
  getMetricsTool,
  searchResourcesTool,
  getCostsTool,
  accountInfoTool,
  manageSecretsTool,
  containerOperationsTool,
];
