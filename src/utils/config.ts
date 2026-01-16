/**
 * Configuration utility for loading VS Code settings
 */

let vscode: any;
try {
  vscode = require('vscode');
} catch {
  vscode = null; // Standalone mode
}

import { AWSRegion, RetryConfig } from '../models';

/**
 * Application configuration
 */
export interface AppConfig {
  defaultRegion: AWSRegion;
  cacheTimeout: number;
  enableDebugLogs: boolean;
  maxRetries: number;
}

/**
 * Configuration manager
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from VS Code settings or defaults
   */
  private loadConfiguration(): AppConfig {
    if (vscode) {
      const config = vscode.workspace.getConfiguration('mcpAwsCli');
      return {
        defaultRegion: config.get('defaultRegion', 'us-east-1'),
        cacheTimeout: config.get('cacheTimeout', 300),
        enableDebugLogs: config.get('enableDebugLogs', false),
        maxRetries: config.get('maxRetries', 3),
      };
    }
    
    // Standalone mode - use environment variables or defaults
    return {
      defaultRegion: (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1') as AWSRegion,
      cacheTimeout: parseInt(process.env.MCP_AWS_CLI_CACHE_TTL || '300', 10),
      enableDebugLogs: process.env.MCP_AWS_CLI_DEBUG === 'true',
      maxRetries: parseInt(process.env.MCP_AWS_CLI_MAX_RETRIES || '3', 10),
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get retry configuration
   */
  public getRetryConfig(): RetryConfig {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: 1000,
      exponentialBackoff: true,
    };
  }

  /**
   * Reload configuration
   */
  public reloadConfiguration(): void {
    this.config = this.loadConfiguration();
  }

  /**
   * Watch for configuration changes
   */
  public watchConfiguration(callback: (config: AppConfig) => void): any {
    if (vscode) {
      return vscode.workspace.onDidChangeConfiguration((event: any) => {
        if (event.affectsConfiguration('mcpAwsCli')) {
          this.reloadConfiguration();
          callback(this.config);
        }
      });
    }
    
    // Standalone mode - return dummy disposable
    return { dispose: () => {} };
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
