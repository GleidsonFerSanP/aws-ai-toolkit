# Plano de Implementação - MCP AWS CLI

## VS Code Extension com AWS SDK v3

**Data:** 16 de Janeiro de 2026  
**Projeto:** mcp-aws-cli  
**Autor:** AI Assistant

---

## 🎯 Visão Geral

Criar uma extensão VS Code que implementa um servidor MCP (Model Context Protocol) para gerenciamento completo de recursos AWS. A extensão permitirá que agentes de IA interajam com serviços AWS através de ferramentas especializadas, utilizando o AWS SDK v3 (mais recente).

## 📋 Features Planejadas

### 1. **Profile Management** 🔐

**Prioridade:** ALTA (Base para todas as outras features)

**Funcionalidades:**
* ✅ Criar profiles AWS com credenciais
* ✅ Editar profiles existentes
* ✅ Listar todos os profiles configurados
* ✅ Excluir profiles
* ✅ Obter profile ativo
* ✅ Configurar usuário do profile
* ✅ Manter lista de profiles com environments (dev, staging, prod)

**Implementação Técnica:**
* Armazenar profiles em arquivo JSON local (`.mcp-aws-profiles.json`)
* Validar credenciais usando `@aws-sdk/client-sts`
* Suportar configuração de região padrão
* Implementar cache seguro de credenciais

**Tools MCP:**
* `create-profile`
* `update-profile`
* `list-profiles`
* `delete-profile`
* `get-active-profile`
* `set-active-profile`

---

### 2. **AWS Resources Reader** 📦

**Prioridade:** ALTA

**Funcionalidades:**
* ✅ Leitura universal de todos os tipos de recursos AWS
* ✅ Suporte a paginação para grandes volumes
* ✅ Filtros por tags e atributos
* ✅ Suporte a múltiplas regiões
* ✅ Cache de resultados para performance

**Recursos Suportados:**
* EC2 (instâncias, volumes, snapshots, AMIs)
* S3 (buckets, objects)
* Lambda (functions, layers)
* VPC (subnets, route tables, NAT gateways)
* IAM (users, roles, policies)
* CloudFormation (stacks, changesets)
* ECS/EKS (clusters, services, tasks)
* RDS/DynamoDB (databases, tables)
* E muito mais...

**Implementação Técnica:**
* Criar factory de clientes AWS SDK v3
* Implementar padrão Repository para cada serviço
* Usar paginação automática do SDK
* Implementar cache com TTL configurável

**Tools MCP:**
* `list-resources` (universal)
* `describe-resource` (detalhes específicos)
* `search-resources` (busca com filtros)

---

### 3. **CloudWatch Logs Specialist** 📊

**Prioridade:** MÉDIA

**Funcionalidades:**
* ✅ Buscar logs com filtros avançados
* ✅ Suporte a regex e palavras-chave
* ✅ Filtro por timestamp
* ✅ Múltiplos log groups
* ✅ Streaming em tempo real
* ✅ Exportação de logs

**Implementação Técnica:**
* Usar `@aws-sdk/client-cloudwatch-logs`
* Implementar rate limiting para evitar throttling
* Suporte a CloudWatch Insights queries
* Buffer para streaming eficiente

**Tools MCP:**
* `search-logs`
* `tail-logs` (tempo real)
* `get-log-events`
* `run-insights-query`

---

### 4. **Container Clusters Specialist (ECS/EKS)** 🐳

**Prioridade:** MÉDIA

**Funcionalidades:**
* ✅ Listar clusters com status e métricas
* ✅ Obter tasks/pods em execução
* ✅ Logs de containers
* ✅ Health checks
* ✅ Operações de scaling

**Implementação Técnica:**
* Usar `@aws-sdk/client-ecs` e `@aws-sdk/client-eks`
* Para EKS, integrar com kubectl se disponível
* Métricas via CloudWatch
* Suporte a Fargate e EC2 launch types

**Tools MCP:**
* `list-ecs-clusters`
* `describe-ecs-cluster`
* `list-ecs-tasks`
* `get-task-logs`
* `list-eks-clusters`
* `describe-eks-cluster`
* `list-eks-nodes`

---

### 5. **AWS Account Data Specialist** 👤

**Prioridade:** BAIXA

**Funcionalidades:**
* ✅ Obter ID da conta
* ✅ Listar limites de serviços
* ✅ Consultar cotas atuais
* ✅ Verificar billing e custos
* ✅ Listar usuários IAM e roles

