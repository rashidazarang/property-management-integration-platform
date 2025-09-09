# PMIP Revised Architecture - Hybrid Approach

## 🎯 Architecture Overview

```
┌─────────────────────────────────────┐
│  PMIP (Single Repository)           │
│  - Core platform                    │
│  - Dedup service                    │
│  - Entity mapper                    │
│  - Rate limiter                     │
│  - Workflow engine                  │
│  (Keep as proprietary/core IP)      │
└──────────────┬──────────────────────┘
               │ Uses
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────┐  ┌───────▼──────────┐
│ PropertyWare │  │ ServiceFusion    │
│ Adapter      │  │ Adapter          │
│ (Open Source)│  │ (Open Source)    │
└──────────────┘  └──────────────────┘
```

## ✅ Why This Is Better

### 1. **Protects Core IP**
- Deduplication logic is your secret sauce - keep it protected
- Entity mapping contains business knowledge - proprietary value
- Rate limiting strategies are optimized for your use cases
- Workflow orchestration is your competitive advantage

### 2. **Simplifies Management**
- One repo for all core services = easier deployment
- Shared types and utilities without package overhead
- Single versioning for core platform
- Integrated testing is simpler

### 3. **Strategic Open Source**
- Adapters are perfect for open source:
  - Community can improve them
  - Users can fix bugs they encounter
  - Builds trust and adoption
  - Not your competitive advantage

### 4. **Business Model Clarity**
```
PMIP Core (Commercial/Proprietary)
    └── Valuable IP: Dedup, Mapping, Orchestration

Open Source Adapters (MIT License)
    └── Community benefit: More integrations
```

## 📁 Repository Structure

### Repository 1: `pmip` (Current, Private)
```
pmip/
├── src/
│   ├── core/
│   │   ├── orchestrator/
│   │   └── workflow-engine/
│   ├── services/
│   │   ├── deduplication/    # Your secret sauce
│   │   ├── entity-mapper/    # Business logic
│   │   └── rate-limiter/     # Optimized strategies
│   ├── integrations/
│   │   └── (adapter interfaces)
│   └── api/
├── tests/
├── docs/
└── package.json
```

### Repository 2: `propertyware-adapter` (New, Open Source)
```
propertyware-adapter/
├── src/
│   ├── client/
│   │   ├── SOAPClient.ts
│   │   └── auth/
│   ├── models/
│   │   ├── Portfolio.ts
│   │   ├── Building.ts
│   │   └── WorkOrder.ts
│   ├── operations/
│   │   ├── portfolios.ts
│   │   ├── buildings.ts
│   │   └── workorders.ts
│   └── index.ts
├── tests/
├── examples/
│   ├── basic-usage.ts
│   ├── batch-operations.ts
│   └── error-handling.ts
├── docs/
│   ├── API.md
│   ├── Authentication.md
│   └── RateLimits.md
├── package.json
├── README.md
├── LICENSE (MIT)
└── CONTRIBUTING.md
```

### Repository 3: `servicefusion-adapter` (New, Open Source)
```
servicefusion-adapter/
├── src/
│   ├── client/
│   │   ├── RESTClient.ts
│   │   └── oauth/
│   ├── models/
│   │   ├── Customer.ts
│   │   ├── Job.ts
│   │   └── Invoice.ts
│   ├── operations/
│   │   ├── customers.ts
│   │   ├── jobs.ts
│   │   └── invoices.ts
│   └── index.ts
├── tests/
├── examples/
├── docs/
├── package.json
├── README.md
├── LICENSE (MIT)
└── CONTRIBUTING.md
```

## 🚀 Implementation Plan

### Phase 1: Extract PropertyWare Adapter (Week 1)

**Current (in PMIP Lambda):**
```typescript
const soapClient = await createPropertyWareClient();
```

**New (standalone adapter):**
```typescript
import { PropertyWareAdapter } from '@pmip/propertyware-adapter';

const adapter = new PropertyWareAdapter({
  username: process.env.PW_USERNAME,
  password: process.env.PW_PASSWORD,
  url: process.env.PW_URL
});

const portfolios = await adapter.getPortfolios();
```

### Phase 2: Extract ServiceFusion Adapter (Week 1-2)

