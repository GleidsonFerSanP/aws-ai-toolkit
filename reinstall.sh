#!/bin/bash

# Script de Reinstalação Completa da Extensão MCP AWS CLI
# Versão: 2.0.0 (Unified Tools Architecture)

set -e  # Exit on error

echo "🚀 Reinstalação Completa: MCP AWS CLI v2.0.0"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verificar build
echo "📦 Step 1: Verificando build..."
if [ ! -f "test-mcp-server.js" ]; then
    echo -e "${RED}❌ Arquivo test-mcp-server.js não encontrado${NC}"
    exit 1
fi

node test-mcp-server.js | grep "Número de tools: 12" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build verificado: 12 tools unificadas${NC}"
else
    echo -e "${RED}❌ Build incorreto. Execute: npm run clean && npm run compile${NC}"
    exit 1
fi
echo ""

# Step 2: Desinstalar versão antiga
echo "🗑️  Step 2: Desinstalando versão antiga..."
code --uninstall-extension GleidsonFerSanP.mcp-aws-cli 2>/dev/null || true
echo -e "${GREEN}✅ Versão antiga desinstalada${NC}"
echo ""

# Step 3: Limpar caches
echo "🧹 Step 3: Limpando caches do VS Code..."
rm -rf ~/Library/Application\ Support/Code/CachedExtensionVSIXs/* 2>/dev/null || true
rm -rf ~/.vscode/extensions/gleidsonfersanp.mcp-aws-cli-* 2>/dev/null || true
echo -e "${GREEN}✅ Caches limpos${NC}"
echo ""

# Step 4: Rebuild completo
echo "🔨 Step 4: Rebuild completo..."
npm run clean
npm run compile
echo -e "${GREEN}✅ Rebuild concluído${NC}"
echo ""

# Step 5: Criar pacote
echo "📦 Step 5: Criando pacote VSIX..."
echo "y" | npm run package > /dev/null 2>&1 || npm run package
if [ ! -f "mcp-aws-cli-2.0.0.vsix" ]; then
    echo -e "${RED}❌ Falha ao criar pacote VSIX${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pacote criado: mcp-aws-cli-2.0.0.vsix${NC}"
echo ""

# Step 6: Instalar nova versão
echo "📥 Step 6: Instalando nova versão..."
code --install-extension mcp-aws-cli-2.0.0.vsix --force
echo -e "${GREEN}✅ Nova versão instalada${NC}"
echo ""

# Step 7: Verificações finais
echo "🔍 Step 7: Verificações finais..."
echo ""

# Verificar se o arquivo VSIX existe
if [ -f "mcp-aws-cli-2.0.0.vsix" ]; then
    echo -e "${GREEN}✅ Pacote VSIX: mcp-aws-cli-2.0.0.vsix${NC}"
else
    echo -e "${RED}❌ Pacote VSIX não encontrado${NC}"
fi

# Verificar se o build está correto
if node test-mcp-server.js | grep -q "Número de tools: 12"; then
    echo -e "${GREEN}✅ Build: 12 tools unificadas${NC}"
else
    echo -e "${RED}❌ Build: Incorreto${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Reinstalação concluída com sucesso!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Próximos passos:${NC}"
echo ""
echo "1. Feche o VS Code COMPLETAMENTE (Cmd+Q)"
echo "2. Abra o VS Code novamente: code ."
echo "3. Recarregue: Command Palette > Developer: Reload Window"
echo "4. Verifique os logs: Command Palette > MCP AWS CLI: Show Logs"
echo "   Deve conter: '12 generic tools instead of 73 specific tools'"
echo "5. Teste com GitHub Copilot:"
echo "   Pergunte: 'Quais ferramentas MCP AWS você tem disponíveis?'"
echo "   Resposta esperada: 12 tools (aws-manage-profiles, aws-list-resources, etc.)"
echo ""
echo "📖 Documentação:"
echo "   - REINSTALL_GUIDE.md - Guia completo de reinstalação"
echo "   - BUILD_DIAGNOSIS.md - Diagnóstico detalhado"
echo ""
