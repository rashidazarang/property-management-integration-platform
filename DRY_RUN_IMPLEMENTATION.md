# PMIP Dry-Run Mode Implementation

## Overview
Successfully implemented configurable dry-run mode for the Property Management Integration Platform (PMIP), allowing safe testing without affecting external systems.

## Key Features Implemented

### 1. Configurable Dry-Run Mode
- **Variable-based Control**: Dry-run mode is not hardcoded but controlled via options parameter
- **Inspired by GreenLight**: Similar approach to GreenLight's implementation but adapted for PMIP
- **Multi-level Support**: Dry-run mode propagates through all layers:
  - PMIP Core (`src/index.ts`)
  - Integrations (PropertyWare & ServiceFusion)
  - Data Warehouse (Supabase)
  - Workflows

### 2. Integration Support

#### PropertyWare Integration (SOAP)
- Mock data for portfolios, buildings, work orders, and leases
- Simulated CRUD operations
- Rate limiting: 2 requests/second (mocked in dry-run)
- Returns realistic test data with proper IDs and timestamps

#### ServiceFusion Integration (REST/OAuth)
- Mock data for customers, jobs, and technicians
- Simulated OAuth authentication flow
- Rate limiting: 0.5 requests/second (mocked in dry-run)
- Returns realistic job IDs and check numbers

### 3. Data Warehouse Protection
- Skips actual Supabase connection in dry-run mode
- Returns mock status and table counts
- Prevents any database writes
- Safe for testing without data corruption

## Usage

### Running Tests with Dry-Run Mode

```bash
# Using npm script
npm run test:dry-run

# Direct execution
npx tsx tests/dry-run-test.ts

# With environment variables
PROPERTYWARE_USERNAME=your_username \
PROPERTYWARE_PASSWORD=your_password \
SERVICEFUSION_CLIENT_ID=your_client_id \
SERVICEFUSION_CLIENT_SECRET=your_client_secret \
npm run test:dry-run
```

### Programmatic Usage

```typescript
import { createPMIP } from '@pmip/core';

// Initialize with dry-run mode enabled
const pmip = await createPMIP(config, {
  dryRun: true,  // Variable control, not hardcoded
  reuseGreenlight: false
});

// All operations will use mock data
const portfolios = await pmip.getIntegration('propertyware').getPortfolios();
// Returns mock portfolios without calling actual API
```

### Configuration Options

```typescript
interface PMIPOptions {
  dryRun?: boolean;        // Enable/disable dry-run mode
  reuseGreenlight?: boolean; // Use existing GreenLight Lambda functions
}
```

## Test Results

The dry-run test successfully demonstrates:

1. **PropertyWare Operations**:
   - ✅ Getting portfolios (2 mock portfolios)
   - ✅ Getting buildings (2 mock buildings)
   - ✅ Getting work orders (2 mock work orders)
   - ✅ Creating new work order
   - ✅ Updating work order status

2. **ServiceFusion Operations**:
   - ✅ Getting customers (2 mock customers)
   - ✅ Getting jobs (2 mock jobs)
   - ✅ Creating new customer
   - ✅ Creating new job
   - ✅ Updating job status

3. **Bi-directional Sync Workflow**:
   - ✅ PropertyWare → ServiceFusion sync
   - ✅ ServiceFusion → PropertyWare sync
   - ✅ Custom field mapping preservation
   - ✅ Status synchronization

## Files Modified

1. **Core System**:
   - `src/index.ts` - Added dry-run option support
   - `src/types/index.ts` - Added PMIPOptions interface
   - `src/services/data-warehouse/index.ts` - Added dry-run mode for database operations

2. **Integrations**:
   - `src/integrations/propertyware/index.ts` - Added dry-run mock data
   - `src/integrations/servicefusion/index.ts` - Added dry-run mock data

3. **Type Definitions**:
   - `src/types/propertyware-adapter.d.ts` - Complete type definitions
   - `src/types/servicefusion-adapter.d.ts` - Complete type definitions

4. **Tests**:
   - `tests/dry-run-test.ts` - Comprehensive dry-run test suite

5. **Package Configuration**:
   - `package.json` - Added `test:dry-run` script

## Mock Data Structure

### PropertyWare Mock Data
```typescript
{
  portfolioId: 'MOCK-PF-001',
  name: 'Mock Portfolio Alpha',
  ownerFirstName: 'John',
  ownerLastName: 'Doe',
  buildings: [...],
  workOrders: [...]
}
```

### ServiceFusion Mock Data
```typescript
{
  customerId: 'MOCK-SF-CUST-001',
  customerName: 'Mock Portfolio Alpha Customer',
  customerType: 'portfolio',
  jobs: [...],
  technicians: [...]
}
```

## Safety Features

1. **No External API Calls**: All external service calls return mock data
2. **No Database Writes**: Supabase operations are bypassed
3. **Consistent Mock IDs**: Predictable IDs for testing
4. **Logged Operations**: All dry-run operations are clearly logged
5. **Clear Indicators**: Console shows "DRY-RUN MODE ENABLED" banner

## Next Steps

1. **Production Testing**: Test with real credentials but dry-run enabled
2. **Integration Tests**: Add comprehensive Jest test suite
3. **CI/CD Pipeline**: Integrate dry-run tests in GitHub Actions
4. **Performance Testing**: Benchmark sync operations with large datasets
5. **Error Scenarios**: Add mock error conditions for resilience testing

## Conclusion

The dry-run mode implementation provides a safe, configurable way to test the PMIP platform without affecting production systems. The implementation follows best practices from the GreenLight system while being adapted for PMIP's specific architecture.