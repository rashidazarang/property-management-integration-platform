# Sync Patterns

This directory contains the extracted sync intelligence and patterns from production implementations. These patterns are designed to be reusable across different property management integrations.

## Core Patterns

### 1. **11-Step Orchestration Pattern**
A proven workflow for bi-directional sync between property management and field service systems:

```
1. Fetch Portfolios → 2. Fetch Work Orders → 3. Fetch Customers
→ 4. Fetch Jobs → 5. Fetch Buildings → 6. Fetch Leases
→ 7. Sync Portfolios → 8. Sync Units → 9. Sync Tenants
→ 10. Sync Work Orders → 11. Sync Job Updates
```

### 2. **Rate Limiting Strategy**
- PropertyWare: 2 requests/second (SOAP API limitation)
- ServiceFusion: 0.5 requests/second (API rate limit)
- Implements exponential backoff with jitter

### 3. **Deduplication Algorithm**
- Entity ID matching (primary key)
- Address normalization and fuzzy matching
- Name similarity scoring (Levenshtein distance)
- 95% confidence threshold for automatic matching

### 4. **Entity Mapping**
- Building → Customer mapping
- Portfolio → Parent Account hierarchy
- Unit → Location mapping
- Work Order → Job synchronization

### 5. **Conflict Resolution**
- Last-write-wins for field updates
- PropertyWare as source of truth for financial data
- ServiceFusion as source of truth for job status
- Manual review queue for conflicts

## Implementation Options

### Option 1: Standalone MCP Servers
Each service runs as an independent MCP server:
- `@pmip/dedup-service` - Deduplication service
- `@pmip/mapper-service` - Entity mapping service
- `@pmip/sync-orchestrator` - Workflow orchestration

### Option 2: PMIP Services
Services integrated into PMIP core:
```typescript
const dedup = pmip.getService('deduplication');
const mapper = pmip.getService('entity-mapper');
const orchestrator = pmip.getService('orchestrator');
```

### Option 3: Lambda Adapter
Reuse existing Lambda implementations:
```typescript
const adapter = new LambdaSyncAdapter(config);
await adapter.triggerFullSync();
```

## Best Practices

1. **Always implement deduplication** before creating new records
2. **Use batch operations** where available (PropertyWare supports batch SOAP calls)
3. **Implement circuit breakers** for API failures
4. **Cache frequently accessed data** (customer mappings, portfolio hierarchy)
5. **Log all sync operations** for audit trail
6. **Implement dry-run mode** for testing
7. **Use idempotent operations** to handle retries safely

## Data Warehouse Schema

The sync patterns assume a dimensional data warehouse (Supabase/PostgreSQL):

```sql
-- Dimension tables
dim_portfolio (portfolio_id, portfolio_name, ...)
dim_building (building_id, building_name, portfolio_key, ...)
dim_customer (customer_id, customer_name, ...)
dim_unit (unit_id, unit_number, building_key, ...)

-- Fact tables
fact_work_orders (work_order_id, building_key, status, ...)
fact_jobs (job_id, customer_key, work_order_key, ...)
fact_leases (lease_id, unit_key, tenant_key, ...)

-- Mapping tables
customer_mappings (pw_building_id, sf_customer_id, confidence, ...)
sync_state (entity_type, last_sync, status, ...)
```

## Error Handling

1. **Transient errors**: Retry with exponential backoff
2. **Rate limit errors**: Pause and resume with rate limiter
3. **Data validation errors**: Queue for manual review
4. **Authentication errors**: Refresh tokens and retry
5. **Network errors**: Circuit breaker pattern

## Monitoring

Key metrics to track:
- Sync success rate (target: 99.9%)
- Average sync duration
- Duplicates prevented
- API calls saved
- Error rate by type
- Entity processing rate