/**
 * Cache utility using node-cache
 */

let vscode: any;
try {
  vscode = require('vscode');
} catch {
  vscode = null; // Standalone mode
}

import NodeCache from 'node-cache';
import { CacheConfig } from '../models';
import { logger } from './logger';

/**
 * Cache manager for storing temporary data
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: NodeCache;
  private config: CacheConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.cache = new NodeCache({
      stdTTL: this.config.ttl,
      checkperiod: this.config.checkPeriod || this.config.ttl * 0.2,
      useClones: false, // Better performance, but be careful with mutable objects
    });

    // Log cache statistics periodically
    this.cache.on('expired', (key) => {
      logger.debug(`Cache key expired: ${key}`);
    });

    logger.info('Cache manager initialized', {
      ttl: this.config.ttl,
      checkPeriod: this.config.checkPeriod,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Load configuration from VS Code settings or defaults
   */
  private loadConfiguration(): CacheConfig {
    let ttl = 300; // Default 5 minutes
    
    if (vscode) {
      const config = vscode.workspace.getConfiguration('mcpAwsCli');
      ttl = config.get('cacheTimeout', 300);
    } else {
      // Standalone mode - use environment variable or default
      ttl = parseInt(process.env.MCP_AWS_CLI_CACHE_TTL || '300', 10);
    }

    return {
      ttl,
      checkPeriod: ttl * 0.2,
    };
  }

  /**
   * Generate cache key
   */
  public generateKey(prefix: string, ...parts: (string | number | undefined)[]): string {
    const filteredParts = parts.filter((p) => p !== undefined);
    return `${prefix}:${filteredParts.join(':')}`;
  }

  /**
   * Get value from cache
   */
  public get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        logger.debug(`Cache hit: ${key}`);
      } else {
        logger.debug(`Cache miss: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error(`Error getting cache key: ${key}`, error as Error);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = this.cache.set(key, value, ttl || this.config.ttl);
      if (success) {
        logger.debug(`Cache set: ${key}`, { ttl: ttl || this.config.ttl });
      }
      return success;
    } catch (error) {
      logger.error(`Error setting cache key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  public delete(key: string): boolean {
    try {
      const deleted = this.cache.del(key);
      if (deleted > 0) {
        logger.debug(`Cache deleted: ${key}`);
      }
      return deleted > 0;
    } catch (error) {
      logger.error(`Error deleting cache key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  public deletePattern(pattern: string): number {
    try {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter((key) => key.includes(pattern));
      const deleted = this.cache.del(matchingKeys);
      logger.debug(`Cache pattern deleted: ${pattern}`, { count: deleted });
      return deleted;
    } catch (error) {
      logger.error(`Error deleting cache pattern: ${pattern}`, error as Error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or set value (with callback)
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch and store
    try {
      logger.debug(`Fetching data for cache key: ${key}`);
      const value = await fetcher();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Error fetching data for cache key: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    try {
      this.cache.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Reload configuration
   */
  public reloadConfiguration(): void {
    this.config = this.loadConfiguration();
    logger.info('Cache configuration reloaded');
  }

  /**
   * Dispose cache
   */
  public dispose(): void {
    this.cache.flushAll();
    this.cache.close();
    logger.info('Cache manager disposed');
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();
