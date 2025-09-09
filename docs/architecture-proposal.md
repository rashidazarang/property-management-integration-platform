# PMIP Architecture Proposal

## Overview
This document outlines the proposed architecture for extracting and organizing the sync intelligence from the production PropertyWare <-> ServiceFusion implementation into reusable components.

## Current Situation
We have valuable sync logic and patterns embedded in a Lambda-based implementation that we want to:
1. Extract without exposing company-specific details
2. Make reusable across different property management systems
3. Package as modular components

## Proposed Architecture

### Three-Tier Approach

```
┌─────────────────────────────────────────────────────────────┐
│                      PMIP Core Platform                      │
│              (Agent Orchestra + Orchestration)               │
└─────────────────┬───────────────────────┬──────────────────┘
                  │                       │
     ┌────────────▼──────────┐  ┌────────▼──────────┐
     │   API Adapter Layer   │  │  Service Layer    │
     │                       │  │                   │
     │ • PropertyWare SOAP   │  │ • Deduplication   │
     │ • ServiceFusion REST  │  │ • Entity Mapper   │
     │ • Yardi REST         │  │ • Rate Limiter    │
     │ • RentVine REST      │  │ • Conflict Res.   │
     └───────────────────────┘  └───────────────────┘
                  │                       │
     ┌────────────▼───────────────────────▼──────────┐
     │            Data Warehouse Layer               │
     │         (Supabase / PostgreSQL)               │
     └────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Standalone NPM Packages

#### Core Services (Publish to NPM)
```
@pmip/dedup-service         - Intelligent deduplication
@pmip/entity-mapper         - Entity relationship mapping
@pmip/rate-limiter          - Multi-provider rate limiting
@pmip/conflict-resolver     - Conflict resolution engine
@pmip/sync-orchestrator     - Workflow orchestration
```

#### API Adapters (Direct API Integration)
```
@pmip/propertyware-adapter  - PropertyWare SOAP API client
@pmip/servicefusion-adapter - ServiceFusion REST API client
@pmip/yardi-adapter         - Yardi REST API client (beta)
@pmip/rentvine-adapter      - RentVine REST API client (planned)
```

#### Optional MCP Wrappers (Future)
```
@pmip/propertyware-mcp      - MCP wrapper for PropertyWare SOAP
@pmip/servicefusion-mcp     - MCP wrapper for ServiceFusion REST
(These would wrap the adapters above for MCP compatibility)
```

### 2. PMIP Core Features

The main PMIP package (`@pmip/core`) includes:
- Agent Orchestra integration
- Service discovery and management
- Workflow engine
- Monitoring and analytics
- Lambda adapter for existing implementations

### 3. Implementation Patterns

#### Pattern A: Direct API Usage
```typescript
// Use API adapters directly
import { PropertyWareAdapter } from '@pmip/propertyware-adapter';
import { ServiceFusionAdapter } from '@pmip/servicefusion-adapter';

const pw = new PropertyWareAdapter(config);
const sf = new ServiceFusionAdapter(config);

// Manual orchestration
const portfolios = await pw.getPortfolios();
const customers = await sf.createCustomers(portfolios);
```

#### Pattern B: PMIP Orchestration
```typescript
// Use PMIP for automatic orchestration
import { createPMIP } from '@pmip/core';

const pmip = await createPMIP(config);
await pmip.executeWorkflow('daily-sync');
```

#### Pattern C: Lambda Adapter (Migration Path)
```typescript
// Reuse existing Lambda functions
import { LambdaSyncAdapter } from '@pmip/core/adapters';

const adapter = new LambdaSyncAdapter({
  region: 'us-east-1',
  functions: { /* ARNs */ }
});
await adapter.triggerFullSync();
```

## Extracted Intelligence

### Sync Patterns (from production)
1. **11-Step Workflow**: Proven sequence for complete bi-directional sync
2. **Rate Limiting**: 0.5 req/s for ServiceFusion, 2 req/s for PropertyWare
3. **Deduplication**: 95% confidence scoring with multiple strategies
4. **Batch Processing**: Optimal batch sizes (100 for PW, 50 for SF)
5. **Error Recovery**: Exponential backoff, circuit breakers
6. **Caching Strategy**: 1-hour TTL for customer mappings

### Data Models
```typescript
// Extracted entity relationships
interface EntityMapping {
  building_id → customer_id
  portfolio_id → parent_account_id
  unit_id → location_id
  work_order_id → job_id
  lease_id → contract_id
}
```

## Migration Strategy

### Phase 1: Extract & Package
- [x] Create PMIP core structure
- [ ] Extract deduplication logic → `@pmip/dedup-service`
- [ ] Extract rate limiting → `@pmip/rate-limiter`
- [ ] Extract entity mapping → `@pmip/entity-mapper`

### Phase 2: Publish Packages
- [ ] Publish core services to NPM
- [ ] Publish MCP servers to NPM
- [ ] Register with MCP directory

### Phase 3: Documentation
- [ ] API documentation
- [ ] Integration guides
- [ ] Migration guide from Lambda

## Benefits

1. **Modularity**: Each component can be used independently
2. **Reusability**: Sync patterns work across different PM systems
3. **Privacy**: No company-specific details exposed
4. **Flexibility**: Three implementation patterns for different needs
5. **Open Source**: Community can contribute and improve

## Next Steps

1. **Immediate**: Create `@pmip/dedup-service` package
2. **Week 1**: Extract and package core services
3. **Week 2**: Update MCP servers to use shared services
4. **Week 3**: Documentation and examples
5. **Week 4**: Beta testing with community

## Questions to Resolve

1. Should we namespace all packages under `@pmip/`?
2. Should MCP servers be in this repo or separate repos?
3. How to handle authentication/secrets in examples?
4. Pricing model for hosted version?
5. Support strategy for open source users?