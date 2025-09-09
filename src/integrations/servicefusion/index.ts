/**
 * ServiceFusion Integration Wrapper for PMIP
 * Uses the external @rashidazarang/servicefusion-adapter npm package
 */

import { ServiceFusionAdapter } from '@rashidazarang/servicefusion-adapter';
import { ServiceFusionConfig } from '../../types';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

export class ServiceFusionIntegration extends EventEmitter {
  private adapter: ServiceFusionAdapter;
  private config: ServiceFusionConfig;
  private isInitialized: boolean = false;
  
  constructor(config: ServiceFusionConfig) {
    super();
    this.config = config;
    
    // Initialize the external adapter
    this.adapter = new ServiceFusionAdapter({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl || 'https://api.servicefusion.com/v1',
      options: {
        rateLimit: config.rateLimit || 0.5,
        retryAttempts: config.retryAttempts || 3,
        timeout: config.timeout || 30000,
        autoRefreshToken: config.autoRefreshToken !== false,
        maxConcurrent: config.maxConcurrent || 2
      }
    });
    
    // Forward adapter events
    this.setupEventForwarding();
  }
  
  /**
   * Initialize ServiceFusion adapter
   */
  async initialize(): Promise<void> {
    try {
      await this.adapter.connect();
      this.isInitialized = true;
      logger.info('ServiceFusion integration initialized using external adapter');
    } catch (error) {
      logger.error('Failed to initialize ServiceFusion integration', error);
      throw error;
    }
  }
  
  /**
   * Setup event forwarding from adapter to PMIP
   */
  private setupEventForwarding(): void {
    // Forward connection events
    this.adapter.on('connected', () => {
      this.emit('connected');
      logger.debug('ServiceFusion adapter connected');
    });
    
    this.adapter.on('disconnected', () => {
      this.emit('disconnected');
      logger.debug('ServiceFusion adapter disconnected');
    });
    
    this.adapter.on('auth-error', (error) => {
      this.emit('auth-error', error);
      logger.error('ServiceFusion authentication error', error);
    });
    
    this.adapter.on('error', (error) => {
      this.emit('error', error);
      logger.error('ServiceFusion adapter error', error);
    });
    
    // Forward rate limit events
    this.adapter.on('rate-limit-error', (error) => {
      this.emit('rate-limit-error', error);
      logger.warn('ServiceFusion rate limit error', error);
    });
    
    this.adapter.on('rate-limit-depleted', () => {
      this.emit('rate-limit-depleted');
      logger.warn('ServiceFusion rate limit depleted');
    });
    
    // Forward sync events
    this.adapter.on('sync-error', (data) => {
      this.emit('sync-error', data);
      logger.error('ServiceFusion sync error', data);
    });
    
    // Forward request/response events for debugging
    this.adapter.on('request', (data) => {
      this.emit('request', data);
      logger.debug('ServiceFusion request', data);
    });
    
    this.adapter.on('response', (data) => {
      this.emit('response', data);
      logger.debug('ServiceFusion response', data);
    });
  }
  
  /**
   * Get customers from ServiceFusion
   */
  async getCustomers(options?: any): Promise<any[]> {
    return this.adapter.getCustomers(options);
  }
  
  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<any> {
    return this.adapter.getCustomer(id);
  }
  
  /**
   * Create customer in ServiceFusion
   */
  async createCustomer(data: any): Promise<any> {
    return this.adapter.createCustomer(data);
  }
  
  /**
   * Update customer in ServiceFusion
   */
  async updateCustomer(id: string, data: any): Promise<any> {
    return this.adapter.updateCustomer(id, data);
  }
  
  /**
   * Delete customer from ServiceFusion
   */
  async deleteCustomer(id: string): Promise<void> {
    return this.adapter.deleteCustomer(id);
  }
  
  /**
   * Search customers with filters
   */
  async searchCustomers(filters: any): Promise<any[]> {
    return this.adapter.searchCustomers(filters);
  }
  
  /**
   * Get jobs from ServiceFusion
   */
  async getJobs(filters?: any): Promise<any[]> {
    return this.adapter.getJobs(filters);
  }
  
  /**
   * Get job by ID
   */
  async getJob(id: string): Promise<any> {
    return this.adapter.getJob(id);
  }
  
