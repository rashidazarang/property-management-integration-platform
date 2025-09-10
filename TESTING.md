# PMIP Testing Guide

## Overview

This guide provides comprehensive testing documentation for the Property Management Integration Platform (PMIP). All tests can be run safely using the built-in dry-run mode without affecting external systems.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Suites](#test-suites)
- [Dry-Run Mode](#dry-run-mode)
- [Natural Language Testing](#natural-language-testing)
- [Integration Testing](#integration-testing)
- [Unit Testing](#unit-testing)
- [Performance Testing](#performance-testing)
- [MCP Playbook Testing](#mcp-playbook-testing)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Verify installations
npm run check:deps
```

### Running All Tests

```bash
# Run complete test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Running Specific Test Suites

```bash
# Dry-run integration tests
npm run test:dry-run

# Natural language processing tests
npm run test:nlp

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests
npm run test:performance
```

## Test Suites

### 1. Dry-Run Integration Test (`test:dry-run`)

Tests the complete system integration without making actual API calls.

**Location**: `tests/dry-run-test.ts`

**Coverage**:
- PropertyWare SOAP operations
- ServiceFusion REST operations
- Bi-directional data synchronization
- Workflow orchestration
- Data warehouse operations
- Deduplication service

**Example Run**:
```bash
npm run test:dry-run
```

**Expected Output**:
```
✅ PropertyWare Integration (DRY-RUN)
  ✓ Getting portfolios
  ✓ Getting buildings
  ✓ Getting work orders
  ✓ Creating work order
  ✓ Updating work order

✅ ServiceFusion Integration (DRY-RUN)
  ✓ Getting customers
  ✓ Getting jobs
  ✓ Creating customer
  ✓ Creating job
  ✓ Updating job

✅ Workflow Sync (DRY-RUN)
  ✓ PropertyWare → ServiceFusion sync
  ✓ ServiceFusion → PropertyWare sync
```

### 2. Natural Language Processing Test (`test:nlp`)

Tests the MCP Intelligence integration for natural language query processing.

**Location**: `tests/nlp-test.ts`

**Coverage**:
- Query routing (PropertyWare vs ServiceFusion)
- Parameter extraction from natural language
- Query suggestions and autocomplete
- Cross-system operations
- Complex query parsing

**Example Queries Tested**:
```typescript
// PropertyWare queries
"Show all portfolios"
"Show all buildings"
"Show all open work orders"
"Create an emergency work order for unit 501"

// ServiceFusion queries
"List all customers"
"Show today's jobs"
"Create a job for maintenance"

// Cross-system queries
"Sync work orders from PropertyWare to ServiceFusion"
"Update PropertyWare with completed ServiceFusion jobs"
```

### 3. Unit Tests

Test individual components in isolation.

**Locations**:
- `tests/unit/adapters/`
- `tests/unit/services/`
- `tests/unit/utils/`

**Run Specific Unit Tests**:
```bash
# Test PropertyWare adapter
npm run test:unit -- --grep "PropertyWare"

# Test ServiceFusion adapter
npm run test:unit -- --grep "ServiceFusion"

# Test deduplication service
npm run test:unit -- --grep "Deduplication"
```

### 4. Integration Tests

Test component interactions and data flow.

**Location**: `tests/integration/`

**Coverage**:
- Adapter initialization
- Authentication flows
- Rate limiting
- Error handling
- Retry mechanisms
- Circuit breaker patterns

### 5. Performance Tests

Measure system performance and resource usage.

**Location**: `tests/performance/`

**Metrics Tested**:
- API response times
- Rate limiting compliance
- Memory usage
- Concurrent request handling
- Batch processing efficiency

**Run Performance Tests**:
```bash
# Basic performance test
npm run test:performance

# Stress test with high load
npm run test:stress

# Load test with sustained traffic
npm run test:load
```

## Dry-Run Mode

Dry-run mode allows safe testing without affecting external systems.

### Enabling Dry-Run Mode

**Method 1: Configuration**
```typescript
const config: PMIPConfig = {
  propertyware: { /* ... */ },
  servicefusion: { /* ... */ },
  dataWarehouse: { /* ... */ }
};

const pmip = new PMIP(config, { dryRun: true });
```

**Method 2: Environment Variable**
```bash
export PMIP_DRY_RUN=true
npm run test
```

**Method 3: Command Line**
```bash
npm run test -- --dry-run
```

### Dry-Run Behavior

When dry-run is enabled:
- ✅ Returns mock data for all operations
- ✅ Logs intended operations without execution
- ✅ Simulates rate limiting and delays
- ✅ Validates request parameters
- ❌ No external API calls
- ❌ No database writes
- ❌ No state changes

### Mock Data Structure

```typescript
// PropertyWare mock portfolio
{
  portfolioId: 'MOCK-PF-001',
  name: 'Mock Portfolio Alpha',
  owner: 'John Doe',
  buildings: ['MOCK-BLD-001', 'MOCK-BLD-002'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2025-09-10T00:00:00Z'
}

// ServiceFusion mock job
{
  jobId: 'MOCK-SF-JOB-001',
  checkNumber: 'CHK-001',
  customerId: 'MOCK-SF-CUST-001',
  description: 'Test job',
  status: 'open',
  priority: 'normal'
}
```

## Natural Language Testing

### Testing Query Routing

```typescript
// Test file: tests/nlp-routing.test.ts
describe('Query Routing', () => {
  it('routes portfolio queries to PropertyWare', async () => {
    const result = await pmip.query('Show all portfolios');
    expect(result.routing.server).toBe('propertyware');
  });

  it('routes job queries to ServiceFusion', async () => {
    const result = await pmip.query('List today\'s jobs');
    expect(result.routing.server).toBe('servicefusion');
  });

  it('identifies cross-system operations', async () => {
    const result = await pmip.query('Sync work orders to ServiceFusion');
    expect(result.routing.server).toBe('both');
  });
});
```

### Testing Parameter Extraction

```typescript
describe('Parameter Extraction', () => {
  it('extracts priority from query', async () => {
    const result = await pmip.query('Create high priority work order');
    expect(result.parameters.priority).toBe('high');
  });

  it('extracts date from query', async () => {
    const result = await pmip.query('Show jobs from yesterday');
    expect(result.parameters.date).toBeDefined();
  });
});
```

## MCP Playbook Testing

### Creating Test Playbooks

```yaml
# tests/playbooks/test-sync.yaml
name: Test Sync Playbook
description: Test PropertyWare to ServiceFusion sync
version: 1.0.0

triggers:
  - type: manual
  - type: test

steps:
  - id: fetch-work-orders
    action: propertyware.getWorkOrders
    params:
      status: open
      limit: 10
    
  - id: create-jobs
    action: servicefusion.createJobs
    params:
      workOrders: "{{ steps.fetch-work-orders.output }}"
    forEach: "{{ steps.fetch-work-orders.output }}"
    
  - id: verify-sync
    action: verify.checkSync
    params:
      expectedCount: "{{ steps.fetch-work-orders.output.length }}"
```

### Running Playbook Tests

```bash
# Test single playbook
npm run test:playbook -- tests/playbooks/test-sync.yaml

# Test all playbooks
npm run test:playbooks

# Test with dry-run
npm run test:playbook -- --dry-run tests/playbooks/test-sync.yaml
```

## Test Data Management

### Fixtures

Test fixtures are located in `tests/fixtures/`:

```
tests/fixtures/
├── propertyware/
│   ├── portfolios.json
│   ├── buildings.json
│   └── work-orders.json
├── servicefusion/
│   ├── customers.json
│   ├── jobs.json
│   └── technicians.json
└── mappings/
    └── entity-mappings.json
```

### Loading Test Data

```typescript
import { loadFixture } from '../helpers/fixtures';

const portfolios = await loadFixture('propertyware/portfolios.json');
const jobs = await loadFixture('servicefusion/jobs.json');
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        env:
          PMIP_DRY_RUN: true
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### Enable Debug Logging

```bash
# Enable all debug logs
DEBUG=pmip:* npm test

# Enable specific module logs
DEBUG=pmip:propertyware npm test
DEBUG=pmip:servicefusion npm test
DEBUG=pmip:intelligence npm test
```

### Using VS Code Debugger

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": [
        "tests/dry-run-test.ts"
      ],
      "env": {
        "PMIP_DRY_RUN": "true",
        "DEBUG": "pmip:*"
      }
    }
  ]
}
```

## Common Test Scenarios

### 1. Testing Work Order Sync

```typescript
describe('Work Order Sync', () => {
  it('syncs open work orders to ServiceFusion', async () => {
    // Fetch work orders from PropertyWare
    const workOrders = await pmip.propertyware.getWorkOrders({ 
      status: 'open' 
    });
    
    // Create corresponding jobs in ServiceFusion
    const jobs = [];
    for (const wo of workOrders) {
      const job = await pmip.servicefusion.createJob({
        description: wo.description,
        customerId: wo.buildingId,
        priority: wo.priority.toLowerCase()
      });
      jobs.push(job);
    }
    
    expect(jobs).toHaveLength(workOrders.length);
  });
});
```

### 2. Testing Deduplication

```typescript
describe('Deduplication Service', () => {
  it('prevents duplicate job creation', async () => {
    const workOrder = {
      workOrderId: 'WO-123',
      description: 'Test work order'
    };
    
    // First sync
    const job1 = await pmip.syncWorkOrderToJob(workOrder);
    
    // Second sync (should return existing)
    const job2 = await pmip.syncWorkOrderToJob(workOrder);
    
    expect(job1.jobId).toBe(job2.jobId);
  });
});
```

### 3. Testing Rate Limiting

```typescript
describe('Rate Limiting', () => {
  it('respects PropertyWare rate limit (2 req/s)', async () => {
    const start = Date.now();
    
    // Make 5 requests
    const promises = Array(5).fill(null).map(() => 
      pmip.propertyware.getPortfolios()
    );
    
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    // Should take at least 2 seconds (5 requests / 2 req/s)
    expect(duration).toBeGreaterThanOrEqual(2000);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Tests Failing with Authentication Errors

**In Dry-Run Mode**: This is expected. The error at the end of tests is normal.

**Solution**: Ensure `dryRun: true` is set in your test configuration.

#### 2. TypeScript Import Errors

**Error**: "Relative import paths need explicit file extensions"

**Solution**: Add `.js` extensions to all relative imports:
```typescript
// ❌ Wrong
import { PMIP } from './index';

// ✅ Correct
import { PMIP } from './index.js';
```

#### 3. Missing Mock Data

**Error**: "Cannot read property 'X' of undefined"

**Solution**: Check that mock data is properly initialized:
```typescript
// Ensure adapters are initialized with dry-run
await pmip.propertyware.initialize();
await pmip.servicefusion.initialize();
```

#### 4. Rate Limiting in Tests

**Issue**: Tests running slowly due to rate limiting

**Solution**: Use mock timers in tests:
```typescript
import { useFakeTimers } from 'sinon';

const clock = useFakeTimers();
// Run your tests
clock.tick(1000); // Advance time by 1 second
clock.restore();
```

### Getting Help

- Check the [main documentation](README.md)
- Review [API documentation](API.md)
- Open an issue on [GitHub](https://github.com/rashidazarang/mcp-ide-playbooks/issues)
- Contact support at support@pmip.dev

## Test Coverage Requirements

Maintain minimum coverage levels:

- **Overall**: 80%
- **Statements**: 85%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 85%

Check current coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## Contributing Tests

When adding new features, include:

1. **Unit tests** for new functions
2. **Integration tests** for new workflows
3. **Dry-run tests** for external operations
4. **Documentation** updates in this file

Test file naming convention:
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- Performance tests: `*.perf.test.ts`
- E2E tests: `*.e2e.test.ts`

---

*Last updated: September 2025*
*Version: 1.0.0*