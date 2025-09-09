/**
 * ServiceFusion REST Integration for PMIP
 * Handles all ServiceFusion API interactions
 */

import axios, { AxiosInstance } from 'axios';
import { ServiceFusionConfig } from '../../types';
import { logger } from '../../utils/logger';
import { RateLimiter } from '../../utils/rate-limiter';

export class ServiceFusionIntegration {
  private config: ServiceFusionConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private rateLimiter: RateLimiter;
  
  constructor(config: ServiceFusionConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(0.5); // 0.5 requests per second (conservative)
    
    // Create axios instance
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.accessToken = null;
          await this.authenticate();
          error.config.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.client.request(error.config);
        }
        throw error;
      }
    );
  }
  
  /**
   * Initialize ServiceFusion integration
   */
  async initialize(): Promise<void> {
    await this.authenticate();
    logger.info('ServiceFusion integration initialized');
  }
  
  /**
   * Authenticate with ServiceFusion OAuth2
   */
  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'read write'
      });
      
      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      logger.info('ServiceFusion authentication successful');
    } catch (error) {
      logger.error('Failed to authenticate with ServiceFusion', error);
      throw error;
    }
  }
  
  /**
   * Ensure we have a valid token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }
  
  /**
   * Get customers from ServiceFusion
   */
  async getCustomers(params?: any): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.get('/customers', {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 100,
          include: 'contacts,locations',
          active: params?.active !== false
        }
      });
      
      return this.normalizeCustomers(response.data.data || []);
    } catch (error) {
      logger.error('Failed to get customers from ServiceFusion', error);
      throw error;
    }
  }
  
  /**
   * Get jobs from ServiceFusion
   */
  async getJobs(params?: any): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.get('/jobs', {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 100,
          status: params?.status,
          customer_id: params?.customerId,
          start_date: params?.startDate,
          end_date: params?.endDate,
          include: 'customer,location,technician'
        }
      });
      
      return this.normalizeJobs(response.data.data || []);
    } catch (error) {
      logger.error('Failed to get jobs from ServiceFusion', error);
      throw error;
    }
  }
  
  /**
   * Create customer in ServiceFusion
   */
  async createCustomer(customer: any): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const sfCustomer = {
        company_name: customer.customerName || customer.name,
        customer_type: this.mapCustomerType(customer.customerType),
        status: 'active',
        contact: {
          first_name: customer.contactFirstName || customer.ownerFirstName,
          last_name: customer.contactLastName || customer.ownerLastName,
          email: customer.email || customer.ownerEmail,
          phone: customer.phone || customer.ownerPhone
        },
        location: {
          name: customer.locationName || 'Primary',
          address1: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zip
        },
        custom_fields: {
          pw_entity_id: customer.pwEntityId,
          portfolio_id: customer.portfolioId,
          building_id: customer.buildingId
        }
      };
      
      const response = await this.client.post('/customers', sfCustomer);
      
      logger.info(`Created ServiceFusion customer: ${response.data.id}`);
      return this.normalizeCustomer(response.data);
    } catch (error) {
      logger.error('Failed to create customer in ServiceFusion', error);
      throw error;
    }
  }
  
  /**
   * Create job in ServiceFusion
   */
  async createJob(job: any): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const sfJob = {
        check_number: job.checkNumber || `WO-${job.workOrderId}`,
        customer_id: job.customerId,
        location_id: job.locationId,
        description: job.description,
        status: this.mapJobStatus(job.status),
        priority: this.mapPriority(job.priority),
        category: job.category || 'Maintenance',
        scheduled_date: job.scheduledDate || new Date(),
        technician_id: job.technicianId,
        custom_fields: {
          pw_work_order_id: job.workOrderId,
          portfolio_id: job.portfolioId,
          building_id: job.buildingId,
          unit_id: job.unitId
        }
      };
      
      const response = await this.client.post('/jobs', sfJob);
      
      logger.info(`Created ServiceFusion job: ${response.data.id}`);
      return this.normalizeJob(response.data);
    } catch (error) {
      logger.error('Failed to create job in ServiceFusion', error);
      throw error;
    }
  }
  
  /**
   * Create urgent job in ServiceFusion
   */
  async createUrgentJob(job: any): Promise<any> {
    // Set urgent priority and immediate scheduling
    const urgentJob = {
      ...job,
      priority: 'emergency',
      scheduledDate: new Date(),
      notes: `URGENT: ${job.description}`
    };
    
    return this.createJob(urgentJob);
  }
  
  /**
   * Create inspection job in ServiceFusion
   */
  async createInspectionJob(inspection: any): Promise<any> {
    const inspectionJob = {
      checkNumber: `INSP-${inspection.leaseId}`,
      customerId: inspection.customerId,
      locationId: inspection.locationId,
      description: `${inspection.type} Inspection`,
      category: 'Inspection',
      scheduledDate: inspection.date,
      notes: inspection.notes
    };
    
    return this.createJob(inspectionJob);
  }
  
  /**
   * Update job in ServiceFusion
   */
  async updateJob(jobId: string, updates: any): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.patch(`/jobs/${jobId}`, updates);
      
      logger.info(`Updated ServiceFusion job: ${jobId}`);
      return this.normalizeJob(response.data);
    } catch (error) {
      logger.error(`Failed to update job ${jobId}`, error);
      throw error;
    }
  }
  
  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.get(`/customers/${customerId}`, {
        params: { include: 'contacts,locations' }
      });
      
      return this.normalizeCustomer(response.data);
    } catch (error) {
      logger.error(`Failed to get customer ${customerId}`, error);
      throw error;
    }
  }
  
  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.get(`/jobs/${jobId}`, {
        params: { include: 'customer,location,technician' }
      });
      
      return this.normalizeJob(response.data);
    } catch (error) {
      logger.error(`Failed to get job ${jobId}`, error);
      throw error;
    }
  }
  
  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const response = await this.client.get('/customers/search', {
        params: {
          q: query,
          limit: 50
        }
      });
      
      return this.normalizeCustomers(response.data.data || []);
    } catch (error) {
      logger.error('Failed to search customers', error);
      throw error;
    }
  }
  
  // Normalization methods
  
  private normalizeCustomers(customers: any[]): any[] {
    return customers.map(c => this.normalizeCustomer(c));
  }
  
  private normalizeCustomer(customer: any): any {
    return {
      customerId: customer.id,
      customerName: customer.company_name,
      customerType: customer.customer_type,
      status: customer.status,
      contact: customer.contact ? {
        firstName: customer.contact.first_name,
        lastName: customer.contact.last_name,
        email: customer.contact.email,
        phone: customer.contact.phone
      } : null,
      location: customer.location ? {
        id: customer.location.id,
        name: customer.location.name,
        address: customer.location.address1,
        city: customer.location.city,
        state: customer.location.state,
        zip: customer.location.zip
      } : null,
      customFields: customer.custom_fields || {},
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at)
    };
  }
  
  private normalizeJobs(jobs: any[]): any[] {
    return jobs.map(j => this.normalizeJob(j));
  }
  
  private normalizeJob(job: any): any {
    return {
      jobId: job.id,
      checkNumber: job.check_number,
      customerId: job.customer_id,
      locationId: job.location_id,
      description: job.description,
      status: job.status,
      priority: job.priority,
      category: job.category,
      scheduledDate: job.scheduled_date ? new Date(job.scheduled_date) : null,
      completedDate: job.completed_date ? new Date(job.completed_date) : null,
      technicianId: job.technician_id,
      technicianName: job.technician?.name,
      customerName: job.customer?.company_name,
      locationAddress: job.location?.address1,
      customFields: job.custom_fields || {},
      notes: job.notes,
      totalAmount: parseFloat(job.total_amount) || 0,
      createdAt: new Date(job.created_at),
      updatedAt: new Date(job.updated_at)
    };
  }
  
  private mapCustomerType(type: string): string {
    const mapping: Record<string, string> = {
      'portfolio': 'property_manager',
      'building': 'commercial',
      'unit': 'residential',
      'tenant': 'residential'
    };
    return mapping[type] || 'commercial';
  }
  
  private mapJobStatus(status: string): string {
    const mapping: Record<string, string> = {
      'Open': 'scheduled',
      'In Progress': 'in_progress',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    return mapping[status] || 'scheduled';
  }
  
  private mapPriority(priority: string): string {
    const mapping: Record<string, string> = {
      'Low': 'low',
      'Normal': 'normal',
      'High': 'high',
      'Emergency': 'emergency'
    };
    return mapping[priority] || 'normal';
  }
  
  /**
   * Disconnect from ServiceFusion
   */
  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    logger.info('ServiceFusion integration disconnected');
  }
}