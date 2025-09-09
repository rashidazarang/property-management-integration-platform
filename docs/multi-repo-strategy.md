# Multi-Repository Strategy for PMIP Ecosystem

## Overview
Instead of a monolithic repository, we'll create an ecosystem of independent, composable packages that work together seamlessly.

## Proposed Repository Structure

### Core Repositories

#### 1. **pmip-core** (Main Platform)
```
github.com/rashidazarang/pmip-core
```
- Main orchestration platform
- Depends on Agent Orchestra
- Service discovery and registration
- Workflow engine
- Documentation hub

#### 2. **pmip-dedup-service** (Deduplication Service)
```
github.com/rashidazarang/pmip-dedup-service
```
- Standalone deduplication engine
- Multiple matching strategies
- Can be used independently
- Published as `@pmip/dedup-service`

#### 3. **pmip-entity-mapper** (Entity Mapping Service)
```
github.com/rashidazarang/pmip-entity-mapper
```
- Entity relationship mapping
- Building → Customer mapping logic
- Published as `@pmip/entity-mapper`

#### 4. **pmip-rate-limiter** (Rate Limiting Service)
```
github.com/rashidazarang/pmip-rate-limiter
```
- Multi-provider rate limiting
- Configurable per API
- Published as `@pmip/rate-limiter`

### API Adapter Repositories

#### 5. **propertyware-adapter**
```
github.com/rashidazarang/propertyware-adapter
```
- PropertyWare SOAP API client
- Rate limiting built-in (2 req/s)
- Batch operations support
- Published as `@pmip/propertyware-adapter`

#### 6. **servicefusion-adapter**
```
github.com/rashidazarang/servicefusion-adapter
```
- ServiceFusion REST API client
- OAuth 2.0 authentication
- Rate limiting (0.5 req/s)
- Published as `@pmip/servicefusion-adapter`

#### 7. **yardi-adapter**
```
github.com/rashidazarang/yardi-adapter
```
- Yardi REST API client
- Published as `@pmip/yardi-adapter`

#### 8. **rentvine-adapter**
```
github.com/rashidazarang/rentvine-adapter
```
- RentVine REST API client
- Published as `@pmip/rentvine-adapter`

### MCP Wrapper Repositories (Optional)

#### 9. **propertyware-mcp**
```
github.com/rashidazarang/propertyware-mcp
```
- MCP server wrapping PropertyWare adapter
- Uses `@pmip/propertyware-adapter`
- Published as `@pmip/propertyware-mcp`

#### 10. **servicefusion-mcp**
```
github.com/rashidazarang/servicefusion-mcp
```
- MCP server wrapping ServiceFusion adapter
- Uses `@pmip/servicefusion-adapter`
- Published as `@pmip/servicefusion-mcp`

## Benefits of Multi-Repo Approach

### 1. **Independence**
- Each adapter can evolve independently
- Different release cycles
- Separate issue tracking
- Independent versioning

### 2. **Flexibility**
- Users can pick only what they need
- Smaller dependencies
- Easier to contribute to specific adapters
- Different maintainers per adapter

### 3. **Testing**
- Isolated test suites
- Faster CI/CD pipelines
- Easier to mock dependencies
- Independent integration tests

### 4. **Licensing**
- Different licenses if needed
- Some could be MIT, others commercial
- Proprietary adapters possible

### 5. **Community**
- Contributors can focus on their expertise
- Easier to become a maintainer
- Clearer ownership
- Specialized documentation

## Dependency Graph

```
pmip-core
├── @pmip/dedup-service
├── @pmip/entity-mapper
├── @pmip/rate-limiter
├── @pmip/propertyware-adapter (optional)
├── @pmip/servicefusion-adapter (optional)
└── @agent-orchestra/core

propertyware-mcp
├── @pmip/propertyware-adapter
└── @modelcontextprotocol/sdk

servicefusion-mcp
├── @pmip/servicefusion-adapter
└── @modelcontextprotocol/sdk
```

## Usage Examples

### Example 1: Using Just Adapters
```typescript
// User only needs PropertyWare integration
npm install @pmip/propertyware-adapter @pmip/dedup-service

import { PropertyWareAdapter } from '@pmip/propertyware-adapter';
import { DedupService } from '@pmip/dedup-service';

const pw = new PropertyWareAdapter(config);
const dedup = new DedupService();

const portfolios = await pw.getPortfolios();
const unique = await dedup.deduplicate(portfolios);
```

### Example 2: Using Full PMIP
```typescript
// User wants complete platform
npm install @pmip/core

import { createPMIP } from '@pmip/core';

const pmip = await createPMIP({
  adapters: ['propertyware', 'servicefusion'],
  services: ['dedup', 'mapper', 'rate-limiter']
});

await pmip.executeWorkflow('daily-sync');
```

### Example 3: Using MCP Servers
```typescript
// User wants MCP compatibility
npm install @pmip/propertyware-mcp

// Use with Claude, Cursor, or any MCP client
mcp install @pmip/propertyware-mcp
```

## Migration Plan

### Phase 1: Core Services (Week 1)
1. Create `pmip-dedup-service` repo
2. Create `pmip-entity-mapper` repo
3. Create `pmip-rate-limiter` repo
4. Extract and migrate code

### Phase 2: API Adapters (Week 2)
1. Create `propertyware-adapter` repo
2. Create `servicefusion-adapter` repo
3. Extract SOAP/REST logic from Lambda
4. Add comprehensive tests

### Phase 3: Integration (Week 3)
1. Update `pmip-core` to use services
2. Create example applications
3. Write integration tests
4. Documentation

### Phase 4: MCP Wrappers (Week 4)
1. Create MCP wrapper repos
2. Implement MCP protocol
3. Test with Claude/Cursor
4. Publish to MCP registry

## Repository Templates

Each repository will follow this structure:
```
repo-name/
├── src/
│   ├── index.ts
│   └── ...
├── tests/
├── examples/
├── docs/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── .github/
    └── workflows/
        ├── ci.yml
        └── release.yml
```

## Versioning Strategy

- **Semantic Versioning**: All packages use SemVer
- **Independent Versions**: Each package versions independently
- **Compatibility Matrix**: Document which versions work together
- **LTS Versions**: Mark stable combinations as LTS

## Questions to Decide

1. **Monorepo tools**: Should we use Lerna/Nx for some coordination?
2. **Shared configs**: Centralized ESLint/TypeScript configs?
3. **Documentation site**: Single docs site or per-repo?
4. **NPM organization**: Create `@pmip` organization?
5. **GitHub organization**: Create dedicated GitHub org?

## Recommendation

I recommend the **multi-repo approach** because:
1. ✅ Maximum flexibility for users
2. ✅ Easier to maintain and contribute
3. ✅ Better separation of concerns
4. ✅ Can start small and grow
5. ✅ Different pricing/licensing options
6. ✅ Cleaner dependency management

The only downside is more repos to manage, but this can be mitigated with:
- GitHub templates for consistency
- Automated release workflows
- Shared CI/CD configurations
- Clear documentation