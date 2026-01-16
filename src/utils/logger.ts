/**
 * Logger utility for consistent logging across the application
 * Works both in VS Code extension context and standalone MCP server
 */

let vscode: any;
try {
  vscode = require('vscode');
} catch {
  vscode = null; // Standalone mode
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private outputChannel: any;
  private logLevel: LogLevel = LogLevel.INFO;
  private isStandalone: boolean;

  private constructor() {
    this.isStandalone = !vscode;
    
    if (!this.isStandalone) {
      this.outputChannel = vscode.window.createOutputChannel('MCP AWS CLI');
      this.loadConfiguration();
    } else {
      // Standalone mode - check environment variable
      if (process.env.MCP_AWS_CLI_DEBUG === 'true') {
        this.logLevel = LogLevel.DEBUG;
      }
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfiguration(): void {
    if (this.isStandalone) return;
    
    const config = vscode.workspace.getConfiguration('mcpAwsCli');
    const enableDebugLogs = config.get('enableDebugLogs', false);
    this.logLevel = enableDebugLogs ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Update log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Format log message
   */
  private formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, meta);
      if (!this.isStandalone) {
        this.outputChannel.appendLine(formatted);
      }
      // In standalone mode, use stderr to keep stdout clean for MCP protocol
      if (this.isStandalone) {
        console.error(formatted);
      } else {
        console.debug(formatted);
      }
    }
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, meta);
      if (!this.isStandalone) {
        this.outputChannel.appendLine(formatted);
      }
      if (this.isStandalone) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, meta);
      if (!this.isStandalone) {
        this.outputChannel.appendLine(formatted);
      }
      if (this.isStandalone) {
        console.error(formatted);
      } else {
        console.warn(formatted);
      }
    }
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const errorMeta = error ? {
        ...meta,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } : meta;
      const formatted = this.formatMessage('ERROR', message, errorMeta);
      if (!this.isStandalone) {
        this.outputChannel.appendLine(formatted);
      }
      console.error(formatted);
    }
  }

  /**
   * Show output channel
   */
  public show(): void {
    if (!this.isStandalone) {
      this.outputChannel.show();
    }
  }

  /**
   * Clear output channel
   */
  public clear(): void {
    if (!this.isStandalone) {
      this.outputChannel.clear();
    }
  }

  /**
   * Dispose logger
   */
  public dispose(): void {
    if (!this.isStandalone) {
      this.outputChannel.dispose();
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
