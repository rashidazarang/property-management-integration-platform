/**
 * Type declarations for @rashidazarang/servicefusion-adapter
 */

declare module '@rashidazarang/servicefusion-adapter' {
  import { EventEmitter } from 'events';

  export interface ServiceFusionOptions {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    rateLimit?: number;
    debug?: boolean;
    autoRefreshToken?: boolean;
    options?: any;
  }

  export interface Customer {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    active: boolean;
    customFields?: Record<string, any>;
  }

  export interface Job {
    id: string;
    customerId: string;
    status: string;
    priority?: string;
    description: string;
    scheduledDate?: Date;
    completedDate?: Date;
    technicianId?: string;
    workOrderId?: string;
    customFields?: Record<string, any>;
  }

  export interface Technician {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    active: boolean;
  }

  export interface Invoice {
    id: string;
    jobId: string;
    customerId: string;
    amount: number;
    date: Date;
    status: string;
    lineItems?: any[];
  }

  export class ServiceFusionAdapter extends EventEmitter {
    constructor(options: ServiceFusionOptions);
    
    isConnected: boolean;
    
    authenticate(): Promise<void>;
    connect(): Promise<void>;
    refreshToken(): Promise<void>;
    disconnect(): Promise<void>;
    getRateLimitStatus(): any;
    
    // Customer methods
    getCustomers(page?: number, limit?: number): Promise<Customer[]>;
    getCustomer(customerId: string): Promise<Customer>;
    createCustomer(customer: Partial<Customer>): Promise<Customer>;
    updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer>;
    deleteCustomer(customerId: string): Promise<void>;
    searchCustomers(query: string): Promise<Customer[]>;
    
    // Job methods
    getJobs(filter?: any, page?: number, limit?: number): Promise<Job[]>;
    getAllJobs(filter?: any): Promise<Job[]>;
    getJob(jobId: string): Promise<Job>;
    createJob(job: Partial<Job>): Promise<Job>;
    updateJob(jobId: string, updates: Partial<Job>): Promise<Job>;
    deleteJob(jobId: string): Promise<void>;
    searchJobs(query: string): Promise<Job[]>;
    batchSyncJobs(jobs: any[]): Promise<any>;
    
    // Technician methods
    getTechnicians(page?: number, limit?: number): Promise<Technician[]>;
    getTechnician(technicianId: string): Promise<Technician>;
    createTechnician(technician: Partial<Technician>): Promise<Technician>;
    updateTechnician(technicianId: string, updates: Partial<Technician>): Promise<Technician>;
    
    // Estimate methods
    getEstimates(filter?: any, page?: number, limit?: number): Promise<any[]>;
    getEstimate(estimateId: string): Promise<any>;
    createEstimate(estimate: any): Promise<any>;
    updateEstimate(estimateId: string, updates: any): Promise<any>;
    convertEstimateToJob(estimateId: string): Promise<Job>;
    
    // Invoice methods
    getInvoices(filter?: any, page?: number, limit?: number): Promise<Invoice[]>;
    getInvoice(invoiceId: string): Promise<Invoice>;
    createInvoice(invoice: Partial<Invoice>): Promise<Invoice>;
    updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice>;
    sendInvoice(invoiceId: string): Promise<void>;
    
    // Schedule methods
    getSchedule(technicianId?: string, date?: Date): Promise<any>;
    assignJob(jobId: string, technicianId: string): Promise<void>;
    
    // Webhook methods
    createWebhook(webhook: any): Promise<any>;
    getWebhooks(): Promise<any[]>;
    deleteWebhook(webhookId: string): Promise<void>;
    
    // Events
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'retry', listener: (attempt: number, error: Error) => void): this;
    on(event: 'rateLimit', listener: () => void): this;
    on(event: 'authenticated', listener: () => void): this;
    on(event: 'tokenRefreshed', listener: () => void): this;
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'auth-error', listener: (error: any) => void): this;
    on(event: 'rate-limit-error', listener: (error: any) => void): this;
    on(event: 'rate-limit-depleted', listener: () => void): this;
    on(event: 'sync-error', listener: (data: any) => void): this;
    on(event: 'request', listener: (data: any) => void): this;
    on(event: 'response', listener: (data: any) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export default ServiceFusionAdapter;
}