**Implementação Técnica:**
* Usar `@aws-sdk/client-sts` para identity
* `@aws-sdk/client-service-quotas` para limites
* `@aws-sdk/client-cost-explorer` para custos
* `@aws-sdk/client-iam` para IAM

**Tools MCP:**
* `get-account-info`
* `list-service-quotas`
* `get-cost-usage`
* `list-iam-users`
* `list-iam-roles`

---

### 6. **EC2 Instance Management Specialist** 💻

**Prioridade:** ALTA

**Funcionalidades:**
* ✅ Listar instâncias com status e métricas
* ✅ Criar bastion hosts seguros
* ✅ Gerenciar key pairs
* ✅ Configurar security groups
* ✅ Start/Stop/Reboot instâncias

**Implementação Técnica:**
* Usar `@aws-sdk/client-ec2`
* Template de bastion host com best practices
* Geração automática de key pairs
* Configuração segura de security groups

**Tools MCP:**
* `list-ec2-instances`
* `describe-instance`
* `create-bastion-host`
* `start-instance`
* `stop-instance`
* `create-key-pair`

---

### 7. **RDS Database Specialist** 🗄️

**Prioridade:** MÉDIA

**Funcionalidades:**
* ✅ Listar instâncias RDS
* ✅ Métricas de performance
* ✅ Gerenciar snapshots
* ✅ Monitorar conexões
* ✅ Verificar backups

**Implementação Técnica:**
* Usar `@aws-sdk/client-rds`
* Integração com CloudWatch para métricas
* Suporte a Aurora, MySQL, PostgreSQL, etc.

**Tools MCP:**
* `list-rds-instances`
* `describe-rds-instance`
* `get-rds-metrics`
* `list-rds-snapshots`
* `create-snapshot`

---

### 8. **DynamoDB Specialist** 🔄

**Prioridade:** MÉDIA

**Funcionalidades:**
* ✅ Listar tabelas
* ✅ Métricas de capacity
* ✅ Consultar índices
* ✅ Verificar streams
* ✅ Gerenciar backups

**Implementação Técnica:**
* Usar `@aws-sdk/client-dynamodb`
* Análise de throttling e hot partitions
* Recomendações de otimização

**Tools MCP:**
* `list-dynamodb-tables`
* `describe-table`
* `get-table-metrics`
* `list-global-indexes`
* `analyze-capacity`

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
mcp-aws-cli/
├── src/
│   ├── extension.ts              # Entry point da extensão VS Code
│   ├── server/
│   │   ├── index.ts              # MCP Server
│   │   ├── tools/                # Definição de tools MCP
│   │   │   ├── profile.tools.ts
│   │   │   ├── resources.tools.ts
│   │   │   ├── cloudwatch.tools.ts
│   │   │   ├── ecs-eks.tools.ts
│   │   │   ├── account.tools.ts
│   │   │   ├── ec2.tools.ts
│   │   │   ├── rds.tools.ts
│   │   │   └── dynamodb.tools.ts
│   │   └── handlers/             # Handlers de cada tool
│   │       ├── profile.handler.ts
│   │       ├── resources.handler.ts
│   │       ├── cloudwatch.handler.ts
│   │       ├── ecs-eks.handler.ts
│   │       ├── account.handler.ts
│   │       ├── ec2.handler.ts
│   │       ├── rds.handler.ts
│   │       └── dynamodb.handler.ts
│   ├── services/                 # Serviços AWS
│   │   ├── aws-client.factory.ts
│   │   ├── profile.service.ts
│   │   ├── ec2.service.ts
│   │   ├── rds.service.ts
│   │   ├── dynamodb.service.ts
│   │   ├── ecs.service.ts
│   │   ├── eks.service.ts
│   │   ├── cloudwatch.service.ts
│   │   └── sts.service.ts
│   ├── models/                   # TypeScript interfaces
│   │   ├── profile.ts
│   │   ├── aws-resource.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── config.ts
│   │   ├── cache.ts
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   └── types/
│       └── mcp.d.ts
├── resources/
│   └── templates/
│       └── bastion-host.json
├── package.json
├── tsconfig.json
├── .vscodeignore
├── README.md
└── CHANGELOG.md
```

---

## 📦 Dependências

### Dependências Principais

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "@aws-sdk/client-ec2": "^3.700.0",
    "@aws-sdk/client-rds": "^3.700.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/client-ecs": "^3.700.0",
    "@aws-sdk/client-eks": "^3.700.0",
    "@aws-sdk/client-cloudwatch-logs": "^3.700.0",
    "@aws-sdk/client-cloudwatch": "^3.700.0",
    "@aws-sdk/client-sts": "^3.700.0",
    "@aws-sdk/client-iam": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-lambda": "^3.700.0",
    "@aws-sdk/client-service-quotas": "^3.700.0",
    "@aws-sdk/client-cost-explorer": "^3.700.0",
    "node-cache": "^5.1.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^2.22.0",
    "typescript": "^5.3.3",
    "esbuild": "^0.19.11"
  }
}
```

