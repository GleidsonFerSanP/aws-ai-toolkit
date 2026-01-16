/**
 * Profile Validator
 * Validates profile availability before executing AWS operations
 */

import { profileService } from '../services/profile.service';
import { logger } from './logger';
import { ErrorHandler, ProfileError } from './error-handler';

export class ProfileValidator {
  /**
   * Validate that a profile exists and is configured
   */
  public static validateProfile(profileName?: string): void {
    // Check if any profiles exist
    if (!profileService.hasProfiles()) {
      throw new ProfileError(
        'No AWS profiles configured. Please create a profile first using the "create-profile" tool with your AWS credentials.',
        'validateProfile'
      );
    }

    // Check if active profile exists when no profile specified
    if (!profileName && !profileService.hasActiveProfile()) {
      const availableProfiles = this.getAvailableProfiles();
      throw new ProfileError(
        `No active profile set. Please set an active profile using "set-active-profile" or specify a profile name. Available profiles: ${availableProfiles}`,
        'validateProfile'
      );
    }

    logger.debug('Profile validation passed', { 
      profileName: profileName || 'active',
      totalProfiles: profileService.getProfileCount() 
    });
  }

  /**
   * Get list of available profiles (synchronously from storage)
   */
  private static getAvailableProfiles(): string {
    try {
      // Access storage directly for sync operation
      const storage = (profileService as any).storage;
      if (storage && storage.profiles) {
        const profileNames = Object.keys(storage.profiles);
        return profileNames.length > 0 ? profileNames.join(', ') : 'none';
      }
      return 'none';
    } catch {
      return 'none';
    }
  }

  /**
   * Create user-friendly error message for missing profile
   */
  public static getMissingProfileMessage(): string {
    const profileCount = profileService.getProfileCount();
    
    if (profileCount === 0) {
      return `
⚠️  No AWS profiles configured yet.

To get started, create a profile with your AWS credentials:
1. Use the "create-profile" tool
2. Provide: name, accessKeyId, secretAccessKey, and region

Example:
{
  "name": "default",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_SECRET_ACCESS_KEY",
  "region": "us-east-1"
}

Your credentials will be stored securely in: ~/.mcp-aws-cli/profiles.json
      `.trim();
    }

    const availableProfiles = this.getAvailableProfiles();
    return `
⚠️  No active profile set.

Available profiles: ${availableProfiles}

Please either:
1. Set an active profile using "set-active-profile" tool
2. Or specify a profile name when calling the tool
    `.trim();
  }

  /**
   * Safely get credentials with validation
   */
  public static safeGetCredentials(profileName?: string) {
    try {
      this.validateProfile(profileName);
      return profileService.getCredentials(profileName);
    } catch (error) {
      if (error instanceof ProfileError) {
        logger.warn('Profile validation failed', { error: error.message });
        throw error;
      }
      throw ErrorHandler.toErrorDetails(error);
    }
  }
}

export const profileValidator = ProfileValidator;
