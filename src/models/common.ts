/**
 * Common types and interfaces used across the application
 */

/**
 * AWS Region type
 */
export type AWSRegion = string;

/**
 * Environment type for profiles
 */
export type Environment = 'dev' | 'staging' | 'production' | 'test';

/**
 * Base response interface for all operations
 */
export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  metadata?: ResponseMetadata;
}

/**
 * Error details structure
 */
export interface ErrorDetails {
  code: string;
  message: string;
  service?: string;
  operation?: string;
  originalError?: Error;
  timestamp: string;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  requestId?: string;
  timestamp: string;
  region?: AWSRegion;
  profile?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  maxResults?: number;
  nextToken?: string;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  nextToken?: string;
  totalCount?: number;
}

/**
 * Filter interface for AWS resources
 */
export interface ResourceFilter {
  name: string;
  values: string[];
}

/**
 * AWS Resource Tag
 */
export interface AWSTag {
  Key: string;
  Value: string;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkPeriod?: number; // Check period for expired keys
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // Delay in milliseconds
  exponentialBackoff: boolean;
}
