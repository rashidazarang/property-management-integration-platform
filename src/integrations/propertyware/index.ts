/**
 * PropertyWare Integration Wrapper for PMIP
 * Uses the external @rashidazarang/propertyware-adapter npm package
 */

import { PropertyWareAdapter } from '@rashidazarang/propertyware-adapter';
import { PropertyWareConfig } from '../../types';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

export class PropertyWareIntegration extends EventEmitter {
  private adapter: PropertyWareAdapter;
  private config: PropertyWareConfig;
  private isInitialized: boolean = false;
  
  constructor(config: PropertyWareConfig) {
    super();
    this.config = config;
    
    // Initialize the external adapter
    this.adapter = new PropertyWareAdapter({
      wsdl: config.wsdl,
      url: config.url,
      username: config.username,
      password: config.password,
      options: {
        rateLimit: config.rateLimit || 2,
        retryAttempts: config.retryAttempts || 3,
        timeout: config.timeout || 30000,
        batchSize: config.batchSize || 100
      }
    });
    
    // Forward adapter events
    this.setupEventForwarding();
  }
  
  /**
   * Initialize PropertyWare adapter
   */
  async initialize(): Promise<void> {
    try {
      await this.adapter.connect();
      this.isInitialized = true;
      logger.info('PropertyWare integration initialized using external adapter');
    } catch (error) {
      logger.error('Failed to initialize PropertyWare integration', error);
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
      logger.debug('PropertyWare adapter connected');
    });
    
    this.adapter.on('disconnected', () => {
      this.emit('disconnected');
      logger.debug('PropertyWare adapter disconnected');
    });
    
    this.adapter.on('error', (error) => {
      this.emit('error', error);
      logger.error('PropertyWare adapter error', error);
    });
    
    // Forward sync events
    this.adapter.on('sync:started', (data) => {
      this.emit('sync:started', data);
    });
    
    this.adapter.on('sync:progress', (data) => {
      this.emit('sync:progress', data);
    });
    
    this.adapter.on('sync:completed', (data) => {
      this.emit('sync:completed', data);
    });
    
    this.adapter.on('sync:error', (data) => {
      this.emit('sync:error', data);
    });
  }
  
  /**
   * Get portfolios from PropertyWare
   */
  async getPortfolios(options?: any): Promise<any[]> {
    return this.adapter.getPortfolios(options);
  }
  
  /**
   * Get buildings from PropertyWare
   */
  async getBuildings(portfolioId?: string): Promise<any[]> {
    return this.adapter.getBuildings(portfolioId);
  }
  
  /**
   * Get units from PropertyWare
   */
  async getUnits(buildingId?: string): Promise<any[]> {
    return this.adapter.getUnits(buildingId);
  }
  
  /**
   * Get leases from PropertyWare
   */
  async getLeases(options?: any): Promise<any[]> {
    return this.adapter.getLeases(options);
  }
  
  /**
   * Get work orders from PropertyWare
   */
  async getWorkOrders(options?: any): Promise<any[]> {
    return this.adapter.getWorkOrders(options);
  }
  
  /**
   * Create work order in PropertyWare
   */
  async createWorkOrder(data: any): Promise<any> {
    return this.adapter.createWorkOrder(data);
  }
  
  /**
   * Update work order in PropertyWare
   */
  async updateWorkOrder(id: string, data: any): Promise<any> {
    return this.adapter.updateWorkOrder(id, data);
  }
  
  /**
   * Get vendors from PropertyWare
   */
  async getVendors(options?: any): Promise<any[]> {
    return this.adapter.getVendors(options);
  }
  
  /**
   * Get contacts from PropertyWare
   */
  async getContacts(options?: any): Promise<any[]> {
    return this.adapter.getContacts(options);
  }
  
  /**
   * Get owners from PropertyWare
   */
  async getOwners(options?: any): Promise<any[]> {
    return this.adapter.getOwners(options);
  }
  
  /**
   * Get prospects from PropertyWare
   */
  async getProspects(options?: any): Promise<any[]> {
    return this.adapter.getProspects(options);
  }
  
  /**
   * Batch sync entities from PropertyWare
   */
  async batchSync(entityType: string, options?: any): Promise<any> {
    return this.adapter.batchSync(entityType, options);
  }
  
  /**
   * Get all entities (paginated automatically)
   */
  async getAllEntities(entityType: string, options?: any): Promise<any[]> {
    return this.adapter.getAllEntities(entityType, options);
  }
  
  /**
   * Search entities with filters
   */
  async searchEntities(entityType: string, filters: any): Promise<any[]> {
    return this.adapter.searchEntities(entityType, filters);
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
   * Disconnect from PropertyWare
   */
  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
    this.isInitialized = false;
    logger.info('PropertyWare integration disconnected');
  }
  
  /**
   * Get the underlying adapter instance (for advanced usage)
   */
  getAdapter(): PropertyWareAdapter {
    return this.adapter;
  }
}