/**
 * STS Service
 * AWS Security Token Service operations for credential validation
 */

import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { AWSCredentials, ProfileValidationResult } from '../models';
import { awsClientFactory } from './aws-client.factory';
import { logger, ErrorHandler } from '../utils';

/**
 * STS Service
 * Handles AWS credential validation and identity operations
 */
export class STSService {
  private static instance: STSService;

  private constructor() {
    logger.info('STS Service initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): STSService {
    if (!STSService.instance) {
      STSService.instance = new STSService();
    }
    return STSService.instance;
  }

  /**
   * Validate AWS credentials
   */
  public async validateCredentials(
    credentials: AWSCredentials,
    region?: string
  ): Promise<ProfileValidationResult> {
    try {
      logger.debug('Validating AWS credentials');

      const stsClient = awsClientFactory.getSTSClient(region, credentials);
      const command = new GetCallerIdentityCommand({});
      
      const response = await stsClient.send(command);

      if (!response.Account) {
        throw new Error('Invalid response from STS - no account ID returned');
      }

      logger.info('Credentials validated successfully', {
        accountId: response.Account,
        userId: response.UserId,
      });

      return {
        valid: true,
        accountId: response.Account,
        alias: response.UserId,
      };
    } catch (error) {
      logger.error('Error validating credentials', error as Error);
      
      const errorDetails = ErrorHandler.handleAWSError(error, 'STS', 'validateCredentials');
      
      return {
        valid: false,
        error: errorDetails.message,
      };
    }
  }

  /**
   * Get caller identity
   */
  public async getCallerIdentity(credentials: AWSCredentials, region?: string) {
    try {
      const stsClient = awsClientFactory.getSTSClient(region, credentials);
      const command = new GetCallerIdentityCommand({});
      
      const response = await stsClient.send(command);

      logger.debug('Retrieved caller identity', {
        accountId: response.Account,
        arn: response.Arn,
      });

      return {
        accountId: response.Account || '',
        arn: response.Arn || '',
        userId: response.UserId || '',
      };
    } catch (error) {
      logger.error('Error getting caller identity', error as Error);
      throw ErrorHandler.handleAWSError(error, 'STS', 'getCallerIdentity');
    }
  }
}

// Export singleton instance
export const stsService = STSService.getInstance();
