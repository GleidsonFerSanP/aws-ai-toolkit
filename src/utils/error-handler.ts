/**
 * Error handling utilities and custom error classes
 */

import { ErrorDetails } from '../models';
import { logger } from './logger';

/**
 * Base error class for AWS operations
 */
export class AWSServiceError extends Error {
  public readonly code: string;
  public readonly service: string;
  public readonly operation: string;
  public readonly timestamp: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    service: string,
    operation: string,
    code = 'UnknownError',
    originalError?: Error
  ) {
    super(message);
    this.name = 'AWSServiceError';
    this.code = code;
    this.service = service;
    this.operation = operation;
    this.timestamp = new Date().toISOString();
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AWSServiceError);
    }
  }

  /**
   * Convert to ErrorDetails format
   */
  public toErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      service: this.service,
      operation: this.operation,
      originalError: this.originalError,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Profile-specific errors
 */
export class ProfileError extends AWSServiceError {
  constructor(message: string, operation: string, originalError?: Error) {
    super(message, 'ProfileService', operation, 'ProfileError', originalError);
    this.name = 'ProfileError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly timestamp: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Credential errors
 */
export class CredentialError extends AWSServiceError {
  constructor(message: string, operation: string, originalError?: Error) {
    super(message, 'Credentials', operation, 'CredentialError', originalError);
    this.name = 'CredentialError';
  }
}

/**
 * Resource not found errors
 */
export class ResourceNotFoundError extends AWSServiceError {
  public readonly resourceType: string;
  public readonly resourceId: string;

  constructor(resourceType: string, resourceId: string, service: string, operation: string) {
    super(
      `Resource not found: ${resourceType} with ID ${resourceId}`,
      service,
      operation,
      'ResourceNotFound'
    );
    this.name = 'ResourceNotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle AWS SDK errors
   */
  public static handleAWSError(error: unknown, service: string, operation: string): AWSServiceError {
    // AWS SDK v3 errors
    if (error && typeof error === 'object' && '$metadata' in error) {
      const awsError = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
      const code = awsError.name || 'UnknownAWSError';
      const message = awsError.message || 'An unknown AWS error occurred';
      
      logger.error(`AWS ${service} error in ${operation}`, undefined, {
        code,
        message,
        statusCode: awsError.$metadata?.httpStatusCode,
      });

      return new AWSServiceError(message, service, operation, code, error as unknown as Error);
    }

    // Standard Error
    if (error instanceof Error) {
      logger.error(`Error in ${service}.${operation}`, error);
      return new AWSServiceError(error.message, service, operation, 'Error', error);
    }

    // Unknown error
    const message = String(error);
    logger.error(`Unknown error in ${service}.${operation}`, undefined, { error: message });
    return new AWSServiceError(message, service, operation);
  }

  /**
   * Handle validation errors
   */
  public static handleValidationError(field: string, message: string): ValidationError {
    logger.warn(`Validation error for field '${field}': ${message}`);
    return new ValidationError(message, field);
  }

  /**
   * Create ErrorDetails from any error
   */
  public static toErrorDetails(error: unknown): ErrorDetails {
    if (error instanceof AWSServiceError) {
      return error.toErrorDetails();
    }

    if (error instanceof ValidationError) {
      return {
        code: 'ValidationError',
        message: error.message,
        timestamp: error.timestamp,
      };
    }

    if (error instanceof Error) {
      return {
        code: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
        originalError: error,
      };
    }

    return {
      code: 'UnknownError',
      message: String(error),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if error is retriable
   */
  public static isRetriable(error: unknown): boolean {
    if (error && typeof error === 'object' && '$metadata' in error) {
      const awsError = error as { name?: string; $retryable?: { throttling?: boolean } };
      const retriableCodes = ['ThrottlingException', 'TooManyRequestsException', 'RequestTimeout'];
      
      return (
        retriableCodes.includes(awsError.name || '') ||
        awsError.$retryable?.throttling === true
      );
    }

    return false;
  }
}
