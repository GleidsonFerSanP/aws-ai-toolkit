/**
 * Profile Tool Handlers
 */

import { profileService } from '../services/profile.service';
import { stsService } from '../services/sts.service';
import { logger } from '../utils';

/**
 * Handle create-profile tool
 */
export async function handleCreateProfile(args: Record<string, unknown>) {
  try {
    const {
      name,
      accessKeyId,
      secretAccessKey,
      region,
      sessionToken,
      environment,
      description,
      validateCredentials = true,
    } = args;

    // Validate credentials if requested
    if (validateCredentials) {
      logger.info(`Validating credentials for new profile: ${name}`);
      const validation = await stsService.validateCredentials(
        {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
          sessionToken: sessionToken as string | undefined,
        },
        region as string
      );

      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Credential validation failed: ${validation.error}`,
              }, null, 2),
            },
          ],
        };
      }

      logger.info('Credentials validated successfully', {
        accountId: validation.accountId,
      });
    }

    // Create profile
    const result = await profileService.createProfile({
      name: name as string,
      accessKeyId: accessKeyId as string,
      secretAccessKey: secretAccessKey as string,
      region: region as string,
      sessionToken: sessionToken as string | undefined,
      environment: environment as 'dev' | 'staging' | 'production' | 'test',
      description: description as string | undefined,
    });

    // If validation was done, update account info
    if (validateCredentials && result.success && result.data) {
      const identity = await stsService.getCallerIdentity(
        {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
          sessionToken: sessionToken as string | undefined,
        },
        region as string
      );
      
      profileService.updateProfileAccountInfo(
        name as string,
        identity.accountId,
        identity.userId
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle update-profile tool
 */
export async function handleUpdateProfile(args: Record<string, unknown>) {
  try {
    const result = await profileService.updateProfile(args as any);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle delete-profile tool
 */
export async function handleDeleteProfile(args: Record<string, unknown>) {
  try {
    const { name } = args;
    const result = await profileService.deleteProfile(name as string);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle list-profiles tool
 */
export async function handleListProfiles() {
  try {
    const result = await profileService.listProfiles();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListProfiles', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle get-active-profile tool
 */
export async function handleGetActiveProfile() {
  try {
    const result = await profileService.getActiveProfile();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetActiveProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle set-active-profile tool
 */
export async function handleSetActiveProfile(args: Record<string, unknown>) {
  try {
    const { name } = args;
    const result = await profileService.setActiveProfile(name as string);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSetActiveProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle get-profile tool
 */
export async function handleGetProfile(args: Record<string, unknown>) {
  try {
    const { name } = args;
    const result = await profileService.getProfile(name as string);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle validate-profile tool
 */
export async function handleValidateProfile(args: Record<string, unknown>) {
  try {
    const { name } = args;
    
    // Get profile (active or specified)
    const profileResult = name 
      ? await profileService.getProfile(name as string)
      : await profileService.getActiveProfile();

    if (!profileResult.success || !profileResult.data) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: profileResult.error?.message || 'Profile not found',
            }, null, 2),
          },
        ],
      };
    }

    const profile = profileResult.data;

    // Validate credentials
    const validation = await stsService.validateCredentials(
      {
        accessKeyId: profile.accessKeyId,
        secretAccessKey: profile.secretAccessKey,
        sessionToken: profile.sessionToken,
      },
      profile.region
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              profileName: profile.name,
              valid: validation.valid,
              accountId: validation.accountId,
              alias: validation.alias,
              error: validation.error,
            },
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleValidateProfile', error as Error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: (error as Error).message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
