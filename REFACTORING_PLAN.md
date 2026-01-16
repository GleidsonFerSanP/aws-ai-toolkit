# 🔄 AWS MCP Tools Refactoring Plan

## Context

GitHub Copilot Chat emite warning de performance com mais de 128 tools.
Atualmente temos 73 tools específicas, limitando expansão futura.

## Objetivo

Consolidar 73 tools específicas em ~12 tools genéricas mantendo todas as funcionalidades.

---

## 📊 Current State (73 Tools)

### Profile Management (8 tools)

* create-profile, update-profile, delete-profile, list-profiles
* get-active-profile, set-active-profile, get-profile, validate-profile

### EC2 Management (10 tools)

* list-ec2-instances, describe-ec2-instance, start-ec2-instances
* stop-ec2-instances, reboot-ec2-instances, terminate-ec2-instances
* get-ec2-instance-status, list-key-pairs, create-key-pair, create-bastion-host

### CloudWatch Logs (8 tools)

* list-log-groups, list-log-streams, get-log-events, tail-logs
* filter-log-events, start-insights-query, get-insights-query-results, query-logs

### Containers ECS/EKS (14 tools)

* list-ecs-clusters, describe-ecs-clusters, list-ecs-services, describe-ecs-services
* list-ecs-tasks, describe-ecs-tasks, list-ecs-task-definitions, describe-ecs-task-definition
* list-eks-clusters, describe-eks-cluster, list-eks-nodegroups, describe-eks-nodegroup
* list-eks-addons, describe-eks-addon

### RDS (8 tools)

* list-rds-instances, describe-rds-instance, list-rds-clusters, describe-rds-cluster
* list-rds-snapshots, list-rds-cluster-snapshots, list-rds-engine-versions, list-rds-events

### DynamoDB (10 tools)

* list-dynamodb-tables, describe-dynamodb-table, get-dynamodb-item
* query-dynamodb-table, scan-dynamodb-table, batch-get-dynamodb-items
* list-dynamodb-backups, describe-dynamodb-backup, list-dynamodb-global-tables, describe-dynamodb-ttl

### Resources (7 tools)

* list-aws-resources, get-resources-by-service, get-resources-by-tag
* get-resource-summary, list-tag-keys, list-tag-values, search-resources-by-arn

### Account (8 tools)

* get-account-identity, list-aws-regions, get-service-quotas, get-service-quota
* get-default-service-quotas, get-cost-and-usage, get-cost-forecast, get-contact-information

---

## 🎯 Target State (12 Generic Tools)

### 1. **aws-manage-profiles**

**Replaces**: 8 profile tools  
**Operation Parameter**: create | update | delete | list | get | set-active | validate  
**Functionality**: All profile operations unified

### 2. **aws-list-resources**

**Replaces**: 25+ list tools  
**Resource Types**: 
* ec2-instances, rds-instances, rds-clusters, dynamodb-tables
* ecs-clusters, ecs-services, ecs-tasks, eks-clusters, eks-nodegroups
* s3-buckets, lambda-functions, log-groups, log-streams
* key-pairs, snapshots, backups, global-tables
**Parameters**: 
* resourceType (required)
* region, profile, filters (optional)

### 3. **aws-describe-resource**

**Replaces**: 15+ describe tools  
**Resource Types**:
* ec2-instance, rds-instance, rds-cluster, dynamodb-table
* ecs-cluster, ecs-service, ecs-task, ecs-task-definition
* eks-cluster, eks-nodegroup, eks-addon
* backup, snapshot, ttl-settings
**Parameters**:
* resourceType (required)
* resourceId (required: instance-id, table-name, cluster-arn, etc)
* region, profile (optional)

### 4. **aws-execute-action**

**Replaces**: 12+ action tools  
**Actions**: start | stop | reboot | terminate | create | delete | update  
**Resource Types**: ec2-instances, rds-instances, ecs-services, etc  
**Parameters**:
* action (required)
* resourceType (required)
* resourceIds (required: array)
* region, profile (optional)
* actionParams (optional: for create/update)

### 5. **aws-query-database**

**Replaces**: 5 database query tools  
**Database Types**: dynamodb | rds | redshift  
**Operations**: query | scan | batch-get | execute-sql  
**Parameters**:
* databaseType (required)
* operation (required)
* tableName or databaseName (required)
* queryParams (conditions, filters, projections)
* region, profile (optional)

### 6. **aws-logs-operations**

**Replaces**: 8 CloudWatch tools  
**Operations**: list-groups | list-streams | get-events | tail | filter | insights-query | insights-results  
**Parameters**:
* operation (required)
* logGroup, logStream (contextual)
* query, limit, startTime, endTime (optional)
* region, profile (optional)

### 7. **aws-get-metrics**

**Replaces**: 3 metrics tools  
**Functionality**: Get CloudWatch metrics for any AWS resource  
**Parameters**:
* namespace (AWS/EC2, AWS/RDS, AWS/Lambda, etc)
* metricName (CPUUtilization, NetworkIn, etc)
* dimensions (instance-id, etc)
* statistics (Average, Sum, Maximum, etc)
* period, startTime, endTime
* region, profile (optional)

### 8. **aws-search-resources**

