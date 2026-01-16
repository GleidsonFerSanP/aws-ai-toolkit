/**
 * Standalone Logger for MCP Server (no VS Code dependency)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class ServerLogger {
  private static instance: ServerLogger;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    // Check environment variable for debug logs
    if (process.env.MCP_AWS_CLI_DEBUG === 'true') {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  public static getInstance(): ServerLogger {
    if (!ServerLogger.instance) {
      ServerLogger.instance = new ServerLogger();
    }
    return ServerLogger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const logMessage = `[${timestamp}] [${levelStr}] ${message}`;
    
    // Log to stderr to keep stdout clean for MCP protocol
    if (data) {
      console.error(logMessage, data);
    } else {
      console.error(logMessage);
    }
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, err?: Error): void {
    if (err) {
      this.log(LogLevel.ERROR, `${message}: ${err.message}`, {
        stack: err.stack,
        name: err.name,
      });
    } else {
      this.log(LogLevel.ERROR, message);
    }
  }

  public show(): void {
    // No-op for server logger (VS Code only)
  }

  public dispose(): void {
    // No-op for server logger
  }
}

// Export singleton instance
export const logger = ServerLogger.getInstance();
