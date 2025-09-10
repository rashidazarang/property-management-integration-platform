/**
 * Type declarations for @rashidazarang/propertyware-adapter
 */

declare module '@rashidazarang/propertyware-adapter' {
  import { EventEmitter } from 'events';

  export interface PropertyWareOptions {
    wsdl?: string;
    wsdlUrl?: string;
    url?: string;
    username: string;
    password: string;
    timeout?: number;
    maxRetries?: number;
    rateLimit?: number;
    debug?: boolean;
    options?: any;
  }

  export interface Portfolio {
    portfolioId: string;
    name: string;
    active: boolean;
    managementFeePercent?: number;
    customFields?: Record<string, any>;
  }

  export interface Building {
    buildingId: string;
    portfolioId: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    active: boolean;
    customFields?: Record<string, any>;
  }

  export interface WorkOrder {
    workOrderId: string;
    buildingId: string;
    portfolioId: string;
    tenantId?: string;
    unitId?: string;
    priority: string;
    status: string;
    description: string;
    category?: string;
    createdDate: Date;
    completedDate?: Date;
    customFields?: Record<string, any>;
  }

  export interface Lease {
    leaseId: string;
    buildingId: string;
    unitId: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    rentAmount: number;
    status: string;
    customFields?: Record<string, any>;
  }

  export interface Tenant {
    tenantId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    customFields?: Record<string, any>;
  }

  export class PropertyWareAdapter extends EventEmitter {
    constructor(options: PropertyWareOptions);
    
    isConnected: boolean;
    
    initialize(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getRateLimitStatus(): any;
    
    // Portfolio methods
    getPortfolios(page?: number, pageSize?: number): Promise<Portfolio[]>;
    getPortfolio(portfolioId: string): Promise<Portfolio>;
    createPortfolio(portfolio: Partial<Portfolio>): Promise<Portfolio>;
    updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<Portfolio>;
    
    // Building methods
    getBuildings(portfolioId?: string, page?: number, pageSize?: number): Promise<Building[]>;
    getBuilding(buildingId: string): Promise<Building>;
    createBuilding(building: Partial<Building>): Promise<Building>;
    updateBuilding(buildingId: string, updates: Partial<Building>): Promise<Building>;
    
    // Work Order methods
    getWorkOrders(filter?: any, page?: number, pageSize?: number): Promise<WorkOrder[]>;
    getWorkOrder(workOrderId: string): Promise<WorkOrder>;
    createWorkOrder(workOrder: Partial<WorkOrder>): Promise<WorkOrder>;
    updateWorkOrder(workOrderId: string, updates: Partial<WorkOrder>): Promise<WorkOrder>;
    
    // Lease methods
    getLeases(buildingId?: string, page?: number, pageSize?: number): Promise<Lease[]>;
    getLease(leaseId: string): Promise<Lease>;
    createLease(lease: Partial<Lease>): Promise<Lease>;
    updateLease(leaseId: string, updates: Partial<Lease>): Promise<Lease>;
    
    // Tenant methods
    getTenants(page?: number, pageSize?: number): Promise<Tenant[]>;
    getTenant(tenantId: string): Promise<Tenant>;
    createTenant(tenant: Partial<Tenant>): Promise<Tenant>;
    updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant>;
    
    // Unit methods
    getUnits(buildingId?: string, page?: number, pageSize?: number): Promise<any[]>;
    
    // Vendor methods
    getVendors(page?: number, pageSize?: number): Promise<any[]>;
    
    // Contact methods
    getContacts(page?: number, pageSize?: number): Promise<any[]>;
    
    // Owner methods
    getOwners(page?: number, pageSize?: number): Promise<any[]>;
    
    // Prospect methods
    getProspects(page?: number, pageSize?: number): Promise<any[]>;
    
    // Batch operations
    batchSync(entityType: string, entities: any[]): Promise<any>;
    getAllEntities(entityType: string): Promise<any[]>;
    searchEntities(entityType: string, query: any): Promise<any[]>;
    
    // Events
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'retry', listener: (attempt: number, error: Error) => void): this;
    on(event: 'rateLimit', listener: () => void): this;
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'sync:started', listener: (data: any) => void): this;
    on(event: 'sync:progress', listener: (data: any) => void): this;
    on(event: 'sync:completed', listener: (data: any) => void): this;
    on(event: 'sync:error', listener: (data: any) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export default PropertyWareAdapter;
}