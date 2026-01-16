/**
 * Unified Manage Secrets Handler
 * Handles AWS Secrets Manager and Systems Manager Parameter Store
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  ListSecretsCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SSMClient,
  GetParameterCommand,
  GetParametersByPathCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DescribeParametersCommand,
} from '@aws-sdk/client-ssm';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { profileService } from '../../services/profile.service';

interface ManageSecretsArgs {
  service: string;
  operation: string;
  secretId?: string;
  parameterName?: string;
  secretValue?: string;
  parameterType?: string;
  withDecryption?: boolean;
  region?: string;
  profile?: string;
}

export async function handleManageSecrets(args: ManageSecretsArgs): Promise<CallToolResult> {
  // Get profile credentials
  const profileData = args.profile
    ? await profileService.getProfile(args.profile)
    : await profileService.getActiveProfile();

  if (!profileData || !profileData.data) {
    throw new Error(args.profile ? `Profile '${args.profile}' not found` : 'No active profile configured');
  }

  const profile = profileData.data;
  const region = args.region || profile.region;
  const credentials = {
    accessKeyId: profile.accessKeyId,
    secretAccessKey: profile.secretAccessKey,
    sessionToken: profile.sessionToken,
  };

  // Route to appropriate service
  if (args.service === 'secrets-manager') {
    return await handleSecretsManager(region, credentials, args);
  } else if (args.service === 'parameter-store') {
    return await handleParameterStore(region, credentials, args);
  } else {
    throw new Error(`Unsupported service: ${args.service}`);
  }
}

// ============================================================================
// Secrets Manager Operations
// ============================================================================

async function handleSecretsManager(
  region: string,
  credentials: any,
  args: ManageSecretsArgs
): Promise<CallToolResult> {
  const client = new SecretsManagerClient({ region, credentials });

  switch (args.operation) {
    case 'get':
      return await getSecret(client, args);
    
    case 'list':
      return await listSecrets(client);
    
    case 'create':
      return await createSecret(client, args);
    
    case 'update':
      return await updateSecret(client, args);
    
    case 'delete':
      return await deleteSecret(client, args);
    
    default:
      throw new Error(`Unsupported Secrets Manager operation: ${args.operation}`);
  }
}

async function getSecret(client: SecretsManagerClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.secretId) {
    throw new Error('secretId is required for get operation');
  }

  const response = await client.send(new GetSecretValueCommand({
    SecretId: args.secretId,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'secrets-manager',
        operation: 'get',
        secret: {
          arn: response.ARN,
          name: response.Name,
          versionId: response.VersionId,
          secretString: response.SecretString,
          secretBinary: response.SecretBinary ? Buffer.from(response.SecretBinary).toString('base64') : null,
          createdDate: response.CreatedDate,
        },
      }, null, 2),
    }],
  };
}

async function listSecrets(client: SecretsManagerClient): Promise<CallToolResult> {
  const response = await client.send(new ListSecretsCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'secrets-manager',
        operation: 'list',
        count: response.SecretList?.length || 0,
        secrets: response.SecretList?.map((secret: any) => ({
          arn: secret.ARN,
          name: secret.Name,
          description: secret.Description,
          lastChangedDate: secret.LastChangedDate,
          lastAccessedDate: secret.LastAccessedDate,
          tags: secret.Tags,
        })) || [],
      }, null, 2),
    }],
  };
}

async function createSecret(client: SecretsManagerClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.secretId) {
    throw new Error('secretId is required for create operation');
  }

  if (!args.secretValue) {
    throw new Error('secretValue is required for create operation');
  }

  const response = await client.send(new CreateSecretCommand({
    Name: args.secretId,
    SecretString: args.secretValue,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'secrets-manager',
        operation: 'create',
        secret: {
          arn: response.ARN,
          name: response.Name,
          versionId: response.VersionId,
        },
      }, null, 2),
    }],
  };
}

async function updateSecret(client: SecretsManagerClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.secretId) {
    throw new Error('secretId is required for update operation');
  }

  if (!args.secretValue) {
    throw new Error('secretValue is required for update operation');
  }

  const response = await client.send(new UpdateSecretCommand({
    SecretId: args.secretId,
    SecretString: args.secretValue,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'secrets-manager',
        operation: 'update',
        secret: {
          arn: response.ARN,
          name: response.Name,
          versionId: response.VersionId,
        },
      }, null, 2),
    }],
  };
}

async function deleteSecret(client: SecretsManagerClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.secretId) {
    throw new Error('secretId is required for delete operation');
  }

  const response = await client.send(new DeleteSecretCommand({
    SecretId: args.secretId,
    ForceDeleteWithoutRecovery: false, // Allow 30-day recovery period
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'secrets-manager',
        operation: 'delete',
        secret: {
          arn: response.ARN,
          name: response.Name,
          deletionDate: response.DeletionDate,
        },
        note: 'Secret scheduled for deletion with 30-day recovery period',
      }, null, 2),
    }],
  };
}

// ============================================================================
// Parameter Store Operations
// ============================================================================

async function handleParameterStore(
  region: string,
  credentials: any,
  args: ManageSecretsArgs
): Promise<CallToolResult> {
  const client = new SSMClient({ region, credentials });

  switch (args.operation) {
    case 'get':
      return await getParameter(client, args);
    
    case 'get-by-path':
      return await getParametersByPath(client, args);
    
    case 'list':
      return await listParameters(client);
    
    case 'create':
    case 'update':
      return await putParameter(client, args);
    
    case 'delete':
      return await deleteParameter(client, args);
    
    default:
      throw new Error(`Unsupported Parameter Store operation: ${args.operation}`);
  }
}

async function getParameter(client: SSMClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.parameterName) {
    throw new Error('parameterName is required for get operation');
  }

  const response = await client.send(new GetParameterCommand({
    Name: args.parameterName,
    WithDecryption: args.withDecryption ?? true,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'parameter-store',
        operation: 'get',
        parameter: {
          name: response.Parameter?.Name,
          type: response.Parameter?.Type,
          value: response.Parameter?.Value,
          version: response.Parameter?.Version,
          lastModifiedDate: response.Parameter?.LastModifiedDate,
          arn: response.Parameter?.ARN,
        },
      }, null, 2),
    }],
  };
}

async function getParametersByPath(client: SSMClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.parameterName) {
    throw new Error('parameterName (path) is required for get-by-path operation');
  }

  const response = await client.send(new GetParametersByPathCommand({
    Path: args.parameterName,
    Recursive: true,
    WithDecryption: args.withDecryption ?? true,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'parameter-store',
        operation: 'get-by-path',
        path: args.parameterName,
        count: response.Parameters?.length || 0,
        parameters: response.Parameters?.map((param: any) => ({
          name: param.Name,
          type: param.Type,
          value: param.Value,
          version: param.Version,
          lastModifiedDate: param.LastModifiedDate,
          arn: param.ARN,
        })) || [],
      }, null, 2),
    }],
  };
}

async function listParameters(client: SSMClient): Promise<CallToolResult> {
  const response = await client.send(new DescribeParametersCommand({}));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'parameter-store',
        operation: 'list',
        count: response.Parameters?.length || 0,
        parameters: response.Parameters?.map((param: any) => ({
          name: param.Name,
          type: param.Type,
          keyId: param.KeyId,
          lastModifiedDate: param.LastModifiedDate,
          lastModifiedUser: param.LastModifiedUser,
          description: param.Description,
          version: param.Version,
        })) || [],
      }, null, 2),
    }],
  };
}

async function putParameter(client: SSMClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.parameterName) {
    throw new Error('parameterName is required for create/update operation');
  }

  if (!args.secretValue) {
    throw new Error('secretValue is required for create/update operation');
  }

  const response = await client.send(new PutParameterCommand({
    Name: args.parameterName,
    Value: args.secretValue,
    Type: (args.parameterType || 'String') as any,
    Overwrite: args.operation === 'update',
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'parameter-store',
        operation: args.operation,
        parameter: {
          name: args.parameterName,
          version: response.Version,
          tier: response.Tier,
        },
      }, null, 2),
    }],
  };
}

async function deleteParameter(client: SSMClient, args: ManageSecretsArgs): Promise<CallToolResult> {
  if (!args.parameterName) {
    throw new Error('parameterName is required for delete operation');
  }

  await client.send(new DeleteParameterCommand({
    Name: args.parameterName,
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        service: 'parameter-store',
        operation: 'delete',
        parameter: {
          name: args.parameterName,
        },
      }, null, 2),
    }],
  };
}
