# PMIP External Adapter Migration

## Migration Complete! 🎉

The Property Management Integration Platform (PMIP) has been successfully updated to use external npm packages for adapters instead of embedded code. This follows our hybrid architecture strategy of keeping the valuable orchestration logic proprietary while open-sourcing the adapters.

## Changes Made

### 1. Package Dependencies
- Added `@rashidazarang/propertyware-adapter` v1.0.0
- Added `@rashidazarang/servicefusion-adapter` v1.0.0
- Removed direct dependencies on `soap` and `xml2js` (now handled by adapters)

### 2. Integration Wrappers
Updated the integration classes to act as thin wrappers around the external adapters:

#### PropertyWare Integration (`src/integrations/propertyware/index.ts`)
- Now uses `PropertyWareAdapter` from `@rashidazarang/propertyware-adapter`
- Maintains backward compatibility with existing PMIP code
- Forwards all events from adapter to PMIP event system
- Provides access to underlying adapter for advanced usage

#### ServiceFusion Integration (`src/integrations/servicefusion/index.ts`)
- Now uses `ServiceFusionAdapter` from `@rashidazarang/servicefusion-adapter`
- Maintains backward compatibility with existing PMIP code
- Forwards all events from adapter to PMIP event system
- Provides access to underlying adapter for advanced usage

## Benefits

1. **Separation of Concerns**: Adapters can be developed and versioned independently
2. **Open Source Contribution**: Community can contribute to adapters without accessing proprietary PMIP code
3. **Reusability**: Adapters can be used in other projects outside of PMIP
4. **Easier Testing**: Adapters can be tested independently
5. **Better Maintenance**: Updates to adapters don't require PMIP core changes

## Installation

To use the updated PMIP with external adapters:

```bash
cd pmip
npm install
```

This will automatically install the external adapters from npm:
- `@rashidazarang/propertyware-adapter`
- `@rashidazarang/servicefusion-adapter`

## Configuration

No changes required to existing configuration. The integration wrappers handle the adapter initialization transparently:

```typescript
const pmip = await createPMIP({
  integrations: {
    propertyware: {
      wsdl: 'https://app.propertyware.com/pw/api/v1/soap.asmx?WSDL',
      url: 'https://app.propertyware.com/pw/api/v1/soap.asmx',
      username: 'your-username',
      password: 'your-password'
    },
    servicefusion: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      baseUrl: 'https://api.servicefusion.com/v1'
    }
  }
});
```

## Usage

The API remains unchanged. All existing code will continue to work:

```typescript
// Get PropertyWare integration
const pw = pmip.getIntegration('propertyware');
const portfolios = await pw.getPortfolios();

// Get ServiceFusion integration  
const sf = pmip.getIntegration('servicefusion');
const customers = await sf.getCustomers();

// Advanced: Access underlying adapter directly
const pwAdapter = pw.getAdapter();
const sfAdapter = sf.getAdapter();
```

## Event Forwarding

All adapter events are automatically forwarded to the PMIP event system:

```typescript
// Listen to adapter events through PMIP
pmip.getIntegration('propertyware').on('sync:progress', (data) => {
  console.log('PropertyWare sync progress:', data);
});

pmip.getIntegration('servicefusion').on('rate-limit-depleted', () => {
  console.log('ServiceFusion rate limit reached');
});
```

## Architecture

```
PMIP Core (Proprietary)
├── Orchestration Engine
├── Workflow Management  
├── Deduplication Service
├── Data Warehouse
└── Integration Wrappers
    ├── PropertyWare Wrapper → @rashidazarang/propertyware-adapter (npm)
    └── ServiceFusion Wrapper → @rashidazarang/servicefusion-adapter (npm)
```

## Next Steps

1. **Test the integration** with your existing workflows
2. **Monitor adapter performance** in production
3. **Report issues** on the respective adapter repositories:
   - [PropertyWare Adapter Issues](https://github.com/rashidazarang/propertyware-adapter/issues)
   - [ServiceFusion Adapter Issues](https://github.com/rashidazarang/servicefusion-adapter/issues)
4. **Consider contributing** improvements to the open-source adapters

## Rollback Plan

If you need to rollback to embedded adapters:

1. Restore the original `package.json` dependencies
2. Restore the original integration files from git history
3. Run `npm install` to update dependencies

## Support

- **PMIP Core Issues**: Internal support channels
- **PropertyWare Adapter**: https://github.com/rashidazarang/propertyware-adapter
- **ServiceFusion Adapter**: https://github.com/rashidazarang/servicefusion-adapter

## Version Compatibility

| PMIP Version | PropertyWare Adapter | ServiceFusion Adapter |
|--------------|---------------------|----------------------|
| 1.0.0        | ^1.0.0              | ^1.0.0               |

## Migration Date

**Completed**: September 9, 2025