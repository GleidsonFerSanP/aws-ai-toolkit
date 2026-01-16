# Changelog

All notable changes to the "MCP AWS CLI Manager" extension will be documented in this file.

## [2.0.0] - 2026-01-16

### 🚀 Major Refactoring: Unified Tools Architecture

**BREAKING CHANGE:** Refatorado de 73 ferramentas específicas para 12 ferramentas unificadas

#### 🎯 Motivação

* GitHub Copilot apresentava degradação de performance com 73 tools MCP
* Limitação identificada: >128 tools causam lentidão significativa
* Tempo de seleção de tool: 3-5 segundos
* Precisão de seleção: ~85% (escolha incorreta de tool em alguns casos)

#### ✅ Solução Implementada

* **83% de redução** no número de tools (73 → 12)
* **60% mais rápido** (tempo de resposta: 1-2s)
* **+15% de precisão** na seleção de tools (~98%)
* Cobertura expandida para **200+ operações AWS** com apenas 12 tools

#### 📦 12 Ferramentas Unificadas

01. **aws-manage-profiles** - Profile management (8 operations)
02. **aws-list-resources** - List any AWS resource (25+ resource types)
03. **aws-describe-resource** - Describe any AWS resource (15+ resource types)
04. **aws-execute-action** - Execute actions on resources (7 actions × N types)
05. **aws-query-database** - Database operations (DynamoDB, RDS)
06. **aws-logs-operations** - CloudWatch Logs (7 operations)
07. **aws-get-metrics** - CloudWatch Metrics (universal)
08. **aws-search-resources** - Search & discovery (6 search types)
09. **aws-get-costs** - Cost & billing data (2 operations)
10. **aws-account-info** - Account information (6 info types)
11. **aws-manage-secrets** - Secrets Manager & Parameter Store (6 operations)
12. **aws-container-operations** - ECS & EKS management (7 operations)

#### 🏗️ Arquitetura

* Handlers unificados em `src/handlers/unified/`
* Tool definitions em `src/tools/unified.tools.ts`
* Roteamento interno por `operation`,  `resourceType`,  `action`
* Schemas com múltiplos enums e validação condicional

#### 📊 Cobertura AWS

* ✅ EC2 (instances, key-pairs, security groups)
* ✅ RDS (instances, clusters, snapshots)
* ✅ DynamoDB (tables, backups, queries)
* ✅ ECS (clusters, services, tasks)
* ✅ EKS (clusters, nodegroups, addons)
* ✅ CloudWatch (logs, metrics, insights)
* ✅ Secrets Manager & SSM Parameter Store
* ✅ Cost Explorer & Service Quotas
* ✅ S3, Lambda, IAM (via Resource Groups)

#### 📚 Documentação

* [ADR-004](docs/architecture/unified-tools-decision.md) - Decisão arquitetural completa
* [VS Code Extension Architecture](docs/architecture/vscode-extension-mcp-integration.md) - Arquitetura da extensão

### Changed

* **BREAKING:** Tool names alterados (ex: `list-ec2-instances` → `aws-list-resources`)
* Handler structure completamente refatorado
* Performance otimizada para GitHub Copilot Chat

### Added

* Auto-registro do MCP server via `registerMcpServerDefinitionProvider`
* Built-in server path (não requer configuração externa)
* Ativação automática em `onStartupFinished`
* Zero-config installation experience

---

## [1.0.0] - 2026-01-15 (Deprecated)

### ⚠️ Versão Descontinuada

Esta versão tinha 73 ferramentas específicas e foi substituída pela v2.0.0 com arquitetura unificada.

### Added

* Initial release
* Profile management system with 8 MCP tools
* AWS SDK v3 integration for 13 AWS services
* Clean Architecture implementation
* SOLID principles throughout codebase
* Comprehensive error handling
* Caching system with configurable TTL
* VS Code extension with 4 commands
* Credential validation with AWS STS
* Persistent storage in home directory
* TypeScript with strict mode
* Logger with VS Code Output Channel
* Configuration management
* Profile switching and active profile tracking

### Features

* Create, update, delete AWS profiles
* List and manage profiles
* Validate credentials automatically
* Support for multiple environments (dev, staging, prod, test)
* Account ID and alias tracking
* Session token support for temporary credentials

### Tools (MCP Protocol)

01. create-profile
02. update-profile
03. delete-profile
04. list-profiles
05. get-active-profile
06. set-active-profile
07. get-profile
08. validate-profile

### Commands (VS Code)

01. Show Logs
02. Clear Cache
03. Reload Configuration
04. Show Server Info

## [Unreleased]

### Planned Features

* EC2 instance management tools
* RDS database operations
* DynamoDB table management
* ECS/EKS cluster operations
* CloudWatch logs analysis
* S3 bucket operations
* Lambda function management
* Cost analysis and optimization
* Resource tagging utilities
* Multi-region support enhancements
