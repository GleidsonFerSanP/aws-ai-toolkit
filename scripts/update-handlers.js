#!/usr/bin/env node
/**
 * Script para atualizar todos os handlers com o sistema inteligente de credenciais
 */

const fs = require("fs");
const path = require("path");

const handlersDir = path.join(__dirname, "../src/handlers/unified");

const filesToUpdate = [
  "describe-resource.handler.ts",
  "execute-action.handler.ts",
  "get-costs.handler.ts",
  "get-metrics.handler.ts",
  "logs-operations.handler.ts",
  "query-database.handler.ts",
  "search-resources.handler.ts",
  "manage-secrets.handler.ts",
  "account-info.handler.ts",
  "container-operations.handler.ts",
];

// Padrões a substituir
const replacements = [
  {
    // Remover import do profileService
    from: /import { profileService } from ['"].*?['"];?\n?/g,
    to: "",
  },
  {
    // Adicionar imports do credentials inteligente
    from: /(import.*from.*utils['"];?\n)/,
    to: "$1import { getIntelligentCredentials, getRegion } from '../../utils';\n",
  },
  {
    // Substituir padrão antigo de obtenção de credenciais
    from: /const profileData = await profileService\.getActiveProfile\(\);[\s\S]*?const credentials = \{[\s\S]*?};/,
    to: `// Get credentials intelligently
    const region = getRegion(args.region);
    const credResult = await getIntelligentCredentials(args.profile, region);
    
    // If credentials not found, return helpful message instead of error
    if (credResult.needsConfiguration) {
      return {
        content: [{
          type: 'text',
          text: credResult.message || 'AWS credentials not configured.',
        }],
        isError: false, // Not an error, just needs configuration
      };
    }

    const credentials = credResult.credentials!;`,
  },
  {
    // Substituir referências a profile.region
    from: /const region = args\.region \|\| profile\.region;/g,
    to: "const region = getRegion(args.region);",
  },
];

filesToUpdate.forEach((filename) => {
  const filePath = path.join(handlersDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Apply replacements
  replacements.forEach((replacement) => {
    content = content.replace(replacement.from, replacement.to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Updated: ${filename}`);
  } else {
    console.log(`⏭️  No changes: ${filename}`);
  }
});

console.log("\n✨ All handlers updated!");