---

## 🔧 Configuração da Extensão

### package.json - Extension Configuration

```json
{
  "name": "mcp-aws-cli",
  "displayName": "MCP AWS CLI Manager",
  "description": "AWS Management through Model Context Protocol",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "configuration": {
      "title": "MCP AWS CLI",
      "properties": {
        "mcpAwsCli.defaultRegion": {
          "type": "string",
          "default": "us-east-1",
          "description": "Default AWS region"
        },
        "mcpAwsCli.cacheTimeout": {
          "type": "number",
          "default": 300,
          "description": "Cache timeout in seconds"
        }
      }
    }
  }
}
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Fundação (Dia 1-2) ✅

* [x] Criar projeto no MCP ai-project-context
* [x] Registrar todas as features
* [x] Criar estrutura de diretórios
* [ ] Configurar package.json com todas as dependências
* [ ] Setup TypeScript com configuração otimizada
* [ ] Criar modelos e interfaces base
* [ ] Implementar sistema de logging

### Fase 2: Profile Management (Dia 2-3) 🔐

* [ ] Implementar ProfileService
* [ ] Criar handlers de profile tools
* [ ] Armazenamento seguro de credenciais
* [ ] Validação de credenciais com STS
* [ ] Testes unitários

### Fase 3: AWS Client Factory (Dia 3-4) 🏭

* [ ] Implementar factory de clientes AWS SDK v3
* [ ] Sistema de cache para clientes
* [ ] Configuração de retry e timeout
* [ ] Error handling centralizado
* [ ] Consultar documentação AWS SDK v3 via Context7

### Fase 4: Resources Reader (Dia 4-6) 📦

* [ ] Implementar serviços base (EC2, S3, Lambda)
* [ ] Sistema de paginação universal
* [ ] Filtros e busca
* [ ] Cache de resultados
* [ ] Testes de integração

### Fase 5: Specialists - Parte 1 (Dia 6-8) 🎯

* [ ] CloudWatch Logs Specialist
* [ ] EC2 Instance Management
* [ ] Bastion host creation
* [ ] Consultar docs CloudWatch via Context7

### Fase 6: Specialists - Parte 2 (Dia 8-10) 🎯

* [ ] ECS/EKS Specialist
* [ ] RDS Specialist
* [ ] DynamoDB Specialist
* [ ] Consultar docs ECS/EKS via Context7

### Fase 7: Account & Extras (Dia 10-11) 👤

* [ ] AWS Account Data Specialist
* [ ] Service Quotas
* [ ] Cost Explorer
* [ ] IAM management

### Fase 8: VS Code Extension (Dia 11-12) 📦

* [ ] Implementar extension.ts
* [ ] Configurar activation events
* [ ] Registrar MCP server
* [ ] WebView para UI (opcional)
* [ ] Commands e shortcuts

### Fase 9: Testing & Documentation (Dia 12-13) 🧪

* [ ] Testes unitários completos
* [ ] Testes de integração
* [ ] Documentação de cada tool
* [ ] README.md detalhado
* [ ] CHANGELOG.md

### Fase 10: Build & Publish (Dia 13-14) 🚀

* [ ] Build otimizado com esbuild
* [ ] Configurar .vscodeignore
* [ ] Gerar .vsix package
* [ ] Testar instalação local
* [ ] Publicar no VS Code Marketplace
* [ ] Criar release no GitHub

---

## 🎨 Padrões de Código

### Clean Architecture

* **Services Layer:** Lógica de negócio e integração com AWS
* **Handlers Layer:** Processamento de requests MCP
* **Tools Layer:** Definição de tools do protocolo MCP
* **Models Layer:** Interfaces e tipos TypeScript

### SOLID Principles

* **Single Responsibility:** Cada serviço gerencia um SDK específico
* **Open/Closed:** Extensível via factory pattern
* **Liskov Substitution:** Interfaces comuns para todos os serviços
* **Interface Segregation:** Tools específicos e focados
* **Dependency Inversion:** Injeção de dependências via factory

### Error Handling

```typescript
class AWSServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AWSServiceError';
  }
}
```

---

## 📚 Referências e Documentação

### AWS SDK v3 - Sempre Consultar via Context7 MCP

**Comando para consultar documentação:**

```
Use Context7 MCP tool: get-library-docs
Library ID: /aws/aws-sdk-js-v3
```

**Principais Módulos:**
* `@aws-sdk/client-ec2` - EC2 operations
* `@aws-sdk/client-ecs` - ECS operations
* `@aws-sdk/client-eks` - EKS operations
* `@aws-sdk/client-rds` - RDS operations
* `@aws-sdk/client-dynamodb` - DynamoDB operations
* `@aws-sdk/client-cloudwatch-logs` - CloudWatch Logs
* `@aws-sdk/client-sts` - Security Token Service

### Model Context Protocol

* Documentação: https://modelcontextprotocol.io/
* SDK: `@modelcontextprotocol/sdk`

### VS Code Extension API

* Extension Guide: https://code.visualstudio.com/api

---

## ✅ Checklist de Qualidade

### Antes de Compilar

* [ ] Todos os tipos TypeScript definidos
* [ ] Sem `any` types (usar `unknown` quando necessário)
* [ ] Error handling em todas as funções async
* [ ] Logging apropriado em operações críticas
* [ ] Validação de inputs
* [ ] Documentação JSDoc em funções públicas

### Antes de Publicar

* [ ] Testes unitários passando
* [ ] Testes de integração com AWS
* [ ] README.md completo
* [ ] CHANGELOG.md atualizado
* [ ] Versão atualizada no package.json
* [ ] .vscodeignore configurado
* [ ] Build otimizado e minificado
* [ ] Testar instalação .vsix localmente

---

## 🎯 Critérios de Sucesso

01. ✅ Extensão instalável via .vsix
02. ✅ MCP server ativo e responsivo
03. ✅ Todas as 8 features implementadas
04. ✅ Tools MCP funcionais e testados
05. ✅ Integração com AWS SDK v3
06. ✅ Error handling robusto
07. ✅ Documentação completa
08. ✅ Performance otimizada
09. ✅ Segurança de credenciais
10. ✅ Publicação no Marketplace

---

## 📝 Notas Importantes

### Segurança

* **NUNCA** logar credenciais AWS
* Usar AWS SDK credential chain
* Suportar IAM roles e instance profiles
* Validar inputs para prevenir injection

### Performance

* Implementar cache inteligente
* Usar paginação para grandes datasets
* Rate limiting para evitar throttling
* Connection pooling para clientes AWS

### Compatibilidade

* VS Code 1.85.0+
* Node.js 18+
* AWS SDK v3.700+
* Suportar Windows, macOS e Linux

---

## 🎓 Exemplo de Uso

```typescript
// Exemplo de uso da extensão via MCP

// 1. Listar profiles
await mcpClient.callTool("list-profiles");

// 2. Definir profile ativo
await mcpClient.callTool("set-active-profile", {
  profileName: "production"
});

// 3. Listar instâncias EC2
await mcpClient.callTool("list-ec2-instances", {
  region: "us-east-1",
  filters: {
    state: "running"
  }
});

// 4. Buscar logs no CloudWatch
await mcpClient.callTool("search-logs", {
  logGroup: "/aws/lambda/my-function",
  startTime: "2026-01-15T00:00:00Z",
  keyword: "ERROR"
});

// 5. Criar bastion host
await mcpClient.callTool("create-bastion-host", {
  vpcId: "vpc-12345",
  subnetId: "subnet-67890",
  keyName: "my-key"
});
```

---

## 📞 Próximos Passos

01. ✅ **Revisar e aprovar o plano**
02. ⏳ **Iniciar Fase 1: Fundação**
03. ⏳ **Consultar Context7 para docs AWS SDK v3**
04. ⏳ **Implementar Profile Management**
05. ⏳ **Continuar conforme roadmap**

---

**Documento criado em:** 16/01/2026  
**Última atualização:** 16/01/2026  
**Status:** 📋 Planejamento Completo - Pronto para Implementação
