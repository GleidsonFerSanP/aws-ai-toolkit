/**
 * Profile Service
 * Manages AWS profiles with persistent storage
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  AWSProfile,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileListItem,
  ProfileStorage,
  BaseResponse,
} from '../models';
import { logger, ErrorHandler, ProfileError } from '../utils';

/**
 * Profile Service
 * Handles creation, updating, deletion and management of AWS profiles
 */
export class ProfileService {
  private static instance: ProfileService;
  private storageFilePath: string;
  private storage: ProfileStorage;

  private constructor() {
    // Store profiles in home directory
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.mcp-aws-cli');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }

    this.storageFilePath = path.join(configDir, 'profiles.json');
    this.storage = this.loadStorage();
    
    logger.info('Profile Service initialized', {
      storageFile: this.storageFilePath,
      profileCount: Object.keys(this.storage.profiles).length,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Load storage from file
   */
  private loadStorage(): ProfileStorage {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const content = fs.readFileSync(this.storageFilePath, 'utf-8');
        const storage = JSON.parse(content) as ProfileStorage;
        logger.debug('Profile storage loaded', {
          profileCount: Object.keys(storage.profiles).length,
          activeProfile: storage.activeProfile,
        });
        return storage;
      }
    } catch (error) {
      logger.error('Error loading profile storage', error as Error);
    }

    // Return default storage
    return {
      version: '1.0.0',
      profiles: {},
      lastModified: new Date().toISOString(),
    };
  }

  /**
   * Save storage to file
   */
  private saveStorage(): void {
    try {
      this.storage.lastModified = new Date().toISOString();
      const content = JSON.stringify(this.storage, null, 2);
      fs.writeFileSync(this.storageFilePath, content, 'utf-8');
      logger.debug('Profile storage saved');
    } catch (error) {
      logger.error('Error saving profile storage', error as Error);
      throw new ProfileError('Failed to save profile storage', 'saveStorage', error as Error);
    }
  }

  /**
   * Create new profile
   */
  public async createProfile(input: CreateProfileInput): Promise<BaseResponse<AWSProfile>> {
    try {
      // Validate input
      if (!input.name || !input.accessKeyId || !input.secretAccessKey || !input.region) {
        throw ErrorHandler.handleValidationError('input', 'Name, accessKeyId, secretAccessKey, and region are required');
      }

      // Check if profile already exists
      if (this.storage.profiles[input.name]) {
        throw new ProfileError(`Profile with name '${input.name}' already exists`, 'createProfile');
      }

      const now = new Date().toISOString();
      const profile: AWSProfile = {
        name: input.name,
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
        region: input.region,
        sessionToken: input.sessionToken,
        environment: input.environment,
        isActive: Object.keys(this.storage.profiles).length === 0, // First profile is active
        description: input.description,
        createdAt: now,
        updatedAt: now,
      };

      // Save profile
      this.storage.profiles[input.name] = profile;
      
      // Set as active if it's the first profile
      if (profile.isActive) {
        this.storage.activeProfile = input.name;
      }

      this.saveStorage();

      logger.info(`Profile created: ${input.name}`, {
        region: input.region,
        environment: input.environment,
        isActive: profile.isActive,
      });

      return {
        success: true,
        data: profile,
        metadata: {
          timestamp: now,
          profile: input.name,
        },
      };
    } catch (error) {
      logger.error('Error creating profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Update existing profile
   */
  public async updateProfile(input: UpdateProfileInput): Promise<BaseResponse<AWSProfile>> {
    try {
      // Check if profile exists
      const profile = this.storage.profiles[input.name];
      if (!profile) {
        throw new ProfileError(`Profile with name '${input.name}' not found`, 'updateProfile');
      }

      // Update fields
      if (input.accessKeyId) profile.accessKeyId = input.accessKeyId;
      if (input.secretAccessKey) profile.secretAccessKey = input.secretAccessKey;
      if (input.region) profile.region = input.region;
      if (input.sessionToken !== undefined) profile.sessionToken = input.sessionToken;
      if (input.environment) profile.environment = input.environment;
      if (input.description !== undefined) profile.description = input.description;
      
      profile.updatedAt = new Date().toISOString();

      this.saveStorage();

      logger.info(`Profile updated: ${input.name}`);

      return {
        success: true,
        data: profile,
        metadata: {
          timestamp: profile.updatedAt,
          profile: input.name,
        },
      };
    } catch (error) {
      logger.error('Error updating profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Delete profile
   */
  public async deleteProfile(name: string): Promise<BaseResponse<void>> {
    try {
      // Check if profile exists
      if (!this.storage.profiles[name]) {
        throw new ProfileError(`Profile with name '${name}' not found`, 'deleteProfile');
      }

      const wasActive = this.storage.profiles[name].isActive;
      delete this.storage.profiles[name];

      // If deleted profile was active, set another as active
      if (wasActive) {
        const profileNames = Object.keys(this.storage.profiles);
        if (profileNames.length > 0) {
          this.storage.profiles[profileNames[0]].isActive = true;
          this.storage.activeProfile = profileNames[0];
          logger.info(`Set ${profileNames[0]} as active profile after deletion`);
        } else {
          this.storage.activeProfile = undefined;
        }
      }

      this.saveStorage();

      logger.info(`Profile deleted: ${name}`);

      return {
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error deleting profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * List all profiles
   */
  public async listProfiles(): Promise<BaseResponse<ProfileListItem[]>> {
    try {
      const profiles: ProfileListItem[] = Object.values(this.storage.profiles).map((profile) => ({
        name: profile.name,
        region: profile.region,
        environment: profile.environment,
        isActive: profile.isActive,
        description: profile.description,
        accountId: profile.accountId,
        alias: profile.alias,
      }));

      logger.debug('Listed profiles', { count: profiles.length });

      return {
        success: true,
        data: profiles,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error listing profiles', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get active profile
   */
  public async getActiveProfile(): Promise<BaseResponse<AWSProfile>> {
    try {
      if (!this.storage.activeProfile) {
        throw new ProfileError('No active profile set', 'getActiveProfile');
      }

      const profile = this.storage.profiles[this.storage.activeProfile];
      if (!profile) {
        throw new ProfileError('Active profile not found in storage', 'getActiveProfile');
      }

      logger.debug('Retrieved active profile', { name: profile.name });

      return {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          profile: profile.name,
        },
      };
    } catch (error) {
      logger.error('Error getting active profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Set active profile
   */
  public async setActiveProfile(name: string): Promise<BaseResponse<AWSProfile>> {
    try {
      const profile = this.storage.profiles[name];
      if (!profile) {
        throw new ProfileError(`Profile with name '${name}' not found`, 'setActiveProfile');
      }

      // Deactivate all profiles
      Object.values(this.storage.profiles).forEach((p) => {
        p.isActive = false;
      });

      // Activate selected profile
      profile.isActive = true;
      this.storage.activeProfile = name;

      this.saveStorage();

      logger.info(`Active profile set to: ${name}`);

      return {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          profile: name,
        },
      };
    } catch (error) {
      logger.error('Error setting active profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Get profile by name
   */
  public async getProfile(name: string): Promise<BaseResponse<AWSProfile>> {
    try {
      const profile = this.storage.profiles[name];
      if (!profile) {
        throw new ProfileError(`Profile with name '${name}' not found`, 'getProfile');
      }

      logger.debug('Retrieved profile', { name });

      return {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          profile: name,
        },
      };
    } catch (error) {
      logger.error('Error getting profile', error as Error);
      return {
        success: false,
        error: ErrorHandler.toErrorDetails(error),
      };
    }
  }

  /**
   * Update profile account info
   */
  public updateProfileAccountInfo(name: string, accountId: string, alias?: string): void {
    const profile = this.storage.profiles[name];
    if (profile) {
      profile.accountId = accountId;
      profile.alias = alias;
      profile.updatedAt = new Date().toISOString();
      this.saveStorage();
      logger.debug(`Updated account info for profile ${name}`, { accountId, alias });
    }
  }

  /**
   * Get credentials for a profile
   */
  public getCredentials(profileName?: string) {
    const name = profileName || this.storage.activeProfile;
    if (!name) {
      throw new ProfileError(
        'No AWS profile configured. Please create a profile first using "create-profile" tool.',
        'getCredentials'
      );
    }

    const profile = this.storage.profiles[name];
    if (!profile) {
      throw new ProfileError(
        `Profile '${name}' not found. Available profiles: ${Object.keys(this.storage.profiles).join(', ') || 'none'}`,
        'getCredentials'
      );
    }

    return {
      accessKeyId: profile.accessKeyId,
      secretAccessKey: profile.secretAccessKey,
      sessionToken: profile.sessionToken,
    };
  }

  /**
   * Check if any profile exists
   */
  public hasProfiles(): boolean {
    return Object.keys(this.storage.profiles).length > 0;
  }

  /**
   * Check if active profile is set
   */
  public hasActiveProfile(): boolean {
    return !!this.storage.activeProfile && !!this.storage.profiles[this.storage.activeProfile];
  }

  /**
   * Get profile count
   */
  public getProfileCount(): number {
    return Object.keys(this.storage.profiles).length;
  }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();
