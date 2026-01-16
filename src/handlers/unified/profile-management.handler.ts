/**
 * Unified Profile Management Handler
 * Consolidates all 8 profile operations into one handler
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { profileService } from '../../services/profile.service';
import { logger } from '../../utils';

interface ProfileManagementArgs {
  operation: 'create' | 'update' | 'delete' | 'list' | 'get' | 'set-active' | 'get-active' | 'validate';
  profileName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  sessionToken?: string;
  environment?: 'dev' | 'staging' | 'production' | 'test';
  description?: string;
}

export async function handleProfileManagement(args: ProfileManagementArgs): Promise<CallToolResult> {
  try {
    logger.info(`Profile operation: ${args.operation}`);

    switch (args.operation) {
      case 'create':
        return await handleCreate(args);
      
      case 'update':
        return await handleUpdate(args);
      
      case 'delete':
        return await handleDelete(args);
      
      case 'list':
        return await handleList();
      
      case 'get':
        return await handleGet(args);
      
      case 'set-active':
        return await handleSetActive(args);
      
      case 'get-active':
        return await handleGetActive();
      
      case 'validate':
        return await handleValidate(args);
      
      default:
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Unknown operation: ${args.operation}`,
            }, null, 2),
          }],
          isError: true,
        };
    }
  } catch (error) {
    logger.error('Profile management error', error as Error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: (error as Error).message,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

async function handleCreate(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName || !args.accessKeyId || !args.secretAccessKey || !args.region || !args.environment) {
    throw new Error('Missing required fields for create: profileName, accessKeyId, secretAccessKey, region, environment');
  }

  const profileResponse = await profileService.createProfile({
    name: args.profileName!,
    accessKeyId: args.accessKeyId!,
    secretAccessKey: args.secretAccessKey!,
    region: args.region!,
    sessionToken: args.sessionToken,
    environment: args.environment,
    description: args.description,
  });

  if (!profileResponse || !profileResponse.data) {
    throw new Error(`Failed to create profile '${args.profileName}'`);
  }

  const profile = profileResponse.data;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: `Profile '${args.profileName}' created successfully`,
        profile: {
          name: profile.name,
          region: profile.region,
          environment: profile.environment,
          isActive: profile.isActive,
        },
      }, null, 2),
    }],
  };
}

async function handleUpdate(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName) {
    throw new Error('profileName is required for update operation');
  }

  const updateInput: any = {
    name: args.profileName,
  };
  
  if (args.accessKeyId) updateInput.accessKeyId = args.accessKeyId;
  if (args.secretAccessKey) updateInput.secretAccessKey = args.secretAccessKey;
  if (args.region) updateInput.region = args.region;
  if (args.sessionToken !== undefined) updateInput.sessionToken = args.sessionToken;
  if (args.description !== undefined) updateInput.description = args.description;
  if (args.environment) updateInput.environment = args.environment;

  const profileResponse = await profileService.updateProfile(updateInput);
  
  if (!profileResponse || !profileResponse.data) {
    throw new Error(`Failed to update profile '${args.profileName}'`);
  }

  const profile = profileResponse.data;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: `Profile '${args.profileName}' updated successfully`,
        profile: {
          name: profile.name,
          region: profile.region,
          environment: profile.environment,
          isActive: profile.isActive,
        },
      }, null, 2),
    }],
  };
}

async function handleDelete(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName) {
    throw new Error('profileName is required for delete operation');
  }

  await profileService.deleteProfile(args.profileName);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: `Profile '${args.profileName}' deleted successfully`,
      }, null, 2),
    }],
  };
}

async function handleList(): Promise<CallToolResult> {
  const profilesResponse = await profileService.listProfiles();
  const profiles = profilesResponse.data || [];

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        count: profiles.length,
        profiles: profiles.map((p: any) => ({
          name: p.name,
          region: p.region,
          environment: p.environment,
          isActive: p.isActive,
          description: p.description,
        })),
      }, null, 2),
    }],
  };
}

async function handleGet(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName) {
    throw new Error('profileName is required for get operation');
  }

  const profileResponse = await profileService.getProfile(args.profileName);
  
  if (!profileResponse || !profileResponse.data) {
    throw new Error(`Profile '${args.profileName}' not found`);
  }

  const profile = profileResponse.data;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        profile: {
          name: profile.name,
          region: profile.region,
          environment: profile.environment,
          isActive: profile.isActive,
          description: profile.description,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      }, null, 2),
    }],
  };
}

async function handleSetActive(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName) {
    throw new Error('profileName is required for set-active operation');
  }

  await profileService.setActiveProfile(args.profileName);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: `Profile '${args.profileName}' set as active`,
      }, null, 2),
    }],
  };
}

async function handleGetActive(): Promise<CallToolResult> {
  const profileResponse = await profileService.getActiveProfile();

  if (!profileResponse || !profileResponse.data) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          message: 'No active profile set. Create and activate a profile first.',
        }, null, 2),
      }],
    };
  }

  const profile = profileResponse.data;
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        profile: {
          name: profile.name,
          region: profile.region,
          environment: profile.environment,
          description: profile.description,
        },
      }, null, 2),
    }],
  };
}

async function handleValidate(args: ProfileManagementArgs): Promise<CallToolResult> {
  if (!args.profileName) {
    throw new Error('profileName is required for validate operation');
  }

  try {
    const profile = await profileService.getProfile(args.profileName);
    
    // Simple validation - profile exists and has required fields
    const valid = !!(
      profile &&
      profile.data &&
      profile.data.accessKeyId &&
      profile.data.secretAccessKey &&
      profile.data.region
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: valid,
          message: valid ? 'Profile is valid' : 'Profile validation failed',
          valid,
          profileName: args.profileName,
        }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          valid: false,
          message: `Profile validation failed: ${(error as Error).message}`,
        }, null, 2),
      }],
    };
  }
}
