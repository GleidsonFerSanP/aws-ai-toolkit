# Arquitetura: VS Code Extension com MCP Embutido

## 📋 Visão Geral

O **MCP AWS CLI** é uma **extensão do VS Code** que embute um **servidor MCP (Model Context Protocol)** para prover ferramentas AWS ao **GitHub Copilot** durante conversações.

## 🏗️ Arquitetura da Extensão

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│              VS Code Extension                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │         extension.ts (Entry Point)                │  │
│  │  - Ativa em onStartupFinished                     │  │
│  │  - Registra MCP Server Definition Provider        │  │
│  │  - Aponta para ./dist/index.js (built-in)        │  │
│  └───────────────┬───────────────────────────────────┘  │
│                  │                                        │
│                  │ Registra                               │
│                  ↓                                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │    MCP Server (index.ts → dist/index.js)         │  │
│  │  - 12 ferramentas unificadas                      │  │
│  │  - Handlers especializados                        │  │
│  │  - Serviços AWS SDK v3                            │  │
│  └───────────────┬───────────────────────────────────┘  │
│                  │                                        │
└──────────────────┼────────────────────────────────────────┘
                   │
                   │ Expõe tools via MCP Protocol
                   ↓
         ┌─────────────────────────┐
         │   GitHub Copilot Chat   │
         │  - Consome MCP tools    │
         │  - Executa operações AWS│
         └─────────────────────────┘
```

## 🔧 Registro Automático

### 1. **Ativação Automática**

```json
// package.json
{
  "activationEvents": [
    "onStartupFinished"  // ✅ Carrega automaticamente quando VS Code inicia
  ],
  "main": "./dist/extension.js"
}
```

### 2. **MCP Server Definition Provider**

```typescript
// src/extension.ts
context.subscriptions.push(
  vscode.lm.registerMcpServerDefinitionProvider('mcp-aws-cli', {
    provideMcpServerDefinitions() {
      return [
        new vscode.McpStdioServerDefinition(
          'mcp-aws-cli',
          'node',
          [mcpServerPath]  // ✅ Aponta para ./dist/index.js (built-in)
        )
      ];
    }
  })
);
```

### 3. **Caminho Built-in**

```typescript
// O servidor MCP usa código DENTRO da extensão (não externo)
const mcpServerPath = path.join(
  context.extensionPath,  // Diretório da extensão instalada
  'dist',
  'index.js'              // Código compilado
);
```

**Características:**
* ✅ **Não requer configuração manual** do usuário
* ✅ **Sem paths externos** - tudo está no bundle da extensão
* ✅ **Instalação única** - instalar extensão = servidor MCP disponível
* ✅ **Versionamento integrado** - extensão e servidor sempre em sync

## 🎯 Fluxo de Uso

### Instalação

1. Usuário instala extensão `mcp-aws-cli` no VS Code
2. Extensão ativa automaticamente em `onStartupFinished`
3. MCP Server é registrado via `registerMcpServerDefinitionProvider`
4. GitHub Copilot detecta o servidor MCP disponível

### Durante Conversação

1. Usuário pergunta algo sobre AWS no Copilot Chat
2. Copilot identifica que pode usar ferramentas MCP
3. Copilot chama tool MCP (ex: `aws-list-resources`)
4. MCP Server executa handler correspondente
5. Handler usa serviços AWS SDK v3
6. Resultado é retornado ao Copilot
7. Copilot apresenta resposta ao usuário

## 📦 Estrutura de Distribuição

```
mcp-aws-cli-2.0.0.vsix
├── package.json                    # Metadados e contribuições
├── dist/
│   ├── extension.js               # ✅ Entry point da extensão
│   ├── index.js                   # ✅ Servidor MCP (usado pelo Copilot)
│   ├── handlers/                  # Handlers MCP
│   ├── services/                  # AWS SDK services
│   ├── tools/                     # Tool definitions
│   └── utils/                     # Utilitários
└── README.md
```

## 🔐 Segurança

### Isolamento

* O servidor MCP roda **dentro do processo da extensão**
* **Não expõe porta de rede** - comunicação via stdio
* Credenciais AWS armazenadas localmente com permissões restritas

### Validação

* Profile service valida credenciais antes de armazenar
* Error-safe initialization: servidor nunca crasheapor falta de profiles
* Logs detalhados para auditoria

## ⚡ Performance

### Arquitetura Unificada: 12 Tools ao invés de 73

**Problema Original (V1.0):**
* Implementação inicial tinha **73 ferramentas MCP específicas** (1 tool = 1 operação AWS)
* GitHub Copilot apresentava **degradação de performance** com esse número de tools
* Limitação conhecida: **>128 tools causam lentidão significativa** no Copilot
* Tempo de seleção: 3-5 segundos
* Precisão: ~85% (às vezes escolhia tool errada)

**Solução (V2.0 - Atual):**
* Refatorado para **12 ferramentas unificadas genéricas** ✅
* Redução de **83%** no número de tools
* Tempo de seleção: 1-2 segundos (**60% mais rápido**)
* Precisão: ~98% (**+15% melhoria**)

**Exemplo de Unificação:**

```typescript
// ANTES (V1.0): 6 tools separadas
list-ec2-instances
describe-ec2-instance  
start-ec2-instances
stop-ec2-instances
reboot-ec2-instances
terminate-ec2-instances