**Standalone adapter with OAuth:**
```typescript
import { ServiceFusionAdapter } from '@pmip/servicefusion-adapter';

const adapter = new ServiceFusionAdapter({
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  redirectUri: process.env.SF_REDIRECT_URI
});

await adapter.authenticate();
const customers = await adapter.getCustomers();
```

### Phase 3: Update PMIP to Use Adapters (Week 2)

**PMIP uses the open source adapters:**
```typescript
import { PropertyWareAdapter } from '@pmip/propertyware-adapter';
import { ServiceFusionAdapter } from '@pmip/servicefusion-adapter';

export class PMIPIntegrationService {
  private pw: PropertyWareAdapter;
  private sf: ServiceFusionAdapter;
  
  async syncData() {
    const pwData = await this.pw.getPortfolios();
    const deduplicated = await this.dedupService.process(pwData);
    const mapped = await this.entityMapper.map(deduplicated);
    await this.sf.createCustomers(mapped);
  }
}
```

## 💡 Benefits of This Approach

### For PMIP (Commercial Product)
- **Protected IP**: Core value remains proprietary
- **Faster iteration**: Single repo for core features
- **Quality control**: You control the entire platform
- **Monetization**: Can charge for the platform while adapters are free

### For Adapters (Open Source)
- **Community contributions**: Others can add features
- **Wider testing**: More users = more bug reports
- **Trust building**: Shows commitment to ecosystem
- **Network effects**: More adapters = more PMIP users

## 📊 Success Metrics

### For PMIP Core
- Customer acquisition
- Revenue growth
- Platform stability
- Feature velocity

### For Open Source Adapters
- GitHub stars
- Contributors
- Pull requests
- npm downloads

## 🎯 Key Decisions

1. ✅ **PMIP stays monolithic** - Simpler, protects IP
2. ✅ **Adapters go open source** - Community benefit
3. ✅ **Clear separation** - Platform vs integrations
4. ✅ **Strategic licensing** - Commercial core, MIT adapters

## 📝 Adapter Interface Contract

Both adapters will implement this interface, making them interchangeable:

```typescript
interface PropertyManagementAdapter {
  // Authentication
  authenticate(): Promise<void>;
  
  // Portfolio Operations
  getPortfolios(options?: PaginationOptions): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio>;
  createPortfolio(data: PortfolioInput): Promise<Portfolio>;
  updatePortfolio(id: string, data: PartialPortfolioInput): Promise<Portfolio>;
  
  // Building Operations
  getBuildings(portfolioId?: string): Promise<Building[]>;
  getBuilding(id: string): Promise<Building>;
  createBuilding(data: BuildingInput): Promise<Building>;
  updateBuilding(id: string, data: PartialBuildingInput): Promise<Building>;
  
  // Work Order Operations
  getWorkOrders(options?: WorkOrderFilters): Promise<WorkOrder[]>;
  getWorkOrder(id: string): Promise<WorkOrder>;
  createWorkOrder(data: WorkOrderInput): Promise<WorkOrder>;
  updateWorkOrder(id: string, data: PartialWorkOrderInput): Promise<WorkOrder>;
  
  // Tenant/Customer Operations
  getTenants(options?: PaginationOptions): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant>;
  createTenant(data: TenantInput): Promise<Tenant>;
  updateTenant(id: string, data: PartialTenantInput): Promise<Tenant>;
  
  // Lease Operations
  getLeases(options?: LeaseFilters): Promise<Lease[]>;
  getLease(id: string): Promise<Lease>;
  createLease(data: LeaseInput): Promise<Lease>;
  updateLease(id: string, data: PartialLeaseInput): Promise<Lease>;
}
```

## 🔒 Security Considerations

### PMIP Core (Private)
- Keep all authentication secrets
- Store API keys securely
- Implement audit logging
- Handle PII data carefully

### Open Source Adapters
- No hardcoded credentials
- Use environment variables
- Document security best practices
- Include example .env files

## 🚦 Next Steps

1. **Immediate**: Set up PropertyWare adapter repository
2. **Week 1**: Extract and test PropertyWare SOAP logic
3. **Week 1-2**: Set up ServiceFusion adapter repository
4. **Week 2**: Extract and test ServiceFusion REST logic
5. **Week 3**: Update PMIP to use external adapters
6. **Week 4**: Documentation and examples

This hybrid approach gives you the best of both worlds:
- Control over your core platform
- Community support for integrations
- Simplicity in management
- Flexibility for growth