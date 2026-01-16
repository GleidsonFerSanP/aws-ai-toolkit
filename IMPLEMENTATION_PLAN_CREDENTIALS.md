# 🎯 Plano de Implementação - Sistema Inteligente de Credenciais

## Objetivo

Atualizar TODOS os handlers restantes (8 de 11) para usar o sistema inteligente de detecção de credenciais.

## Status Atual (v2.0.3)

* ✅ 3/11 handlers atualizados
* ⏳ 8/11 handlers pendentes
* ✅ Sistema de credenciais implementado e testado

## Handlers a Atualizar

### 1. query-database.handler.ts

* **Operações:** DynamoDB (query, scan, get-item, batch-get) + RDS Data API (execute-sql)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 2. logs-operations.handler.ts

* **Operações:** CloudWatch Logs (7 operações)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 3. get-metrics.handler.ts

* **Operações:** CloudWatch Metrics (list-metrics, get-metric-statistics)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 4. search-resources.handler.ts

* **Operações:** Resource Groups Tagging API (7 tipos de busca)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 5. get-costs.handler.ts

* **Operações:** Cost Explorer (cost-and-usage, forecast)
* **Região:** us-east-1 (global service)
* **Padrão atual:** profileService.getActiveProfile()

### 6. account-info.handler.ts

* **Operações:** STS, EC2, Service Quotas, Account (6 tipos)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 7. manage-secrets.handler.ts

* **Operações:** Secrets Manager + Parameter Store (5 ops cada)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

### 8. container-operations.handler.ts

* **Operações:** ECS + EKS (clusters, services, tasks, nodegroups, addons)
* **Região:** Requerida
* **Padrão atual:** profileService.getActiveProfile()

## Padrão de Substituição

### Antes (Antigo - 28 linhas):

```typescript
import { profileService } from '../../services/profile.service';

export async function handleXXX(args: XXXArgs): Promise<CallToolResult> {
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
```

### Depois (Novo - 14 linhas):

```typescript
import { getIntelligentCredentials, getRegion } from '../../utils';

export async function handleXXX(args: XXXArgs): Promise<CallToolResult> {
  // Get credentials intelligently
  const region = getRegion(args.region);
  const credResult = await getIntelligentCredentials(args.profile, region);
  
  if (credResult.needsConfiguration) {
    return {
      content: [{ type: 'text', text: credResult.message || 'AWS credentials not configured.' }],
      isError: false,
    };
  }

  const credentials = credResult.credentials!;
```

## Etapas de Implementação

### Fase 1: Preparação (5 min)

* [x] Criar plano detalhado
* [ ] Ler conteúdo exato de cada handler
* [ ] Identificar linha exata de cada substituição

### Fase 2: Atualização em Lote (10 min)

* [ ] Atualizar query-database.handler.ts
* [ ] Atualizar logs-operations.handler.ts
* [ ] Atualizar get-metrics.handler.ts
* [ ] Atualizar search-resources.handler.ts
* [ ] Atualizar get-costs.handler.ts
* [ ] Atualizar account-info.handler.ts
* [ ] Atualizar manage-secrets.handler.ts
* [ ] Atualizar container-operations.handler.ts

### Fase 3: Validação (5 min)

* [ ] Compilar TypeScript
* [ ] Verificar erros
* [ ] Corrigir issues se houver

### Fase 4: Documentação (5 min)

* [ ] Atualizar CHANGELOG.md para v2.1.0
* [ ] Atualizar package.json para v2.1.0
* [ ] Adicionar nota sobre cobertura completa

### Fase 5: Publicação (5 min)

* [ ] Gerar VSIX
* [ ] Publicar no marketplace
* [ ] Commit no GitHub
* [ ] Instalar localmente

## Benefícios Esperados

### Para Usuários:

* ✅ Detecção automática de credenciais em TODAS as operações
* ✅ Mensagens amigáveis em vez de erros
* ✅ Funciona com AWS CLI out-of-the-box
* ✅ Suporta múltiplos métodos de autenticação

### Para Desenvolvedores:

* ✅ Código mais limpo e consistente
* ✅ Menos linhas de código (50% redução)
* ✅ Manutenção mais fácil
* ✅ Melhor experiência de debugging

## Métricas de Sucesso

* ✅ 100% dos handlers com detecção inteligente (11/11)
* ✅ Compilação sem erros
* ✅ Redução de 50% no código de autenticação
* ✅ Zero erros em casos sem credenciais
* ✅ Publicação bem-sucedida no marketplace

## Versão Final: 2.1.0

**Título:** Complete Intelligent Credentials System

**Descrição:**
* Sistema inteligente de credenciais em 100% dos handlers
* Detecção automática de AWS CLI, SSO, variáveis de ambiente
* Mensagens amigáveis para configuração
* Redução de 50% no código de autenticação

## Timeline

* **Início:** 16/01/2026 - 19:00
* **Fase 1:** 19:00 - 19:05 ✅
* **Fase 2:** 19:05 - 19:15
* **Fase 3:** 19:15 - 19:20
* **Fase 4:** 19:20 - 19:25
* **Fase 5:** 19:25 - 19:30
* **Conclusão:** 19:30

**Tempo Total Estimado:** 30 minutos