// DEPOIS (V2.0): 2 tools unificadas
aws-list-resources { resourceType: 'ec2-instances' }
aws-execute-action { action: 'start|stop|reboot|terminate', resourceType: 'ec2-instances' }
```

**Resultado:** Cobertura de ~200+ operações AWS com apenas 12 tools MCP. Escalável e performático.

📄 **Documentação completa:** [ADR-004: Unified Tools Decision](./unified-tools-decision.md)

### Otimizações

* **12 tools unificadas** (não 73 específicas)
* Cache configurável (padrão: 300s)
* Paginação automática para grandes volumes
* Handlers especializados por tipo de operação

### Recursos

* Ativação lazy: só ativa quando VS Code inicia (não em cada janela)
* Comandos on-demand: cache clearing, config reload, logs
* Profile system: evita re-autenticação constante

## 🎨 UX

### Feedback Visual

```typescript
vscode.window.showInformationMessage(
  `MCP AWS CLI: ${unifiedTools.length} unified tools available for GitHub Copilot Chat! ✨`
);
```

### Comandos Disponíveis

* `MCP AWS CLI: Show Logs` - Ver logs do servidor
* `MCP AWS CLI: Clear Cache` - Limpar cache de recursos
* `MCP AWS CLI: Reload Configuration` - Recarregar config
* `MCP AWS CLI: Show Server Info` - Info do servidor

## 📚 Comparação: Standalone vs Extension

| Aspecto | Standalone MCP Server | VS Code Extension (atual) |
|---------|----------------------|---------------------------|
| Instalação | Manual, config JSON | Automática via marketplace |
| Path | Externo, hardcoded | Built-in, relativo |
| Ativação | Manual | Automática |
| Updates | Manual | Via VS Code updates |
| Configuração | `~/.config/` | VS Code settings |
| Logs | File system | Output channel |
| UX | CLI only | Visual + commands |

## 🚀 Vantagens da Arquitetura Atual

1. **Zero-config**: Instala e funciona
2. **Manutenibilidade**: Um pacote, um versionamento
3. **Distribuição**: VS Code Marketplace
4. **Segurança**: Sem exposição de rede
5. **Performance**: Processo único, shared memory
6. **UX**: Integração nativa com VS Code

---

**Decisão Arquitetural:** Esta arquitetura foi escolhida para maximizar a facilidade de uso e integração com o ecossistema VS Code + GitHub Copilot.
