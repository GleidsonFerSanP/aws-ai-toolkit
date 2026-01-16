# 🚀 MCP AWS CLI - Guia de Instalação e Uso

## ✅ Status do Projeto

**Versão:** 1.0.0  
**Status:** ✅ Compilado e empacotado com sucesso!  
**Arquivo:** `mcp-aws-cli-1.0.0.vsix` (43 KB)

---

## 📦 Instalação

### Opção 1: Instalar o arquivo .vsix

```bash
# No diretório do projeto
code --install-extension mcp-aws-cli-1.0.0.vsix
```

### Opção 2: Via VS Code Interface

1. Abra VS Code
2. Vá em Extensions (Cmd+Shift+X)
3. Clique nos três pontos (...) no canto superior direito
4. Selecione "Install from VSIX..."
5. Navegue até `mcp-aws-cli-1.0.0.vsix`

---

## 🎯 Uso

### 1. Comandos VS Code

Acesse via Command Palette ( `Cmd+Shift+P` ou `Ctrl+Shift+P` ):

* **MCP AWS CLI: Show Logs** - Ver logs da extensão
* **MCP AWS CLI: Clear Cache** - Limpar cache
* **MCP AWS CLI: Reload Configuration** - Recarregar configurações
* **MCP AWS CLI: Show Server Info** - Ver informações do servidor

### 2. MCP Tools (Para AI Agents)

#### Criar Profile

```json
{
  "tool": "create-profile",
  "arguments": {
    "name": "production",
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "environment": "production",
    "description": "Production AWS account",
    "validateCredentials": true
  }
}
```

#### Listar Profiles

```json
{
  "tool": "list-profiles",
  "arguments": {}
}
```

#### Definir Profile Ativo

```json
{
  "tool": "set-active-profile",
  "arguments": {
    "name": "production"
  }
}
```

#### Validar Credenciais

```json
{
  "tool": "validate-profile",
  "arguments": {
    "name": "production"
  }
}
```

### 3. Configurações

Ajuste via VS Code Settings:

```json
{
  "mcpAwsCli.defaultRegion": "us-east-1",
  "mcpAwsCli.cacheTimeout": 300,
  "mcpAwsCli.enableDebugLogs": false,
  "mcpAwsCli.maxRetries": 3
}
```

---

## 📁 Estrutura de Arquivos

Profiles são armazenados em:

```
~/.mcp-aws-cli/profiles.json
```

Formato:

```json
{
  "version": "1.0.0",
  "activeProfile": "production",
  "profiles": {
    "production": {
      "name": "production",
      "accessKeyId": "...",
      "secretAccessKey": "...",
      "region": "us-east-1",
      "environment": "production",
      "isActive": true,
      "accountId": "123456789012",
      "createdAt": "2026-01-16T...",
      "updatedAt": "2026-01-16T..."
    }
  },
  "lastModified": "2026-01-16T..."
}
```

---

## 🧪 Testando a Instalação

1. Instale a extensão
2. Recarregue o VS Code
3. Abra o Command Palette
4. Execute: "MCP AWS CLI: Show Server Info"
5. Verifique os logs: "MCP AWS CLI: Show Logs"

---

## 🛠️ Desenvolvimento

### Recompilar

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Criar novo pacote

```bash
npm run package
```

---

## 📚 MCP Tools Disponíveis

### Profile Management (8 tools)

1. ✅ **create-profile** - Criar novo profile AWS
2. ✅ **update-profile** - Atualizar profile existente
3. ✅ **delete-profile** - Excluir profile
4. ✅ **list-profiles** - Listar todos os profiles
5. ✅ **get-active-profile** - Obter profile ativo
6. ✅ **set-active-profile** - Definir profile ativo
7. ✅ **get-profile** - Obter detalhes de um profile
8. ✅ **validate-profile** - Validar credenciais

---

## 🔐 Segurança

* ✅ Credenciais armazenadas localmente em `~/.mcp-aws-cli/`
* ✅ Nunca loga informações sensíveis
* ✅ Validação automática com AWS STS
* ✅ Suporte a session tokens temporários
* ✅ Compatível com IAM roles

---

## 🐛 Troubleshooting

### Extensão não aparece

1. Verifique a instalação: `code --list-extensions`
2. Recarregue o VS Code: "Developer: Reload Window"

### Server não inicia

1. Verifique os logs: "MCP AWS CLI: Show Logs"
2. Verifique Node.js: `node --version` (deve ser 18+)

### Erros de compilação

```bash
rm -rf node_modules dist
npm install
npm run compile
```

---

## 📈 Próximas Features

As seguintes features estão planejadas mas ainda não implementadas:

* 🔲 EC2 Instance Management (10+ tools)
* 🔲 RDS Database Operations (8+ tools)
* 🔲 DynamoDB Table Management (6+ tools)
* 🔲 ECS/EKS Cluster Operations (12+ tools)
* 🔲 CloudWatch Logs Analysis (5+ tools)
* 🔲 S3 Bucket Operations (8+ tools)
* 🔲 Lambda Function Management (6+ tools)

---

## 📞 Suporte

Para reportar issues ou sugerir features, use o repositório do GitHub.

---

**Última atualização:** 16 de Janeiro de 2026  
**Status:** ✅ Pronto para uso!
