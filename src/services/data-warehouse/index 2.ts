/**
 * Data Warehouse Service for PMIP
 * Manages connection to Supabase and provides data access layer
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataWarehouseConfig } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class DataWarehouse {
  private config: DataWarehouseConfig;
  private client: SupabaseClient | null = null;
  private isConnected: boolean = false;
  private isDryRun: boolean = false;
  
  constructor(config: DataWarehouseConfig, options?: { dryRun?: boolean }) {
    this.config = config;
    this.isDryRun = options?.dryRun || false;
  }
  
  /**
   * Initialize data warehouse connection
   */
  async initialize(): Promise<void> {
    try {
      if (this.isDryRun) {
        // In dry-run mode, skip actual connection
        this.isConnected = true;
        logger.info('Data warehouse initialized in DRY-RUN mode (no actual connection)');
        return;
      }
      
      if (this.config.type === 'supabase') {
        this.client = createClient(this.config.url, this.config.key!);
        
        // Test connection
        const { error } = await this.client.from('dim_portfolio').select('count').limit(1);
        if (error) throw error;
        
        this.isConnected = true;
        logger.info('Data warehouse connected (Supabase)');
      } else {
        throw new Error(`Unsupported data warehouse type: ${this.config.type}`);
      }
    } catch (error) {
      logger.error('Failed to connect to data warehouse', error);
      throw error;
    }
  }
  
  /**
   * Get Supabase client
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Data warehouse not initialized');
    }
    return this.client;
  }
  
  /**
   * Get connection status
   */
  async getStatus(): Promise<any> {
    if (!this.isConnected) {
      return { connected: false };
    }
    
    // In dry-run mode, return mock status
    if (this.isDryRun) {
      return {
        connected: true,
        type: this.config.type,
        dryRun: true,
        tables: {
          'dim_portfolio': 0,
          'dim_building': 0,
          'dim_customer': 0,
          'fact_work_orders': 0,
          'fact_leases': 0,
          'fact_jobs': 0,
          'customer_mappings': 0
        }
      };
    }
    
    try {
      // Get table counts
      const tables = [
        'dim_portfolio',
        'dim_building',
        'dim_customer',
        'fact_work_orders',
        'fact_leases',
        'fact_jobs',
        'customer_mappings'
      ];
      
      const counts: Record<string, number> = {};
      
      for (const table of tables) {
        const { count } = await this.client!
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = count || 0;
      }
      
      return {
        connected: true,
        type: this.config.type,
        tables: counts
      };
    } catch (error) {
      logger.error('Failed to get data warehouse status', error);
      return {
        connected: true,
        error: (error as any).message
      };
    }
  }
  
  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const { data, error } = await this.client!
        .from('sync_state')
        .select('last_sync_time')
        .order('last_sync_time', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) return null;
      
      return new Date(data.last_sync_time);
    } catch (error) {
      logger.error('Failed to get last sync time', error);
      return null;
    }
  }
  
  /**
   * Save sync state
   */
  async saveSyncState(workflow: string, state: any): Promise<void> {
    try {
      const { error } = await this.client!
        .from('sync_state')
        .upsert({
          workflow,
          state,
          last_sync_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to save sync state', error);
      throw error;
    }
  }
  
  // Entity operations
  
  /**
   * Get portfolios
   */
  async getPortfolios(filter?: any): Promise<any[]> {
    try {
      let query = this.client!.from('dim_portfolio').select('*');
      
      if (filter?.active !== undefined) {
        query = query.eq('active', filter.active);
      }
      
      if (filter?.portfolioIds) {
        query = query.in('portfolio_id', filter.portfolioIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get portfolios', error);
      throw error;
    }
  }
  
  /**
   * Get buildings
   */
  async getBuildings(filter?: any): Promise<any[]> {
    try {
      let query = this.client!.from('dim_building').select('*');
      
      if (filter?.portfolioKey) {
        query = query.eq('portfolio_key', filter.portfolioKey);
      }
      
      if (filter?.buildingIds) {
        query = query.in('building_id', filter.buildingIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get buildings', error);
      throw error;
    }
  }
  
  /**
   * Get work orders
   */
  async getWorkOrders(filter?: any): Promise<any[]> {
    try {
      let query = this.client!.from('fact_work_orders').select('*');
      
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      
      if (filter?.portfolioId) {
        query = query.eq('portfolio_id', filter.portfolioId);
      }
      
      if (filter?.buildingId) {
        query = query.eq('building_id', filter.buildingId);
      }
      
      if (filter?.noSfJobId) {
        query = query.is('sf_job_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get work orders', error);
      throw error;
    }
  }
  
  /**
   * Get customer mappings
   */
  async getCustomerMappings(filter?: any): Promise<any[]> {
    try {
      let query = this.client!.from('customer_mappings').select('*');
      
      if (filter?.pwBuildingId) {
        query = query.eq('pw_building_id', filter.pwBuildingId);
      }
      
      if (filter?.sfCustomerId) {
        query = query.eq('sf_customer_id', filter.sfCustomerId);
      }
      
      if (filter?.unmapped) {
        query = query.is('sf_customer_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get customer mappings', error);
      throw error;
    }
  }
  
  /**
   * Upsert portfolio
   */
  async upsertPortfolio(portfolio: any): Promise<void> {
    try {
      const { error } = await this.client!
        .from('dim_portfolio')
        .upsert(portfolio);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to upsert portfolio', error);
      throw error;
    }
  }
  
  /**
   * Upsert building
   */
  async upsertBuilding(building: any): Promise<void> {
    try {
      const { error } = await this.client!
        .from('dim_building')
        .upsert(building);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to upsert building', error);
      throw error;
    }
  }
  
  /**
   * Upsert work order
   */
  async upsertWorkOrder(workOrder: any): Promise<void> {
    try {
      const { error } = await this.client!
        .from('fact_work_orders')
        .upsert(workOrder);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to upsert work order', error);
      throw error;
    }
  }
  
  /**
   * Update work order SF job ID
   */
  async updateWorkOrderSfJobId(workOrderId: string, sfJobId: string): Promise<void> {
    try {
      const { error } = await this.client!
        .from('fact_work_orders')
        .update({ sf_job_id: sfJobId })
        .eq('work_order_id', workOrderId);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update work order SF job ID', error);
      throw error;
    }
  }
  
  /**
   * Create customer mapping
   */
  async createCustomerMapping(mapping: any): Promise<void> {
    try {
      const { error } = await this.client!
        .from('customer_mappings')
        .insert(mapping);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to create customer mapping', error);
      throw error;
    }
  }
  
  /**
   * Execute raw SQL query
   */
  async executeQuery(query: string, params?: any[]): Promise<any> {
    try {
      const { data, error } = await this.client!.rpc('execute_sql', {
        query,
        params
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Failed to execute query', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from data warehouse
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.client = null;
    logger.info('Data warehouse disconnected');
  }
}