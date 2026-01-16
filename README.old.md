# AWS AI Toolkit

> **🚀 Manage your AWS infrastructure through AI** - A Model Context Protocol (MCP) server that brings AWS management to GitHub Copilot Chat with 12 unified tools.

[![Version](https://img.shields.io/visual-studio-marketplace/v/GleidsonFerSanP.aws-ai-toolkit)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/GleidsonFerSanP.aws-ai-toolkit)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/GleidsonFerSanP.aws-ai-toolkit)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)

## 🎯 What is AWS AI Toolkit?

**AWS AI Toolkit** enables **GitHub Copilot Chat** to manage AWS resources naturally through conversation. Simply chat with Copilot to list instances, check logs, monitor costs, or control your infrastructure—no CLI commands needed!

**Built on MCP (Model Context Protocol)** - The emerging standard for connecting AI assistants to external tools and data sources.

### ✨ Zero Configuration Required

* ✅ **Auto-loads on VS Code startup** - Ready immediately after installation
* ✅ **No config files** - Works out of the box with GitHub Copilot
* ✅ **Built-in MCP server** - No external processes needed
* ✅ **Secure by design** - Uses your AWS profiles and credentials

## 🚀 Quick Start

### Prerequisites
- **VS Code** 1.85.0 or higher
- **GitHub Copilot Chat** extension
- AWS CLI configured with profiles (or AWS credentials)

### Installation

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)
2. Reload VS Code (the MCP server starts automatically)
3. Open **GitHub Copilot Chat**
4. Start managing AWS! Try: *"List my EC2 instances in us-east-1"*

## 💬 Example Conversations

Ask Copilot naturally:
* **Cost Management**: Obtenha custos, forecasts, e billing data
* **Account Info**: Identity, regiões, quotas, contact info
* **Secrets Management**: AWS Secrets Manager e SSM Parameter Store
* **Containers**: Gerenciamento completo de ECS e EKS

## 📦 Instalação

### ⚠️ Importante: Atualizando de v1.0 para v2.0

Se você já tinha a versão 1.0.0 instalada (com 73 tools), **deve fazer uma reinstalação completa**:


```plaintext
👤 "List my EC2 instances in us-east-1"
🤖 [Shows all instances with status, IPs, and tags]

👤 "What's the CPU usage of instance i-abc123 for the last hour?"
🤖 [Retrieves CloudWatch metrics and displays graph]

👤 "Show me RDS databases that cost more than $100/month"
🤖 [Analyzes costs and lists expensive databases]

👤 "Tail logs from my API Lambda function"
🤖 [Streams real-time CloudWatch logs]

👤 "Create a new profile for production with these credentials..."
🤖 [Securely stores AWS profile]
```

## 🛠️ 12 Unified Tools

**Why only 12 tools?**

Version 1.0 had **73 specific tools** (one per AWS operation). We discovered that:
* GitHub Copilot has **performance degradation** with **>128 MCP tools**
* With 73 tools: slow selection (3-5s), sometimes picked wrong tool
* **Solution:** Refactor to **12 generic unified tools**

**Result:**
* ✅ **83% fewer tools** (73 → 12)
* ✅ **60% faster** (1-2s response time)
* ✅ **+15% accuracy** in tool selection
* ✅ Coverage of **200+ AWS operations** with just 12 tools

### Available Tools

| Tool | Description | Examples |
|------|-------------|----------|
| **aws-manage-profiles** | Manage AWS credential profiles | Create, list, activate, validate |
| **aws-list-resources** | List any AWS resources | EC2, RDS, DynamoDB, S3, Lambda, ECS, EKS |
| **aws-describe-resource** | Get detailed resource info | Instance details, table schema, cluster config |
| **aws-execute-action** | Perform actions on resources | Start, stop, reboot, terminate, create, delete |
| **aws-query-database** | Query databases | DynamoDB query/scan, RDS SQL execution |
| **aws-logs-operations** | CloudWatch Logs | Search, filter, tail, Insights queries |
| **aws-get-metrics** | CloudWatch Metrics | CPU, memory, network, custom metrics |
| **aws-search-resources** | Resource discovery | Search by tags, service, ARN, summaries |
| **aws-get-costs** | Cost Explorer | Historical costs, forecasts, by service/region |
| **aws-account-info** | Account information | Identity, regions, quotas, limits |
| **aws-manage-secrets** | Secrets management | Secrets Manager + Parameter Store |
| **aws-container-operations** | Container management | ECS/EKS clusters, services, tasks |

## 📦 Supported AWS Services

<details>
<summary><b>Compute (4 services)</b></summary>

- **EC2**: Instances, key pairs, security groups
- **Lambda**: Functions, invocations
- **ECS**: Clusters, services, tasks, task definitions
- **EKS**: Clusters, node groups, addons
</details>

<details>
<summary><b>Database (3 services)</b></summary>

- **DynamoDB**: Tables, queries, scans, backups, global tables, TTL
- **RDS**: Instances, clusters, snapshots, SQL execution
- **RDS Data API**: Serverless SQL queries
</details>

<details>
<summary><b>Storage & Content (1 service)</b></summary>

- **S3**: Buckets, objects
</details>

<details>
<summary><b>Monitoring & Logging (2 services)</b></summary>

- **CloudWatch Logs**: Log groups, streams, events, Insights queries
- **CloudWatch Metrics**: Standard and custom metrics
</details>

<details>
<summary><b>Management & Cost (3 services)</b></summary>

- **Cost Explorer**: Cost analysis, forecasts
- **Service Quotas**: Quota limits and management
- **Resource Groups Tagging API**: Resource discovery
</details>

<details>
<summary><b>Security (2 services)</b></summary>

- **Secrets Manager**: Secret storage and rotation
- **Systems Manager Parameter Store**: Parameter management
</details>

## ⚙️ Configuration

### AWS Credentials

Use AWS CLI profiles or environment variables:
# Opção 1: AWS CLI
aws configure

# Opção 2: Via GitHub Copilot Chat (dentro do VS Code)
# Pergunte: "Como configuro minhas credenciais AWS?"
# O Copilot irá guiar você usando as ferramentas MCP
```

### 2. Criar Profile AWS (via Copilot)

No **GitHub Copilot Chat**, você pode criar profiles diretamente:

```
Crie um profile AWS chamado 'dev' com:
- Region: us-east-1
- Access Key: AKIA...
- Secret: ...
- Environment: development
```

O Copilot usará a tool `aws-manage-profiles` automaticamente!

## 🎮 Uso

### Usando com GitHub Copilot Chat

Após instalar a extensão, o GitHub Copilot automaticamente terá acesso às ferramentas MCP. Basta conversar naturalmente:

**Exemplos de Conversação:**

```
👤: Liste minhas instâncias EC2 na região us-east-1

🤖: [Copilot usa aws-list-resources automaticamente]
    Aqui estão suas instâncias EC2...

👤: Mostre logs do grupo /aws/lambda/my-function das últimas 2 horas

🤖: [Copilot usa aws-logs-operations automaticamente]
    Aqui estão os logs...

👤: Quais tabelas DynamoDB tenho?

🤖: [Copilot usa aws-list-resources com resourceType: dynamodb-tables]
    Você tem 5 tabelas...

👤: Start instance i-1234567890abcdef0

🤖: [Copilot usa aws-execute-action]
    ✅ Instância iniciada com sucesso!
```

### Comandos da Extensão

Acesse via Command Palette ( `Cmd+Shift+P` / `Ctrl+Shift+P` ):

* **MCP AWS CLI: Show Logs** - Ver logs do servidor MCP
* **MCP AWS CLI: Clear Cache** - Limpar cache de recursos
* **MCP AWS CLI: Reload Configuration** - Recarregar configurações
* **MCP AWS CLI: Show Server Info** - Informações do servidor

### Como NÃO É Necessário (Arquitetura Antiga)

~~Você NÃO precisa editar `claude_desktop_config.json` :~~

```json
// ❌ NÃO NECESSÁRIO - A extensão faz isso automaticamente!
{
  "mcpServers": {
    "aws-cli": {
      "command": "node",
      "args": ["/caminho/para/mcp-aws-cli/dist/index.js"]
    }
  }
}
```

✅ **Com a extensão**: O servidor é registrado automaticamente via `vscode.lm.registerMcpServerDefinitionProvider()`

## Ferramentas Disponíveis

### aws_cli_execute

Execute comandos AWS CLI arbitrários de forma segura.

**Parâmetros:**
* `command` (string, obrigatório): O comando AWS CLI para executar (ex: "ec2 describe-instances")
* `region` (string, opcional): Região AWS específica
* `profile` (string, opcional): Perfil AWS específico

### aws_s3_list_buckets

Liste todos os buckets S3 na conta.

### aws_s3_list_objects

Liste objetos em um bucket S3 específico.

**Parâmetros:**
* `bucket` (string, obrigatório): Nome do bucket
* `prefix` (string, opcional): Filtro de prefixo

### aws_ec2_describe_instances

Liste e descreva instâncias EC2.

**Parâmetros:**
* `region` (string, opcional): Região AWS
* `instanceIds` (array, opcional): IDs de instâncias específicas

### aws_lambda_list_functions

Liste todas as funções Lambda.

**Parâmetros:**
* `region` (string, opcional): Região AWS

### aws_lambda_invoke

Invoque uma função Lambda.

**Parâmetros:**
* `functionName` (string, obrigatório): Nome da função
* `payload` (string, opcional): Payload JSON
* `region` (string, opcional): Região AWS

### aws_cloudwatch_get_log_groups

Liste grupos de logs do CloudWatch.

**Parâmetros:**
* `region` (string, opcional): Região AWS
* `prefix` (string, opcional): Filtro de prefixo para grupos de log

### aws_cloudwatch_get_log_events

Obtenha eventos de log de um grupo e stream do CloudWatch.

**Parâmetros:**
* `logGroup` (string, obrigatório): Nome do grupo de log
* `logStream` (string, obrigatório): Nome do stream de log
* `region` (string, opcional): Região AWS
* `limit` (number, opcional): Número máximo de eventos (padrão: 100)

### aws_cloudwatch_list_metrics

Liste métricas do CloudWatch.

**Parâmetros:**
* `namespace` (string, opcional): Namespace da métrica (ex: 'AWS/EC2', 'AWS/Lambda')
* `region` (string, opcional): Região AWS

### aws_ecs_list_clusters

Liste clusters do ECS.

**Parâmetros:**
* `region` (string, opcional): Região AWS

### aws_ecs_list_services

Liste serviços em um cluster ECS.

**Parâmetros:**
* `cluster` (string, obrigatório): Nome ou ARN do cluster ECS
* `region` (string, opcional): Região AWS

### aws_ecs_list_tasks

Liste tarefas em um cluster ECS.

**Parâmetros:**
* `cluster` (string, obrigatório): Nome ou ARN do cluster ECS
* `serviceName` (string, opcional): Filtrar por nome do serviço
* `region` (string, opcional): Região AWS

### aws_ecs_describe_tasks

Descreva tarefas ECS com informações detalhadas.

**Parâmetros:**
* `cluster` (string, obrigatório): Nome ou ARN do cluster ECS
* `tasks` (array, obrigatório): Array de IDs ou ARNs de tarefas
* `region` (string, opcional): Região AWS

### aws_sns_list_topics

Liste tópicos SNS.

**Parâmetros:**
* `region` (string, opcional): Região AWS

### aws_sns_publish

Publique uma mensagem em um tópico SNS.

**Parâmetros:**
* `topicArn` (string, obrigatório): ARN do tópico SNS
* `message` (string, obrigatório): Mensagem a publicar
* `subject` (string, opcional): Assunto da mensagem
* `region` (string, opcional): Região AWS

### aws_sqs_list_queues

Liste filas SQS.

**Parâmetros:**
* `prefix` (string, opcional): Filtro de prefixo para filas
* `region` (string, opcional): Região AWS

### aws_sqs_send_message

Envie uma mensagem para uma fila SQS.

**Parâmetros:**
* `queueUrl` (string, obrigatório): URL da fila SQS
* `messageBody` (string, obrigatório): Corpo da mensagem
* `region` (string, opcional): Região AWS

### aws_sqs_receive_messages

Receba mensagens de uma fila SQS.

**Parâmetros:**
* `queueUrl` (string, obrigatório): URL da fila SQS
* `maxMessages` (number, opcional): Número máximo de mensagens (1-10, padrão: 1)
* `waitTimeSeconds` (number, opcional): Tempo de espera em segundos (0-20)
* `region` (string, opcional): Região AWS

### aws_sqs_delete_message

Delete uma mensagem de uma fila SQS.

**Parâmetros:**
* `queueUrl` (string, obrigatório): URL da fila SQS
* `receiptHandle` (string, obrigatório): Receipt handle da mensagem
* `region` (string, opcional): Região AWS

### aws_ssm_get_parameter

Obtenha um parâmetro do AWS Systems Manager Parameter Store.

**Parâmetros:**
* `name` (string, obrigatório): Nome do parâmetro (ex: '/myapp/database/password')
* `withDecryption` (boolean, opcional): Descriptografar parâmetros SecureString (padrão: true)
* `region` (string, opcional): Região AWS

### aws_ssm_get_parameters

Obtenha múltiplos parâmetros do Parameter Store.

**Parâmetros:**
* `names` (array, obrigatório): Array de nomes de parâmetros
* `withDecryption` (boolean, opcional): Descriptografar parâmetros SecureString (padrão: true)
* `region` (string, opcional): Região AWS

### aws_ssm_get_parameters_by_path

Obtenha todos os parâmetros sob um caminho específico no Parameter Store.

**Parâmetros:**
* `path` (string, obrigatório): Caminho do parâmetro (ex: '/myapp/database/')
* `recursive` (boolean, opcional): Obter todos os parâmetros na hierarquia (padrão: false)
* `withDecryption` (boolean, opcional): Descriptografar parâmetros SecureString (padrão: true)
* `region` (string, opcional): Região AWS

### aws_ssm_put_parameter

Crie ou atualize um parâmetro no Parameter Store.

**Parâmetros:**
* `name` (string, obrigatório): Nome do parâmetro
* `value` (string, obrigatório): Valor do parâmetro
* `type` (string, opcional): Tipo do parâmetro: 'String', 'StringList', ou 'SecureString' (padrão: 'String')
* `overwrite` (boolean, opcional): Sobrescrever parâmetro existente (padrão: false)
* `region` (string, opcional): Região AWS

### aws_ssm_delete_parameter

Delete um parâmetro do Parameter Store.

**Parâmetros:**
* `name` (string, obrigatório): Nome do parâmetro a deletar
* `region` (string, opcional): Região AWS

### aws_secretsmanager_get_secret

Obtenha um valor de secret do AWS Secrets Manager.

**Parâmetros:**
* `secretId` (string, obrigatório): Nome ou ARN do secret
* `versionId` (string, opcional): ID da versão do secret
* `versionStage` (string, opcional): Estágio da versão (ex: 'AWSCURRENT', 'AWSPENDING')
* `region` (string, opcional): Região AWS

### aws_secretsmanager_list_secrets

Liste todos os secrets no AWS Secrets Manager.

**Parâmetros:**
* `region` (string, opcional): Região AWS

### aws_secretsmanager_create_secret

Crie um novo secret no AWS Secrets Manager.

**Parâmetros:**
* `name` (string, obrigatório): Nome do secret
* `secretString` (string, obrigatório): Valor do secret (como string ou JSON)
* `description` (string, opcional): Descrição do secret
* `region` (string, opcional): Região AWS

### aws_secretsmanager_update_secret

Atualize o valor de um secret existente no AWS Secrets Manager.

**Parâmetros:**
* `secretId` (string, obrigatório): Nome ou ARN do secret
* `secretString` (string, obrigatório): Novo valor do secret (como string ou JSON)
* `region` (string, opcional): Região AWS

### aws_secretsmanager_delete_secret

Delete um secret do AWS Secrets Manager.

**Parâmetros:**
* `secretId` (string, obrigatório): Nome ou ARN do secret
* `recoveryWindowInDays` (number, opcional): Número de dias antes da exclusão permanente (7-30, padrão: 30)
* `forceDeleteWithoutRecovery` (boolean, opcional): Deletar imediatamente sem janela de recuperação (padrão: false)
* `region` (string, opcional): Região AWS

## Exemplos

Através do Claude, você pode fazer perguntas como:

* "Liste todas as minhas instâncias EC2"
* "Mostre os buckets S3 disponíveis"
* "Liste as funções Lambda na região us-east-1"
* "Descreva a instância EC2 i-1234567890abcdef0"
* "Liste os objetos no bucket meu-bucket"
* "Mostre os logs do CloudWatch do grupo /aws/lambda/my-function"
* "Liste os clusters ECS"
* "Mostre as tarefas rodando no cluster meu-cluster"
* "Liste os tópicos SNS"
* "Envie uma mensagem para a fila SQS"
* "Receba mensagens da fila minha-fila"
* "Obtenha o parâmetro /myapp/database/url do Parameter Store"
* "Liste todos os parâmetros do caminho /myapp/"
* "Mostre o secret database-credentials do Secrets Manager"
* "Liste todos os secrets disponíveis"

## Segurança

### Profile Management Safety

✅ **Error-Safe Initialization**: O servidor MCP carrega com sucesso mesmo sem perfis configurados.

✅ **Graceful Degradation**: Ferramentas retornam mensagens de erro úteis quando não há perfis:

```json
{
  "success": false,
  "error": {
    "message": "No AWS profile configured. Please create a profile first using 'create-profile' tool."
  }
}
```

✅ **User Guidance**: Mensagens de erro incluem instruções claras sobre como criar perfis.

### Credential Storage

**⚠️ IMPORTANTE**: Credenciais são armazenadas em texto plano em `~/.mcp-aws-cli/profiles.json`

**Recomendações**:
* Use perfis com permissões mínimas necessárias (princípio do menor privilégio)
* Considere usar IAM roles em ambientes de produção
* Rotacione credentials regularmente
* Nunca commite o arquivo profiles.json no controle de versão

### Best Practices

* ✅ Todos os comandos são executados com as credenciais AWS configuradas localmente
* ✅ Comandos destrutivos requerem parâmetros explícitos
* ✅ Recomenda-se usar perfis AWS com permissões limitadas
* ✅ Sistema nunca expõe credenciais em logs ou mensagens de erro
* ✅ Cada operação registra apenas metadados (região, perfil usado, timestamps)

### Error Handling

O sistema implementa tratamento de erros em camadas:
1. **Profile Service**: Validação de credenciais e perfis
2. **Service Layer**: Try-catch em todas operações AWS
3. **Handler Layer**: Conversão de erros para respostas MCP padronizadas
4. **MCP Protocol**: Retorno de erros sem crashar o servidor

## Licença

MIT
