/**
 * Property Management Integration Platform (PMIP)
 * The universal sync platform for property management
 */

import { createOrchestraV2, type Orchestra } from '@agent-orchestra/core';
import { PMIPConfig, PMIPOptions } from './types';
import { PropertyWareIntegration } from './integrations/propertyware';
import { ServiceFusionIntegration } from './integrations/servicefusion';
import { GreenlightAdapter } from './adapters/greenlight';
import { WorkflowManager } from './workflows/WorkflowManager';
import { DeduplicationService } from './services/deduplication';
import { DataWarehouse } from './services/data-warehouse';
import { logger } from './utils/logger';

export class PMIP {
  private orchestra: Orchestra;
  private config: PMIPConfig;
  private workflowManager: WorkflowManager;
  private deduplicationService: DeduplicationService;
  private dataWarehouse: DataWarehouse;
  private integrations: Map<string, any> = new Map();

  constructor(config: PMIPConfig) {
    this.config = config;
    this.workflowManager = new WorkflowManager(this);
    this.deduplicationService = new DeduplicationService(config.deduplication);
    this.dataWarehouse = new DataWarehouse(config.dataWarehouse);
  }

  /**
   * Initialize PMIP with all integrations and protocols
   */
  async initialize(options?: PMIPOptions): Promise<void> {
    logger.info('Initializing Property Management Integration Platform...');

    // Initialize Agent Orchestra as the core engine
    this.orchestra = await createOrchestraV2({
      protocols: {
        mcp: true,
        rest: true,
        soap: true,
        lambda: true,
        websocket: true,
        graphql: false // Future support
      },
      observability: {
        enabled: true,
        provider: 'opentelemetry'
      }
    });

    // Set up property management specific integrations
    await this.setupIntegrations(options);
    
    // Register workflows
    await this.registerWorkflows();
    
    // Initialize data warehouse
    await this.dataWarehouse.initialize();
    
    // Set up event handlers
    this.setupEventHandlers();

    logger.info('PMIP initialized successfully');
  }

  /**
   * Set up all property management platform integrations
   */
  private async setupIntegrations(options?: PMIPOptions): Promise<void> {
    // PropertyWare SOAP Integration
    if (this.config.integrations.propertyware) {
      const pw = new PropertyWareIntegration(this.config.integrations.propertyware);
      await pw.initialize();
      this.integrations.set('propertyware', pw);
      logger.info('PropertyWare integration initialized');
    }

    // ServiceFusion REST Integration
    if (this.config.integrations.servicefusion) {
      const sf = new ServiceFusionIntegration(this.config.integrations.servicefusion);
      await sf.initialize();
      this.integrations.set('servicefusion', sf);
      logger.info('ServiceFusion integration initialized');
    }

    // GreenLight Lambda Adapter (reuse existing Lambda functions)
    if (options?.reuseGreenlight && this.config.integrations.greenlight) {
      const greenlight = new GreenlightAdapter(this.config.integrations.greenlight);
      await greenlight.initialize();
      this.integrations.set('greenlight', greenlight);
      logger.info('GreenLight Lambda adapter initialized');
    }

    // Future integrations placeholder
    // - Yardi
    // - AppFolio
    // - Buildium
  }

  /**
   * Register property management specific workflows
   */
  private async registerWorkflows(): Promise<void> {
    // Core workflows from GreenLight
    await this.workflowManager.register('daily-sync', {
      name: 'Daily Property Sync',
      schedule: '0 */30 12-23 * * 2-6', // Every 30 min, 6am-5pm CST, Mon-Fri
      steps: [
        'greenlight.getPWPortfolios',
        'greenlight.getPWWorkOrders',
        'greenlight.getSFCustomers',
        'greenlight.getSFJobs',
        'greenlight.getPWBuildings',
        'greenlight.getPWLeases',
        'greenlight.pushPortfoliosToSF',
        'greenlight.syncUnitsToSF',
        'greenlight.pushLeaseTenantsToSF',
        'greenlight.pushWorkOrdersToSF',
        'greenlight.pushJobUpdatesToPW'
      ]
    });

    // Enhanced workflows
    await this.workflowManager.register('emergency-maintenance', {
      name: 'Emergency Maintenance Response',
      trigger: 'event',
      steps: [
        { action: 'propertyware.getWorkOrder', condition: 'priority === "emergency"' },
        { action: 'deduplication.findCustomer' },
        { action: 'servicefusion.createUrgentJob' },
        { action: 'notifications.alertOnCall' },
        { action: 'propertyware.updateStatus' }
      ]
    });

    await this.workflowManager.register('tenant-moveout', {
      name: 'Tenant Move-Out Process',
      trigger: 'manual',
      steps: [
        { action: 'propertyware.getLeaseDetails' },
        { action: 'propertyware.scheduleInspection' },
        { action: 'servicefusion.createInspectionJob' },
        { action: 'propertyware.calculateDeposit' },
        { action: 'notifications.sendMoveOutPacket' }
      ]
    });

    logger.info(`Registered ${this.workflowManager.getWorkflowCount()} workflows`);
  }

  /**
   * Set up event handlers for real-time processing
   */
  private setupEventHandlers(): void {
    // Handle sync events
    this.orchestra.on('sync.started', (event) => {
      logger.info('Sync started', { workflow: event.workflow });
    });

    this.orchestra.on('sync.completed', (event) => {
      logger.info('Sync completed', { 
        workflow: event.workflow,
        duration: event.duration,
        entities: event.entitiesProcessed 
      });
    });

    this.orchestra.on('sync.error', (event) => {
      logger.error('Sync error', { 
        workflow: event.workflow,
        error: event.error 
      });
    });

    // Handle deduplication events
    this.deduplicationService.on('duplicate.detected', (event) => {
      logger.warn('Duplicate detected', { 
        entity: event.entity,
        confidence: event.confidence 
      });
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowName: string, params?: any): Promise<any> {
    return this.workflowManager.execute(workflowName, params);
  }

  /**
   * Execute a single sync operation
   */
  async sync(entity: string, options?: any): Promise<any> {
    const workflow = `sync-${entity}`;
    return this.executeWorkflow(workflow, options);
  }

  /**
   * Get integration by name
   */
  getIntegration(name: string): any {
    return this.integrations.get(name);
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<any> {
    return {
      integrations: Array.from(this.integrations.keys()),
      workflows: this.workflowManager.getWorkflows(),
      dataWarehouse: await this.dataWarehouse.getStatus(),
      lastSync: await this.dataWarehouse.getLastSyncTime()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down PMIP...');
    
    // Stop workflows
    await this.workflowManager.stopAll();
    
    // Close integrations
    for (const [name, integration] of this.integrations) {
      await integration.disconnect();
      logger.info(`Disconnected ${name}`);
    }
    
    // Close data warehouse connection
    await this.dataWarehouse.disconnect();
    
    logger.info('PMIP shutdown complete');
  }
}

// Export convenience function
export async function createPMIP(config: PMIPConfig, options?: PMIPOptions): Promise<PMIP> {
  const pmip = new PMIP(config);
  await pmip.initialize(options);
  return pmip;
}

// Export types
export * from './types';
export * from './workflows';
export * from './integrations';
export * from './services';