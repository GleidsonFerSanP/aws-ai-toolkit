/**
 * Profile-related types and interfaces
 */

import { AWSRegion, Environment } from './common';

/**
 * AWS Profile configuration
 */
export interface AWSProfile {
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: AWSRegion;
  sessionToken?: string;
  environment: Environment;
  isActive: boolean;
  description?: string;
  accountId?: string;
  alias?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Profile creation input
 */
export interface CreateProfileInput {
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: AWSRegion;
  sessionToken?: string;
  environment: Environment;
  description?: string;
}

/**
 * Profile update input
 */
export interface UpdateProfileInput {
  name: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: AWSRegion;
  sessionToken?: string;
  environment?: Environment;
  description?: string;
}

/**
 * Profile list response
 */
export interface ProfileListItem {
  name: string;
  region: AWSRegion;
  environment: Environment;
  isActive: boolean;
  description?: string;
  accountId?: string;
  alias?: string;
}

/**
 * Profile storage structure
 */
export interface ProfileStorage {
  version: string;
  activeProfile?: string;
  profiles: Record<string, AWSProfile>;
  lastModified: string;
}

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  valid: boolean;
  accountId?: string;
  alias?: string;
  error?: string;
}

/**
 * AWS Credentials for SDK
 */
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}