  /**
   * Create job in ServiceFusion
   */
  async createJob(data: any): Promise<any> {
    return this.adapter.createJob(data);
  }
  
  /**
   * Update job in ServiceFusion
   */
  async updateJob(id: string, data: any): Promise<any> {
    return this.adapter.updateJob(id, data);
  }
  
  /**
   * Delete job from ServiceFusion
   */
  async deleteJob(id: string): Promise<void> {
    return this.adapter.deleteJob(id);
  }
  
  /**
   * Search jobs with advanced filters
   */
  async searchJobs(filters: any): Promise<any[]> {
    return this.adapter.searchJobs(filters);
  }
  
  /**
   * Get all jobs (handles pagination automatically)
   */
  async getAllJobs(filters?: any): Promise<any[]> {
    return this.adapter.getAllJobs(filters);
  }
  
  /**
   * Batch sync jobs from external system
   */
  async batchSyncJobs(jobs: any[], options: any): Promise<any> {
    return this.adapter.batchSyncJobs(jobs, options);
  }
  
  /**
   * Get estimates from ServiceFusion
   */
  async getEstimates(jobId?: string): Promise<any[]> {
    return this.adapter.getEstimates(jobId);
  }
  
  /**
   * Get estimate by ID
   */
  async getEstimate(id: string): Promise<any> {
    return this.adapter.getEstimate(id);
  }
  
  /**
   * Create estimate in ServiceFusion
   */
  async createEstimate(data: any): Promise<any> {
    return this.adapter.createEstimate(data);
  }
  
  /**
   * Update estimate in ServiceFusion
   */
  async updateEstimate(id: string, data: any): Promise<any> {
    return this.adapter.updateEstimate(id, data);
  }
  
  /**
   * Convert estimate to job
   */
  async convertEstimateToJob(id: string): Promise<any> {
    return this.adapter.convertEstimateToJob(id);
  }
  
  /**
   * Get invoices from ServiceFusion
   */
  async getInvoices(filters?: any): Promise<any[]> {
    return this.adapter.getInvoices(filters);
  }
  
  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<any> {
    return this.adapter.getInvoice(id);
  }
  
  /**
   * Create invoice in ServiceFusion
   */
  async createInvoice(data: any): Promise<any> {
    return this.adapter.createInvoice(data);
  }
  
  /**
   * Update invoice in ServiceFusion
   */
  async updateInvoice(id: string, data: any): Promise<any> {
    return this.adapter.updateInvoice(id, data);
  }
  
  /**
   * Send invoice via email
   */
  async sendInvoice(id: string, email: string): Promise<void> {
    return this.adapter.sendInvoice(id, email);
  }
  
  /**
   * Get technicians from ServiceFusion
   */
  async getTechnicians(options?: any): Promise<any[]> {
    return this.adapter.getTechnicians(options);
  }
  
  /**
   * Get technician by ID
   */
  async getTechnician(id: string): Promise<any> {
    return this.adapter.getTechnician(id);
  }
  
  /**
   * Get technician schedule
   */
  async getSchedule(technicianId: string, date: Date): Promise<any> {
    return this.adapter.getSchedule(technicianId, date);
  }
  
  /**
   * Assign job to technician
   */
  async assignJob(jobId: string, technicianId: string): Promise<any> {
    return this.adapter.assignJob(jobId, technicianId);
  }
  
  /**
   * Create webhook subscription
   */
  async createWebhook(data: any): Promise<any> {
    return this.adapter.createWebhook(data);
  }
  
  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<any[]> {
    return this.adapter.getWebhooks();
  }
  
  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    return this.adapter.deleteWebhook(id);
  }
  
  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): any {
    return this.adapter.getRateLimitStatus();
  }
  
  /**
   * Get adapter status
   */
  getStatus(): any {
    return {
      isConnected: this.adapter.isConnected(),
      isInitialized: this.isInitialized,
      rateLimitStatus: this.adapter.getRateLimitStatus()
    };
  }
  
  /**
   * Disconnect from ServiceFusion
   */
  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
    this.isInitialized = false;
    logger.info('ServiceFusion integration disconnected');
  }
  
  /**
   * Get the underlying adapter instance (for advanced usage)
   */
  getAdapter(): ServiceFusionAdapter {
    return this.adapter;
  }
}