/**
 * VS Code Extension Entry Point
 * Registers and manages the MCP AWS CLI server
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger, cache, config } from './utils';
import { unifiedTools } from './tools/unified.tools';

let serverProcess: Promise<void> | null = null;

/**
 * Activate extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    logger.info('MCP AWS CLI Extension activating...');

    // Initialize configuration watcher
    const configWatcher = config.watchConfiguration(() => {
      logger.info('Configuration changed');
      cache.reloadConfiguration();
    });

    context.subscriptions.push(configWatcher);

    // Register MCP Server Definition Provider (modern VS Code API)
    logger.info('Registering MCP Server Definition Provider...');
    const mcpServerPath = path.join(context.extensionPath, 'dist', 'index.js');
    logger.info(`MCP Server path: ${mcpServerPath}`);
    
    context.subscriptions.push(
      vscode.lm.registerMcpServerDefinitionProvider('mcp-aws-cli', {
        provideMcpServerDefinitions() {
          logger.info('Providing MCP Server definitions...');
          return [
            new vscode.McpStdioServerDefinition(
              'mcp-aws-cli',
              'node',
              [mcpServerPath]
            )
          ];
        }
      })
    );
    logger.info('MCP Server Definition Provider registered successfully');

    // Register commands
    registerCommands(context);

    logger.info('MCP AWS CLI Extension activated successfully');
    
    // Show welcome message
    vscode.window.showInformationMessage(
      `MCP AWS CLI: ${unifiedTools.length} unified tools available for GitHub Copilot Chat! ✨`
    );
  } catch (error) {
    logger.error('Failed to activate extension', error as Error);
    vscode.window.showErrorMessage(
      `Failed to activate MCP AWS CLI: ${(error as Error).message}`
    );
  }
}

/**
 * Register VS Code commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Command: Show Logs
  const showLogsCommand = vscode.commands.registerCommand(
    'mcpAwsCli.showLogs',
    () => {
      logger.show();
    }
  );

  // Command: Clear Cache
  const clearCacheCommand = vscode.commands.registerCommand(
    'mcpAwsCli.clearCache',
    () => {
      cache.clear();
      vscode.window.showInformationMessage('MCP AWS CLI: Cache cleared');
      logger.info('Cache cleared via command');
    }
  );

  // Command: Reload Configuration
  const reloadConfigCommand = vscode.commands.registerCommand(
    'mcpAwsCli.reloadConfig',
    () => {
      config.reloadConfiguration();
      cache.reloadConfiguration();
      vscode.window.showInformationMessage('MCP AWS CLI: Configuration reloaded');
      logger.info('Configuration reloaded via command');
    }
  );

  // Command: Show Server Info
  const showInfoCommand = vscode.commands.registerCommand(
    'mcpAwsCli.showInfo',
    () => {
      const appConfig = config.getConfig();
      const cacheStats = cache.getStats();
      
      const info = `
MCP AWS CLI Server
------------------
Version: 2.0.0 (Unified Architecture)
Status: ${serverProcess ? '🟢 Running' : '🔴 Stopped'}
Tools: ${unifiedTools.length} unified tools

Configuration:
- Default Region: ${appConfig.defaultRegion}
- Cache Timeout: ${appConfig.cacheTimeout}s
- Max Retries: ${appConfig.maxRetries}
- Debug Logs: ${appConfig.enableDebugLogs ? 'Enabled' : 'Disabled'}

Cache Statistics:
- Keys: ${cacheStats.keys}
- Hits: ${cacheStats.hits}
- Misses: ${cacheStats.misses}
- Hit Rate: ${cacheStats.hits > 0 ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) : 0}%
      `.trim();

      vscode.window.showInformationMessage(info, { modal: true });
      logger.info('Displayed server info');
    }
  );

  context.subscriptions.push(
    showLogsCommand,
    clearCacheCommand,
    reloadConfigCommand,
    showInfoCommand
  );

  logger.debug('Commands registered');
}

/**
 * Deactivate extension
 */
export async function deactivate(): Promise<void> {
  try {
    logger.info('Deactivating MCP AWS CLI Extension...');

    // Cleanup resources
    cache.dispose();
    logger.dispose();

    logger.info('Extension deactivated');
  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}