**Replaces**: 7 search/discovery tools  
**Search Types**: by-service | by-tag | by-arn | all-resources | tag-keys | tag-values | resource-summary  
**Parameters**:
* searchType (required)
* serviceName, tagKey, tagValue, arn (contextual)
* region, profile (optional)

### 9. **aws-get-costs**

**Replaces**: 2 cost tools  
**Operations**: cost-and-usage | forecast  
**Parameters**:
* operation (required)
* startDate, endDate (required for cost-and-usage)
* granularity (DAILY, MONTHLY)
* groupBy (SERVICE, REGION, etc)
* filters (optional)
* profile (optional)

### 10. **aws-account-info**

**Replaces**: 6 account tools  
**Info Types**: identity | regions | quotas | quota-details | contact  
**Parameters**:
* infoType (required)
* serviceCode (for quotas)
* quotaCode (for specific quota)
* profile (optional)

### 11. **aws-manage-secrets**

**Replaces**: 8 secrets/parameters tools  
**Services**: secrets-manager | parameter-store  
**Operations**: get | list | create | update | delete | get-by-path  
**Parameters**:
* service (required)
* operation (required)
* secretId or parameterName (contextual)
* secretValue (for create/update)
* region, profile (optional)

### 12. **aws-container-operations**

**Replaces**: 14 ECS/EKS tools  
**Platforms**: ecs | eks  
**Resources**: clusters | services | tasks | task-definitions | nodegroups | addons  
**Operations**: list | describe | create | update | delete | restart  
**Parameters**:
* platform (required: ecs | eks)
* resourceType (required)
* operation (required)
* resourceIds (contextual)
* region, profile (optional)

---

## 📐 Implementation Architecture

### New File Structure

```
src/
├── tools/
│   └── unified.tools.ts          # 12 generic tool definitions
├── handlers/
│   ├── profile.handler.ts        # aws-manage-profiles
│   ├── resources.handler.ts      # aws-list-resources, aws-describe-resource
│   ├── actions.handler.ts        # aws-execute-action
│   ├── database.handler.ts       # aws-query-database
│   ├── logs.handler.ts           # aws-logs-operations
│   ├── metrics.handler.ts        # aws-get-metrics
│   ├── search.handler.ts         # aws-search-resources
│   ├── costs.handler.ts          # aws-get-costs
│   ├── account.handler.ts        # aws-account-info
│   ├── secrets.handler.ts        # aws-manage-secrets
│   └── containers.handler.ts     # aws-container-operations
├── services/
│   └── [existing services - reuse logic]
└── index.ts                       # Updated server with 12 tools
```

### Handler Pattern

Each handler will use switch/case on operation/resourceType parameters to route to appropriate service methods.

### Backward Compatibility

Old handlers remain for reference, but server only registers 12 new tools.

---

## 🚀 Implementation Steps

### Phase 1: Core Infrastructure (30 min)

01. ✅ Create unified.tools.ts with 12 tool definitions
02. ✅ Create new handler files structure
03. ✅ Update index.ts to register only 12 tools

### Phase 2: High-Priority Tools (1h)

04. ✅ Implement aws-manage-profiles (consolidate 8 → 1)
05. ✅ Implement aws-list-resources (consolidate 25 → 1)
06. ✅ Implement aws-describe-resource (consolidate 15 → 1)

### Phase 3: Action & Database Tools (45 min)

07. ✅ Implement aws-execute-action (consolidate 12 → 1)
08. ✅ Implement aws-query-database (consolidate 5 → 1)

### Phase 4: Observability Tools (30 min)

09. ✅ Implement aws-logs-operations (consolidate 8 → 1)
10. ✅ Implement aws-get-metrics (consolidate 3 → 1)

### Phase 5: Discovery & Cost Tools (30 min)

11. ✅ Implement aws-search-resources (consolidate 7 → 1)
12. ✅ Implement aws-get-costs (consolidate 2 → 1)

### Phase 6: Supporting Tools (30 min)

13. ✅ Implement aws-account-info (consolidate 6 → 1)
14. ✅ Implement aws-manage-secrets (consolidate 8 → 1)
15. ✅ Implement aws-container-operations (consolidate 14 → 1)

### Phase 7: Testing & Deployment (30 min)

16. ✅ Test all 12 tools with MCP protocol
17. ✅ Update README and documentation
18. ✅ Package and install extension
19. ✅ Verify in GitHub Copilot Chat

**Total Estimated Time**: 4-5 hours

---

## ✅ Benefits

01. **Performance**: 73 → 12 tools (83% reduction)
02. **Scalability**: Room for +100 more tools for other AWS services
03. **Maintainability**: Single handler per domain vs 73 individual functions
04. **Flexibility**: Easy to add new resource types without new tools
05. **User Experience**: Cleaner tool list in Copilot Chat
06. **Extensibility**: Pattern can scale to cover all AWS services

---

## 🔧 Migration Notes

* Old tools remain in codebase for reference
* Services layer unchanged (business logic reused)
* Only tool definitions and handlers change
* MCP protocol compatibility maintained
* VS Code extension works identically

---

## 📝 Next Steps After Implementation

01. Add support for more AWS services (S3, Lambda, API Gateway, etc)
02. Implement batch operations (multi-resource actions)
03. Add resource relationship discovery
04. Create resource templates/blueprints
05. Add infrastructure-as-code generation

---

**Status**: 🚧 Implementation Starting
**Last Updated**: 2026-01-16
