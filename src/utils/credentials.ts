/**
 * Intelligent AWS Credentials Provider
 * Searches for credentials using multiple methods in order of priority
 */

import { fromEnv } from '@aws-sdk/credential-provider-env';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { fromProcess } from '@aws-sdk/credential-provider-process';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { logger } from './logger';
import { profileService } from '../services/profile.service';

export interface CredentialsResult {
  credentials?: AwsCredentialIdentity;
  source?: string;
  needsConfiguration?: boolean;
  message?: string;
}

/**
 * Attempts to find AWS credentials using multiple methods
 * Returns a friendly message for AI to handle if not found
 */
export async function getIntelligentCredentials(
  profileName?: string,
  region?: string
): Promise<CredentialsResult> {
  const methods = [
    { name: 'MCP Profile', fn: () => getFromMCPProfile(profileName) },
    { name: 'Environment Variables', fn: fromEnv },
    { name: 'AWS Shared Credentials (~/.aws/credentials)', fn: () => fromIni({ profile: profileName })() },
    { name: 'AWS SSO', fn: () => fromSSO({ profile: profileName })() },
    { name: 'Process Credentials', fn: fromProcess },
    { name: 'AWS Default Chain', fn: () => defaultProvider()() },
  ];

  // Try each method in order
  for (const method of methods) {
    try {
      logger.debug(`Trying credentials from: ${method.name}`);
      const result = await method.fn();
      
      // Handle both direct credentials and provider functions
      const credentials = typeof result === 'function' ? await result() : result;
      
      if (credentials && 'accessKeyId' in credentials && credentials.accessKeyId) {
        logger.info(`✅ Credentials loaded from: ${method.name}`);
        return {
          credentials: credentials as AwsCredentialIdentity,
          source: method.name,
          needsConfiguration: false,
        };
      }
    } catch (error) {
      logger.debug(`${method.name} not available: ${(error as Error).message}`);
      continue;
    }
  }

  // No credentials found - return helpful message for AI
  return {
    needsConfiguration: true,
    message: buildCredentialsGuidanceMessage(profileName, region),
  };
}

/**
 * Try to get credentials from MCP profile storage
 */
async function getFromMCPProfile(profileName?: string): Promise<AwsCredentialIdentity | undefined> {
  try {
    if (!profileService.hasProfiles()) {
      return undefined;
    }

    const creds = profileService.getCredentials(profileName);
    return {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    };
  } catch {
    return undefined;
  }
}

/**
 * Build a helpful message for AI when credentials are not found
 */
function buildCredentialsGuidanceMessage(profileName?: string, region?: string): string {
  const defaultRegion = region || 'us-east-1';
  
  return `
🔐 **AWS Credentials Not Found**

I couldn't find AWS credentials using any of the standard methods. Here are your options:

**Option 1: Use Existing AWS CLI Credentials** (Recommended if AWS CLI is configured)
If you have AWS CLI already configured, I can help you create a profile from your existing credentials:
\`\`\`
Use the tool "aws-manage-profiles" with operation "create" to add your credentials
\`\`\`

**Option 2: Configure AWS CLI** (Recommended for new users)
If you don't have AWS CLI configured yet, please run this command in your terminal:
\`\`\`bash
aws configure
\`\`\`
It will ask for:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., ${defaultRegion})
- Output format (e.g., json)

After that, I'll automatically detect your credentials!

**Option 3: Use Environment Variables**
Set these environment variables in your terminal:
\`\`\`bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="${defaultRegion}"
\`\`\`

**Option 4: Create Profile via MCP** (For GitHub Copilot)
I can help you create a profile right now! Just provide:
- Profile name (e.g., "default")
- AWS Access Key ID
- AWS Secret Access Key
- Region (e.g., "${defaultRegion}")
- Optional: Session Token (for temporary credentials)

**Where to get AWS credentials?**
1. AWS Console → IAM → Users → Your User → Security Credentials → Create Access Key
2. Or ask your AWS administrator

**Current Status:**
- Profile requested: ${profileName || 'default'}
- Region: ${defaultRegion}
- Credentials checked: Environment Variables, ~/.aws/credentials, AWS SSO, EC2/ECS metadata

Would you like me to help you configure credentials using any of these methods?
`.trim();
}

/**
 * Validates if credentials are functional
 */
export async function validateCredentials(
  credentials: AwsCredentialIdentity,
  region?: string
): Promise<{ valid: boolean; accountId?: string; arn?: string; error?: string }> {
  try {
    const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
    const client = new STSClient({ region: region || 'us-east-1', credentials });
    
    const response = await client.send(new GetCallerIdentityCommand({}));
    
    return {
      valid: true,
      accountId: response.Account,
      arn: response.Arn,
    };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get region from various sources
 */
export function getRegion(requestedRegion?: string): string {
  return (
    requestedRegion ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'us-east-1'
  );
}
