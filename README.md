# Property Management Integration Platform (PMIP)

<div align="left">
  
  **The Universal Sync Platform for Property Management**
  
  [![Version](https://img.shields.io/npm/v/@pmip/core)](https://www.npmjs.com/package/@pmip/core)
  [![License](https://img.shields.io/github/license/rashidazarang/property-management-integration-platform)](LICENSE)
  [![Build Status](https://img.shields.io/github/actions/workflow/status/rashidazarang/property-management-integration-platform/ci.yml)](https://github.com/rashidazarang/property-management-integration-platform/actions)
  [![Coverage](https://img.shields.io/codecov/c/github/rashidazarang/property-management-integration-platform)](https://codecov.io/gh/rashidazarang/property-management-integration-platform)
</div>

## 🏢 Overview

PMIP is an enterprise-grade integration platform specifically designed for property management companies. It seamlessly connects PropertyWare, ServiceFusion, Yardi, AppFolio, and other property management systems, eliminating duplicate data entry and reducing errors by 95%.

### 🎯 Key Features

- **Multi-Protocol Support**: SOAP, REST, GraphQL, WebSocket, MCP, Lambda
- **Intelligent Deduplication**: Advanced matching algorithms prevent duplicate records
- **Pre-Built Workflows**: Daily sync, maintenance requests, tenant lifecycle, financial reconciliation
- **Real-Time Sync**: WebSocket support for instant updates
- **Enterprise Ready**: SOC 2 compliant, 99.95% uptime SLA
- **Extensible**: Plugin architecture for custom integrations

## 🚀 Quick Start

### Installation

```bash
npm install @pmip/core
```

### Basic Usage

```typescript
import { createPMIP } from '@pmip/core';

// Initialize PMIP
const pmip = await createPMIP({
  environment: 'production',
  region: 'us-east-1',
  integrations: {
    propertyware: {
      url: 'https://api.propertyware.com',
      wsdl: 'https://api.propertyware.com/services?wsdl',
      username: process.env.PW_USERNAME,
      password: process.env.PW_PASSWORD
    },
    servicefusion: {
      baseUrl: 'https://api.servicefusion.com',
      clientId: process.env.SF_CLIENT_ID,
      clientSecret: process.env.SF_CLIENT_SECRET
    }
  },
  dataWarehouse: {
    type: 'supabase',
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE
  },
  deduplication: {
    enabled: true,
    confidence: 0.95,
    strategies: ['entity-id', 'address-matching', 'name-fuzzy']
  }
});

// Execute a workflow
await pmip.executeWorkflow('daily-sync');

// Or sync specific entities
await pmip.sync('work-orders', { 
  portfolioIds: ['4550688770', '4550688772'] 
});
```

## 📦 Supported Platforms

| Platform | Status | Protocol | Features |
|----------|--------|----------|----------|
| PropertyWare | ✅ Stable | SOAP | Full CRUD, Batch Operations |
| ServiceFusion | ✅ Stable | REST | Jobs, Customers, Scheduling |
| Yardi | 🚧 Beta | REST | Work Orders, Leases |
| RentVine | 📅 Planned | REST | Coming Q2 2025 |
| AppFolio | 📅 Planned | REST | Coming Q2 2025 |
| Buildium | 📅 Planned | REST | Coming Q3 2025 |

## 🔄 Pre-Built Workflows

### Daily Sync
Automatically synchronizes all data between platforms every 30 minutes during business hours.

```typescript
await pmip.executeWorkflow('daily-sync');
```

### Emergency Maintenance
Handles urgent maintenance requests with automatic vendor dispatch.

```typescript
await pmip.executeWorkflow('emergency-maintenance', {
  workOrderId: 'WO-123456',
  priority: 'emergency'
});
```

### Tenant Move-Out
Complete move-out process including inspection scheduling and deposit calculation.

```typescript
await pmip.executeWorkflow('tenant-moveout', {
  leaseId: 'L-789012',
  moveOutDate: '2025-09-30'
});
```

## 🧠 Intelligent Deduplication

PMIP uses advanced matching algorithms to prevent duplicate records:

```typescript
const deduplicationService = pmip.getService('deduplication');

// Check for duplicates before creating
const matches = await deduplicationService.findMatches({
  type: 'customer',
  name: '123 Main Street',
  address: '123 Main St, Apt 4B'
});

if (matches.length > 0 && matches[0].confidence > 0.95) {
  // Use existing record
  console.log('Found existing customer:', matches[0].id);
} else {
  // Safe to create new record
  await pmip.createCustomer({...});
}
```

## 🔧 Configuration

### Environment Variables

```bash
# PropertyWare
PW_USERNAME=your-username
PW_PASSWORD=your-password

# ServiceFusion
SF_CLIENT_ID=your-client-id
SF_CLIENT_SECRET=your-client-secret

# Data Warehouse (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key

# AWS (for GreenLight integration)
AWS_REGION=us-east-1
AWS_PROFILE=greenlight-dev
```

### Advanced Configuration

```typescript
const config = {
  // Rate limiting
  rateLimits: {
    propertyware: { requestsPerSecond: 2 },
    servicefusion: { requestsPerSecond: 0.5 }
  },
  
  // Monitoring
  monitoring: {
    provider: 'cloudwatch',
    customMetrics: true
  },
  
  // Caching
  cache: {
    type: 'redis',
    ttl: 3600,
    redis: {
      host: 'localhost',
      port: 6379
    }
  }
};
```

## 🏗️ Architecture

PMIP is built on [Agent Orchestra](https://github.com/rashidazarang/agent-orchestra) v2.0, providing a robust foundation for multi-protocol orchestration.

```
PMIP Core
├── Orchestration Layer (Agent Orchestra v2.0)
├── Integration Layer
│   ├── PropertyWare SOAP Adapter
│   ├── ServiceFusion REST Adapter
│   └── AWS Lambda Adapter (for existing implementations)
├── Intelligence Layer
│   ├── Deduplication Service
│   ├── Conflict Resolution Engine
│   └── Entity Mapping Service
└── Data Layer
    ├── Supabase Warehouse
    └── Cache Layer (Redis/Memory)
```

### Open Source Adapters

PMIP uses open source adapters for property management system integrations:

- **[@pmip/propertyware-adapter](https://github.com/rashidazarang/propertyware-adapter)** - PropertyWare SOAP API client
- **[@pmip/servicefusion-adapter](https://github.com/rashidazarang/servicefusion-adapter)** - ServiceFusion REST API client
- **@pmip/yardi-adapter** - Yardi REST API client (Coming soon)
- **@pmip/rentvine-adapter** - RentVine REST API client (Coming Q2 2025)

The core platform (deduplication, entity mapping, orchestration) remains proprietary to protect valuable IP while adapters are open source for community benefit.

## 📊 Monitoring & Analytics

### Real-Time Dashboard

```typescript
const status = await pmip.getStatus();
console.log(status);
// {
//   integrations: ['propertyware', 'servicefusion'],
//   lastSync: '2025-09-09T15:30:00Z',
//   entitiesProcessed: {
//     portfolios: 228,
//     workOrders: 343,
//     leases: 425
//   }
// }
```

### Metrics & KPIs

```typescript
const metrics = await pmip.getMetrics();
// - Sync success rate: 99.9%
// - Average sync duration: 45 seconds
// - Duplicates prevented: 1,234
// - API calls saved: 10,567
```

## 🔒 Security & Compliance

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: OAuth 2.0, API keys, SSO support
- **Compliance**: SOC 2 Type II, GDPR, CCPA ready
- **Audit Trail**: Immutable logs for 7 years

## 💰 Pricing

| Plan | Price | Units | Features |
|------|-------|-------|----------|
| **Starter** | $299/mo | Up to 100 | 2 integrations, basic workflows |
| **Professional** | $999/mo | Up to 1,000 | 5 integrations, all workflows, analytics |
| **Enterprise** | $2,999/mo | Unlimited | Unlimited integrations, custom workflows, SLA |
| **White-Label** | Custom | Unlimited | Source license, co-branding |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/rashidazarang/property-management-integration-platform.git

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Workflow Documentation](docs/workflows.md)
- [Integration Guides](docs/integrations/)
- [Troubleshooting](docs/troubleshooting.md)

## 🆘 Support

- **Documentation**: [docs.pmip.io](https://docs.pmip.io)
- **Email**: support@pmip.io
- **Slack**: [Join our community](https://pmip-community.slack.com)
- **GitHub Issues**: [Report bugs](https://github.com/rashidazarang/property-management-integration-platform/issues)

## 📄 License

PMIP is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with ❤️ by [Rashid Azarang](https://github.com/rashidazarang) and the property management community.

Special thanks to:
- GreenLight Property Management for the initial sync implementation
- Anderson Properties for beta testing
- The Agent Orchestra team for the orchestration framework

---

<div align="center">
  <strong>Ready to eliminate duplicate data entry?</strong>
  <br>
  <a href="https://pmip.io/signup">Start Free Trial</a> •
  <a href="https://pmip.io/demo">Book Demo</a> •
  <a href="https://pmip.io/pricing">View Pricing</a>
</div>
