/**
 * Intelligence Service for PMIP
 * Integrates MCP Intelligence for natural language query processing
 */

// Will use @mcp-intelligence/core when available
// import { createPMIPIntelligence } from '@mcp-intelligence/core';
import { PropertyWareIntegration } from '../../integrations/propertyware/index.js';
import { ServiceFusionIntegration } from '../../integrations/servicefusion/index.js';
import { logger } from '../../utils/logger.js';
import { PropertyWareConfig, ServiceFusionConfig } from '../../types/index.js';

interface RoutingResult {
  server: 'propertyware' | 'servicefusion' | 'both';
  tool: string;
  params: any;
  confidence: number;
  intent: {
    action: string;
    entities: string[];
    temporal?: string;
    filters?: any;
  };
}

interface IntelligenceResult {
  routing: RoutingResult;
  validation: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  suggestions?: string[];
}

export class IntelligenceService {
  private intelligence: any; // Will be typed when package is available
  private propertyWareAdapter: PropertyWareIntegration;
  private serviceFusionAdapter: ServiceFusionIntegration;
  private initialized: boolean = false;

  constructor(
    private propertyWareConfig: PropertyWareConfig,
    private serviceFusionConfig: ServiceFusionConfig
  ) {
    this.propertyWareAdapter = new PropertyWareIntegration(propertyWareConfig);
    this.serviceFusionAdapter = new ServiceFusionIntegration(serviceFusionConfig);
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Intelligence Service...');
      
      // Initialize MCP Intelligence when package is available
      // this.intelligence = await createPMIPIntelligence();
      
      // For now, create a mock intelligence object
      this.intelligence = await this.createMockIntelligence();
      
      // Register PropertyWare adapter capabilities
      await this.intelligence.registerServer('propertyware', {
        protocol: 'soap',
        package: '@rashidazarang/propertyware-adapter',
        domains: ['property_management'],
        entities: ['portfolio', 'building', 'work_order', 'lease', 'tenant'],
        operations: ['get', 'create', 'update', 'delete', 'batch'],
        description: 'PropertyWare SOAP API with rate limiting',
        rateLimit: {
          requests: 2,
          window: 1000
        }
      });

      // Register ServiceFusion adapter capabilities
      await this.intelligence.registerServer('servicefusion', {
        protocol: 'rest',
        package: '@rashidazarang/servicefusion-adapter',
        domains: ['field_service', 'maintenance'],
        entities: ['customer', 'job', 'estimate', 'invoice', 'technician'],
        operations: ['get', 'create', 'update', 'assign', 'batch'],
        description: 'ServiceFusion REST API with OAuth',
        rateLimit: {
          requests: 0.5,
          window: 1000
        }
      });
      
      // Initialize adapters with dry-run mode
      await this.propertyWareAdapter.initialize({ dryRun: true });
      await this.serviceFusionAdapter.initialize({ dryRun: true });
      
      this.initialized = true;
      logger.info('Intelligence Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Intelligence Service', error);
      throw error;
    }
  }

  /**
   * Process natural language query
   */
  async processQuery(naturalLanguageQuery: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Intelligence Service not initialized');
    }
    
    logger.info(`Processing query: "${naturalLanguageQuery}"`);
    
    // Use MCP Intelligence to understand and route
    const result = await this.intelligence.query(naturalLanguageQuery);
    
    logger.info('Query routing result:', {
      server: result.routing.server,
      tool: result.routing.tool,
      confidence: result.routing.confidence
    });
    
    // Validate before execution
    if (!result.validation.isValid) {
      logger.warn('Query validation failed:', result.validation.errors);
      return {
        success: false,
        errors: result.validation.errors,
        suggestions: result.suggestions
      };
    }
    
    // Execute with the appropriate adapter
    if (result.routing.server === 'propertyware') {
      return await this.executePropertyWare(result.routing);
    } else if (result.routing.server === 'servicefusion') {
      return await this.executeServiceFusion(result.routing);
    } else if (result.routing.server === 'both') {
      return await this.executeCrossSystem(result.routing);
    }
    
    throw new Error(`Unknown routing server: ${result.routing.server}`);
  }

  /**
   * Execute PropertyWare operations
   */
  private async executePropertyWare(routing: RoutingResult): Promise<any> {
    const { tool, params } = routing;
    
    logger.info(`Executing PropertyWare operation: ${tool}`, params);
    
    switch(tool) {
      case 'get_portfolios':
        return await this.propertyWareAdapter.getPortfolios();
        
      case 'get_buildings':
        return await this.propertyWareAdapter.getBuildings(params);
        
      case 'get_work_orders':
        return await this.propertyWareAdapter.getWorkOrders(params);
        
      case 'create_work_order':
        return await this.propertyWareAdapter.createWorkOrder(params);
        
      case 'update_work_order':
        return await this.propertyWareAdapter.updateWorkOrder(params.id, params);
        
      case 'get_leases':
        return await this.propertyWareAdapter.getLeases(params);
        
      case 'get_tenants':
        return await this.propertyWareAdapter.getTenants(params);
        
      case 'update_lease':
        return await this.propertyWareAdapter.updateLease(params.id, params);
        
      default:
        throw new Error(`Unknown PropertyWare tool: ${tool}`);
    }
  }

  /**
   * Execute ServiceFusion operations
   */
  private async executeServiceFusion(routing: RoutingResult): Promise<any> {
    const { tool, params } = routing;
    
    logger.info(`Executing ServiceFusion operation: ${tool}`, params);
    
    switch(tool) {
      case 'get_customers':
        return await this.serviceFusionAdapter.getCustomers(params);
        
      case 'get_jobs':
        return await this.serviceFusionAdapter.getJobs(params);
        
      case 'create_job':
        return await this.serviceFusionAdapter.createJob(params);
        
      case 'update_job':
        return await this.serviceFusionAdapter.updateJob(params.id, params);
        
      case 'assign_technician':
        return await this.serviceFusionAdapter.assignTechnician(params.jobId, params.technicianId);
        
      case 'get_technicians':
        return await this.serviceFusionAdapter.getTechnicians(params);
        
      case 'create_estimate':
        return await this.serviceFusionAdapter.createEstimate(params);
        
      case 'create_invoice':
        return await this.serviceFusionAdapter.createInvoice(params);
        
      default:
        throw new Error(`Unknown ServiceFusion tool: ${tool}`);
    }
  }

  /**
   * Execute cross-system operations
   */
  private async executeCrossSystem(routing: RoutingResult): Promise<any> {
    const { tool, params } = routing;
    
    logger.info(`Executing cross-system operation: ${tool}`, params);
    
    switch(tool) {
      case 'sync_work_orders_to_jobs':
        // Get work orders from PropertyWare
        const workOrders = await this.propertyWareAdapter.getWorkOrders(params.filter);
        
        // Create jobs in ServiceFusion
        const jobs = [];
        for (const wo of workOrders) {
          const job = await this.serviceFusionAdapter.createJob({
            description: wo.description,
            priority: wo.priority?.toLowerCase(),
            customFields: {
              propertyWareId: wo.workOrderId,
              buildingId: wo.buildingId,
              portfolioId: wo.portfolioId
            }
          });
          jobs.push(job);
        }
        
        return {
          synced: jobs.length,
          workOrders,
          jobs
        };
        
      case 'sync_jobs_to_work_orders':
        // Get jobs from ServiceFusion
        const sfJobs = await this.serviceFusionAdapter.getJobs(params.filter);
        
        // Update work orders in PropertyWare
        const updated = [];
        for (const job of sfJobs) {
          if (job.customFields?.propertyWareId) {
            const wo = await this.propertyWareAdapter.updateWorkOrder(
              job.customFields.propertyWareId,
              {
                status: this.mapJobStatusToWorkOrderStatus(job.status),
                sfJobId: job.jobId
              }
            );
            updated.push(wo);
          }
        }
        
        return {
          synced: updated.length,
          jobs: sfJobs,
          workOrders: updated
        };
        
      default:
        throw new Error(`Unknown cross-system tool: ${tool}`);
    }
  }

  /**
   * Map ServiceFusion job status to PropertyWare work order status
   */
  private mapJobStatusToWorkOrderStatus(jobStatus: string): string {
    const statusMap: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on_hold': 'On Hold'
    };
    
    return statusMap[jobStatus.toLowerCase()] || 'Open';
  }

  /**
   * Get query suggestions based on partial input
   */
  async getSuggestions(partial: string): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }
    
    return await this.intelligence.getSuggestions(partial);
  }

  /**
   * Create mock intelligence for testing until package is available
   */
  private async createMockIntelligence(): Promise<any> {
    const servers: Map<string, any> = new Map();
    
    return {
      registerServer: async (name: string, config: any) => {
        servers.set(name, config);
        logger.info(`Registered server: ${name}`, config);
      },
      
      query: async (naturalLanguageQuery: string): Promise<IntelligenceResult> => {
        // Simple keyword-based routing for testing
        const query = naturalLanguageQuery.toLowerCase();
        
        // Determine routing based on keywords
        let server: 'propertyware' | 'servicefusion' | 'both' = 'propertyware';
        let tool = 'get_portfolios';
        let params: any = {};
        
        // PropertyWare keywords
        if (query.includes('portfolio')) {
          server = 'propertyware';
          tool = 'get_portfolios';
        } else if (query.includes('building')) {
          server = 'propertyware';
          tool = 'get_buildings';
        } else if (query.includes('work order')) {
          server = 'propertyware';
          if (query.includes('create')) {
            tool = 'create_work_order';
            // Extract details from query (simplified)
            params = {
              description: 'Work order from natural language',
              priority: query.includes('emergency') ? 'Emergency' : 'Normal'
            };
          } else {
            tool = 'get_work_orders';
          }
        } else if (query.includes('lease')) {
          server = 'propertyware';
          tool = 'get_leases';
        } else if (query.includes('tenant')) {
          server = 'propertyware';
          tool = 'get_tenants';
        }
        
        // ServiceFusion keywords
        else if (query.includes('customer')) {
          server = 'servicefusion';
          tool = 'get_customers';
        } else if (query.includes('job')) {
          server = 'servicefusion';
          if (query.includes('create')) {
            tool = 'create_job';
            params = {
              description: 'Job from natural language',
              priority: query.includes('high') ? 'high' : 'normal'
            };
          } else {
            tool = 'get_jobs';
          }
        } else if (query.includes('technician')) {
          server = 'servicefusion';
          if (query.includes('assign')) {
            tool = 'assign_technician';
          } else {
            tool = 'get_technicians';
          }
        } else if (query.includes('estimate')) {
          server = 'servicefusion';
          tool = 'create_estimate';
        } else if (query.includes('invoice')) {
          server = 'servicefusion';
          tool = 'create_invoice';
        }
        
        // Cross-system keywords
        else if (query.includes('sync')) {
          server = 'both';
          if (query.includes('work order') && query.includes('job')) {
            tool = 'sync_work_orders_to_jobs';
          } else if (query.includes('job') && query.includes('work order')) {
            tool = 'sync_jobs_to_work_orders';
          }
        }
        
        // Extract filters
        if (query.includes('today')) {
          params.date = new Date().toISOString().split('T')[0];
        }
        if (query.includes('high priority')) {
          params.priority = 'high';
        }
        if (query.includes('open')) {
          params.status = 'open';
        }
        
        return {
          routing: {
            server,
            tool,
            params,
            confidence: 0.85,
            intent: {
              action: tool.split('_')[0],
              entities: tool.split('_').slice(1),
              filters: params
            }
          },
          validation: {
            isValid: true
          },
          suggestions: [
            'Show all portfolios',
            'Create a work order',
            'List today\'s jobs',
            'Sync work orders to ServiceFusion'
          ]
        };
      },
      
      getSuggestions: async (partial: string): Promise<string[]> => {
        const allSuggestions = [
          'Show all portfolios',
          'Show all buildings',
          'Show all work orders',
          'Create a work order',
          'Create an emergency work order',
          'List all customers',
          'List today\'s jobs',
          'List all technicians',
          'Assign technician to job',
          'Create a job',
          'Create an estimate',
          'Create an invoice',
          'Sync work orders to ServiceFusion',
          'Sync jobs to PropertyWare'
        ];
        
        return allSuggestions.filter(s => 
          s.toLowerCase().includes(partial.toLowerCase())
        );
      }
    };
  }
}

/**
 * Factory function to create IntelligenceService
 */
export async function createIntelligenceService(
  propertyWareConfig: PropertyWareConfig,
  serviceFusionConfig: ServiceFusionConfig
): Promise<IntelligenceService> {
  const service = new IntelligenceService(propertyWareConfig, serviceFusionConfig);
  await service.initialize();
  return service;
}