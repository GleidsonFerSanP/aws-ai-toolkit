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

* **VS Code** 1.85.0 or higher
* **GitHub Copilot Chat** extension
* AWS CLI configured with profiles (or AWS credentials)

### Installation

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)
2. Reload VS Code (the MCP server starts automatically)
3. Open **GitHub Copilot Chat**
4. Start managing AWS! Try: *"List my EC2 instances in us-east-1"*

## 💬 Example Conversations

Ask Copilot naturally:

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

* **EC2**: Instances, key pairs, security groups
* **Lambda**: Functions, invocations
* **ECS**: Clusters, services, tasks, task definitions
* **EKS**: Clusters, node groups, addons
</details>

<details>
<summary><b>Database (3 services)</b></summary>

* **DynamoDB**: Tables, queries, scans, backups, global tables, TTL
* **RDS**: Instances, clusters, snapshots, SQL execution
* **RDS Data API**: Serverless SQL queries
</details>

<details>
<summary><b>Storage & Content (1 service)</b></summary>

* **S3**: Buckets, objects
</details>

<details>
<summary><b>Monitoring & Logging (2 services)</b></summary>

* **CloudWatch Logs**: Log groups, streams, events, Insights queries
* **CloudWatch Metrics**: Standard and custom metrics
</details>

<details>
<summary><b>Management & Cost (3 services)</b></summary>

* **Cost Explorer**: Cost analysis, forecasts
* **Service Quotas**: Quota limits and management
* **Resource Groups Tagging API**: Resource discovery
</details>

<details>
<summary><b>Security (2 services)</b></summary>

* **Secrets Manager**: Secret storage and rotation
* **Systems Manager Parameter Store**: Parameter management
</details>

## ⚙️ Configuration

### AWS Credentials

**🔐 Intelligent Credential Discovery**

The extension automatically finds your AWS credentials using multiple methods (in order of priority):

1. **MCP Profiles** - Profiles you create via GitHub Copilot Chat
2. **Environment Variables** - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
3. **AWS CLI** - `~/.aws/credentials` and `~/.aws/config` files
4. **AWS SSO** - AWS Single Sign-On configurations
5. **Process Credentials** - Credential process configurations
6. **AWS SDK Default Chain** - EC2/ECS instance metadata

**No configuration needed** if you have AWS CLI or credentials already set up!

#### Option 1: Use Existing AWS CLI Credentials (Recommended)

If you have AWS CLI configured, the extension works automatically:

```bash
# Check if you have AWS CLI configured
aws sts get-caller-identity

# If not, configure AWS CLI
aws configure
```

#### Option 2: Create Profile via GitHub Copilot

Ask Copilot in chat:
```
"Create an AWS profile named 'production' with my credentials"
```

Copilot will use the `aws-manage-profiles` tool to securely store your credentials.

#### Option 3: Use Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"
```

**Need credentials?** Get them from:
* AWS Console → IAM → Users → Your User → Security Credentials → Create Access Key
* Your AWS administrator

### Extension Settings

Configure in VS Code settings ( `Cmd+,` or `Ctrl+,` ):

```json
{
  "mcpAwsCli.defaultRegion": "us-east-1",
  "mcpAwsCli.cacheTimeout": 300,
  "mcpAwsCli.maxRetries": 3,
  "mcpAwsCli.enableDebugLogs": false
}
```

### VS Code Commands

Access via Command Palette ( `Cmd+Shift+P` / `Ctrl+Shift+P` ):

* **MCP AWS CLI: Show Logs** - View extension logs
* **MCP AWS CLI: Clear Cache** - Clear cached AWS data
* **MCP AWS CLI: Reload Configuration** - Reload settings
* **MCP AWS CLI: Show Server Info** - Display server status and stats

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           GitHub Copilot Chat                   │
│  (Natural language AWS management interface)    │
└────────────────┬────────────────────────────────┘
                 │ MCP Protocol
┌────────────────▼────────────────────────────────┐
│       AWS AI Toolkit Extension                  │
│  ┌─────────────────────────────────────────┐   │
│  │  Built-in MCP Server (./dist/index.js)  │   │
│  │  • 12 Unified Tools                      │   │
│  │  • Auto-registration                     │   │
│  │  • Zero configuration                    │   │
│  └──────────┬──────────────────────────────┘   │
└─────────────┼──────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────┐
│           AWS SDK v3 Clients                    │
│  EC2 • RDS • DynamoDB • Lambda • ECS • EKS     │
│  S3 • CloudWatch • Cost Explorer • Secrets...  │
└────────────────────────────────────────────────┘
```

## 🔒 Security

* ✅ **No credentials stored** - Uses your local AWS profiles
* ✅ **Read-only by default** - Write operations require explicit confirmation
* ✅ **Open source** - Review the code on [GitHub](https://github.com/GleidsonFerSanP/mcp-aws-cli)
* ✅ **No telemetry** - Your data stays on your machine

## 📊 Performance

Optimized for speed and accuracy:

| Metric | v1.0 (73 tools) | v2.0 (12 tools) | Improvement |
|--------|-----------------|-----------------|-------------|
| Tool count | 73 | 12 | **83% reduction** |
| Response time | 3-5s | 1-2s | **60% faster** |
| Tool accuracy | ~75% | ~90% | **+15% better** |
| AWS operations | 200+ | 200+ | Same coverage |

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

* [GitHub Repository](https://github.com/GleidsonFerSanP/mcp-aws-cli)
* [Issue Tracker](https://github.com/GleidsonFerSanP/mcp-aws-cli/issues)
* [Changelog](./CHANGELOG.md)
* [Model Context Protocol](https://modelcontextprotocol.io)

## ⭐ Support

If you find this extension useful, please:
* ⭐ Star the [GitHub repository](https://github.com/GleidsonFerSanP/mcp-aws-cli)
* 📝 Rate on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.aws-ai-toolkit)
* 🐛 Report issues or suggest features

---

**Made with ❤️ by [GleidsonFerSanP](https://github.com/GleidsonFerSanP)** | Powered by MCP & AWS SDK v3
