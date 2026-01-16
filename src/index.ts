#!/usr/bin/env node

/**
 * MCP AWS CLI Server - UNIFIED VERSION
 * 12 generic tools instead of 73 specific tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from './utils';
import { unifiedTools } from './tools/unified.tools';
import {
  handleProfileManagement,
  handleListResources,
  handleDescribeResource,
  handleExecuteAction,
  handleQueryDatabase,
  handleLogsOperations,
  handleGetMetrics,
  handleSearchResources,
  handleGetCosts,
  handleAccountInfo,
  handleManageSecrets,
  handleContainerOperations,
} from './handlers/unified';

/**
 * Create and configure MCP server with unified tools
 */
export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'mcp-aws-cli',
      version: '2.0.0', // Version bump for unified architecture
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing unified tools');
    
    return {
      tools: unifiedTools, // 12 generic tools instead of 73
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    logger.info(`Tool called: ${name}`, { args });

    try {
      switch (name) {
        case 'aws-manage-profiles':
          return await handleProfileManagement(args as any || {});
        
        case 'aws-list-resources':
          return await handleListResources(args as any || {});
        
        case 'aws-describe-resource':
          return await handleDescribeResource(args as any);
        
        case 'aws-execute-action':
          return await handleExecuteAction(args as any);
        
        case 'aws-query-database':
          return await handleQueryDatabase(args as any);
        
        case 'aws-logs-operations':
          return await handleLogsOperations(args as any);
        
        case 'aws-get-metrics':
          return await handleGetMetrics(args as any);
        
        case 'aws-search-resources':
          return await handleSearchResources(args as any);
        
        case 'aws-get-costs':
          return await handleGetCosts(args as any);
        
        case 'aws-account-info':
          return await handleAccountInfo(args as any);
        
        case 'aws-manage-secrets':
          return await handleManageSecrets(args as any);
        
        case 'aws-container-operations':
          return await handleContainerOperations(args as any);
        
        default:
          logger.warn(`Unknown tool called: ${name}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Unknown tool: ${name}`,
                  availableTools: unifiedTools.map(t => t.name),
                }, null, 2),
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      logger.error(`Error executing tool ${name}`, error as Error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: (error as Error).message,
              stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start MCP server with stdio transport
 */
export async function startMCPServer(): Promise<void> {
  try {
    logger.info('Starting MCP AWS CLI Server (Unified Architecture)...');
    logger.info('12 generic tools instead of 73 specific tools');
    
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    logger.info('MCP AWS CLI Server started successfully');
    logger.info('Tools: aws-manage-profiles, aws-list-resources, aws-describe-resource, aws-execute-action, aws-query-database, aws-logs-operations, aws-get-metrics, aws-search-resources, aws-get-costs, aws-account-info, aws-manage-secrets, aws-container-operations');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start MCP server', error as Error);
    process.exit(1);
  }
}

// Start server if run directly
if (require.main === module) {
  startMCPServer();
}
