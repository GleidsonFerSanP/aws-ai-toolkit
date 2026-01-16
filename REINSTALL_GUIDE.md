# 🔧 Guia de Reinstalação - Atualizando para v2.0.0

## ⚠️ Problema Identificado

O **build está correto** com as **12 tools unificadas**, mas a extensão instalada no VS Code ainda está usando uma versão antiga com 73 tools.

## ✅ Verificação do Build

```bash
# Verificar que o build está correto
node test-mcp-server.js

# Resultado esperado:
# ✅ Número de tools: 12
# 📋 Tools disponíveis:
#    1. aws-manage-profiles
#    2. aws-list-resources
#    ...
```

## 🚀 Solução: Reinstalar a Extensão

### Opção 1: Reinstalação Completa (Recomendado)

```bash
# 1. Desinstalar extensão antiga do VS Code
code --uninstall-extension GleidsonFerSanP.mcp-aws-cli

# 2. Rebuild completo
npm run clean
npm run compile

# 3. Criar novo VSIX
npm run package

# 4. Instalar nova versão
code --install-extension mcp-aws-cli-2.0.0.vsix --force

# 5. Recarregar VS Code
# Command Palette (Cmd+Shift+P): "Developer: Reload Window"
```

### Opção 2: Desenvolvimento Local (Hot Reload)

Se você está desenvolvendo:

```bash
# 1. Fechar VS Code completamente

# 2. Limpar cache do VS Code
rm -rf ~/Library/Application\ Support/Code/CachedExtensionVSIXs/*
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*

# 3. Rebuild
npm run clean && npm run compile

# 4. Abrir VS Code
code .

# 5. Press F5 para debug
# Ou: Run > Start Debugging
```

### Opção 3: Desenvolvimento com Watch Mode

```bash
# Terminal 1: Watch mode
npm run watch

# Terminal 2: VS Code
# Press F5 para iniciar Extension Development Host
# Qualquer mudança no código será recompilada automaticamente
```

## 🔍 Verificação Pós-Instalação

### 1. Verificar Versão da Extensão

1. Abra VS Code
2. Extensions (`Cmd+Shift+X`)
3. Procure "MCP AWS CLI"
4. Verifique: **v2.0.0** (Unified Architecture)

### 2. Verificar Logs da Extensão

```bash
# No VS Code:
# Command Palette (Cmd+Shift+P)
# > MCP AWS CLI: Show Logs

# Procure por:
# "12 generic tools instead of 73 specific tools"
```

### 3. Testar com GitHub Copilot Chat

Abra o GitHub Copilot Chat e pergunte:

```
Quais ferramentas MCP AWS você tem disponíveis?
```

**Resposta esperada:**
* Lista com **12 tools** (aws-manage-profiles, aws-list-resources, etc.)
* **NÃO deve aparecer**: list-ec2-instances, describe-ec2-instance, etc.

### 4. Verificar Info do Servidor

```bash
# Command Palette (Cmd+Shift+P)
# > MCP AWS CLI: Show Server Info

# Deve mostrar:
# Version: 2.0.0 (Unified Architecture)
# Tools: 12 unified tools
```

## 🐛 Troubleshooting

### Problema: Ainda vejo 73 tools antigas

**Causa:** Cache do VS Code ou extensão não foi substituída

**Solução:**

```bash
# 1. Desinstalar COMPLETAMENTE
code --uninstall-extension GleidsonFerSanP.mcp-aws-cli

# 2. Limpar TODOS os caches
rm -rf ~/Library/Application\ Support/Code/CachedExtensionVSIXs/*
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*
rm -rf ~/.vscode/extensions/gleidsonfersanp.mcp-aws-cli-*

# 3. Fechar VS Code COMPLETAMENTE (Cmd+Q)

# 4. Rebuild
cd /Users/gleidsonfersanp/workspace/AI/mcp-aws-cli
npm run clean
npm run compile
npm run package

# 5. Instalar
code --install-extension mcp-aws-cli-2.0.0.vsix --force

# 6. Abrir VS Code
code .

# 7. Recarregar: Developer: Reload Window
```

### Problema: Extension Host não inicia

**Causa:** Erro no código compilado

**Solução:**

```bash
# Verificar erros de compilação
npm run compile 2>&1 | grep -i error

# Verificar logs
# VS Code > Help > Toggle Developer Tools > Console
```

### Problema: GitHub Copilot não vê as tools

**Causa:** MCP Server não registrado ou não iniciou

**Verificação:**

```bash
# 1. Verificar logs da extensão
# Command Palette > MCP AWS CLI: Show Logs

# Deve conter:
# "MCP AWS CLI Extension activated successfully"
# "MCP Server Definition Provider registered successfully"

# 2. Verificar processo Node.js
ps aux | grep "node.*dist/index.js"
```

**Solução:**

```bash
# Recarregar extensão
# Command Palette > Developer: Reload Window
```

## 📊 Comparação de Versões

| Aspecto | v1.0 (OLD) | v2.0 (NEW) |
|---------|------------|------------|
| Número de Tools | 73 | 12 |
| Arquitetura | Específica | Unificada |
| Tool Names | list-ec2-instances, etc. | aws-list-resources, etc. |
| Performance | 3-5s | 1-2s |
| Cobertura | ~60 ops | ~200+ ops |

## ✅ Checklist Final

* [ ] Build executado: `npm run clean && npm run compile`
* [ ] Teste passou: `node test-mcp-server.js` mostra 12 tools
* [ ] Extensão antiga desinstalada
* [ ] Cache do VS Code limpo
* [ ] Nova extensão instalada (v2.0.0)
* [ ] VS Code recarregado
* [ ] Logs mostram "12 generic tools"
* [ ] GitHub Copilot vê apenas as 12 tools novas
* [ ] Teste funcional: listar recursos AWS via Copilot

## 🎯 Resultado Esperado

Após seguir este guia:
* ✅ Extensão v2.0.0 instalada
* ✅ 12 tools unificadas disponíveis
* ✅ GitHub Copilot responde mais rápido
* ✅ Nenhum vestígio das 73 tools antigas

---

**Última atualização:** 16 de Janeiro de 2026  
**Versão alvo:** 2.0.0
