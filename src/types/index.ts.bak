/**
 * PMIP Type Definitions
 */

export interface PMIPConfig {
  // Core configuration
  environment: 'development' | 'staging' | 'production';
  region: string;
  
  // Integration configurations
  integrations: {
    propertyware?: PropertyWareConfig;
    servicefusion?: ServiceFusionConfig;
    greenlight?: GreenlightConfig;
    yardi?: YardiConfig;
    appfolio?: AppFolioConfig;
  };
  
  // Data warehouse configuration
  dataWarehouse: DataWarehouseConfig;
  
  // Deduplication settings
  deduplication: DeduplicationConfig;
  
  // Rate limiting
  rateLimits?: RateLimitConfig;
  
  // Monitoring
  monitoring?: MonitoringConfig;
}

export interface PMIPOptions {
  // Reuse existing GreenLight Lambda functions
  reuseGreenlight?: boolean;
  
  // Enable dry run mode
  dryRun?: boolean;
  
  // Custom logger
  logger?: any;
  
  // Cache configuration
  cache?: CacheConfig;
}

export interface PropertyWareConfig {
  url: string;
  wsdl: string;
  username: string;
  password: string;
  maxRetries?: number;
  timeout?: number;
}

export interface ServiceFusionConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  maxRetries?: number;
  timeout?: number;
}

export interface GreenlightConfig {
  region: string;
  profile?: string;
  functions: {
    workorders: string;
    leases: string;
    tenants: string;
    web: string;
  };
  snsTopic: string;
}

export interface YardiConfig {
  baseUrl: string;
  apiKey: string;
  propertyId: string;
}

export interface AppFolioConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
}

export interface DataWarehouseConfig {
  type: 'supabase' | 'postgres' | 'mysql';
  url: string;
  key?: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface DeduplicationConfig {
  enabled: boolean;
  confidence: number; // 0-1 threshold
  strategies: DeduplicationStrategy[];
  cache?: boolean;
}

export type DeduplicationStrategy = 
  | 'entity-id'
  | 'address-matching'
  | 'name-fuzzy'
  | 'phone-email'
  | 'parent-child'
  | 'work-order-history';

export interface RateLimitConfig {
  propertyware?: RateLimit;
  servicefusion?: RateLimit;
  yardi?: RateLimit;
  global?: RateLimit;
}

export interface RateLimit {
  requestsPerSecond: number;
  burst?: number;
  retryAfter?: number;
}

export interface MonitoringConfig {
  provider: 'cloudwatch' | 'datadog' | 'newrelic';
  apiKey?: string;
  customMetrics?: boolean;
}

export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl?: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

// Workflow types
export interface Workflow {
  name: string;
  description?: string;
  schedule?: string;
  trigger?: 'manual' | 'event' | 'schedule';
  steps: WorkflowStep[];
  errorHandler?: WorkflowStep;
  retryPolicy?: RetryPolicy;
}

export interface WorkflowStep {
  action: string;
  params?: any;
  condition?: string;
  parallel?: boolean;
  timeout?: number;
  retries?: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay?: number;
}

// Entity types (from GreenLight)
export interface Portfolio {
  portfolioId: string;
  name: string;
  active: boolean;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  buildingId: string;
  buildingKey: string;
  portfolioKey: string;
  buildingName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  unitCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  workOrderId: string;
  buildingId: string;
  portfolioId: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Normal' | 'High' | 'Emergency';
  category?: string;
  assignedVendor?: string;
  sfJobId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Lease {
  leaseId: string;
  buildingId: string;
  unitId?: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  status: 'Active' | 'Expired' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  customerId: string;
  customerName: string;
  customerType: 'portfolio' | 'building' | 'unit' | 'tenant';
  parentCustomerId?: string;
  sfCustomerId?: string;
  pwEntityId?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  jobId: string;
  checkNumber: string;
  customerId: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  technicianId?: string;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Event types
export interface SyncEvent {
  type: 'started' | 'progress' | 'completed' | 'error';
  workflow: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

export interface DeduplicationEvent {
  type: 'duplicate-detected' | 'merge-required' | 'conflict';
  entity: string;
  entityId: string;
  matches: any[];
  confidence: number;
  resolution?: 'merge' | 'skip' | 'create';
}