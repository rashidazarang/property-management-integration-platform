/**
 * PropertyWare SOAP Integration for PMIP
 * Handles all PropertyWare API interactions
 */

import * as soap from 'soap';
import { PropertyWareConfig } from '../../types';
import { logger } from '../../utils/logger';
import { RateLimiter } from '../../utils/rate-limiter';

export class PropertyWareIntegration {
  private config: PropertyWareConfig;
  private client: any = null;
  private rateLimiter: RateLimiter;
  private isInitialized: boolean = false;
  
  constructor(config: PropertyWareConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(2); // 2 requests per second
  }
  
  /**
   * Initialize PropertyWare SOAP client
   */
  async initialize(): Promise<void> {
    try {
      // Create SOAP client
      this.client = await soap.createClientAsync(this.config.wsdl, {
        endpoint: this.config.url,
        forceSoap12Headers: true
      });
      
      // Set authentication headers
      const authHeader = {
        Username: this.config.username,
        Password: this.config.password
      };
      
      this.client.addSoapHeader(authHeader);
      
      this.isInitialized = true;
      logger.info('PropertyWare integration initialized');
    } catch (error) {
      logger.error('Failed to initialize PropertyWare integration', error);
      throw error;
    }
  }
  
  /**
   * Get portfolios from PropertyWare
   */
  async getPortfolios(params?: any): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        includeInactive: params?.includeInactive || false,
        pageSize: params?.pageSize || 100,
        pageNumber: params?.pageNumber || 1
      };
      
      const [result] = await this.client.getPortfoliosAsync(request);
      
      if (!result || !result.portfolios) {
        return [];
      }
      
      return this.normalizePortfolios(result.portfolios);
    } catch (error) {
      logger.error('Failed to get portfolios from PropertyWare', error);
      throw error;
    }
  }
  
  /**
   * Get buildings from PropertyWare
   */
  async getBuildings(portfolioIds?: string[]): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        portfolioIds: portfolioIds || [],
        includeUnits: true,
        pageSize: 100,
        pageNumber: 1
      };
      
      const [result] = await this.client.getBuildingsAsync(request);
      
      if (!result || !result.buildings) {
        return [];
      }
      
      return this.normalizeBuildings(result.buildings);
    } catch (error) {
      logger.error('Failed to get buildings from PropertyWare', error);
      throw error;
    }
  }
  
  /**
   * Get work orders from PropertyWare
   */
  async getWorkOrders(params?: any): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        portfolioIds: params?.portfolioIds || [],
        status: params?.status || 'Open',
        startDate: params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: params?.endDate || new Date(),
        pageSize: params?.pageSize || 100,
        pageNumber: params?.pageNumber || 1
      };
      
      const [result] = await this.client.getWorkOrdersAsync(request);
      
      if (!result || !result.workOrders) {
        return [];
      }
      
      return this.normalizeWorkOrders(result.workOrders);
    } catch (error) {
      logger.error('Failed to get work orders from PropertyWare', error);
      throw error;
    }
  }
  
  /**
   * Get leases from PropertyWare
   */
  async getLeases(buildingIds?: string[]): Promise<any[]> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        buildingIds: buildingIds || [],
        includeExpired: false,
        pageSize: 100,
        pageNumber: 1
      };
      
      const [result] = await this.client.getLeasesAsync(request);
      
      if (!result || !result.leases) {
        return [];
      }
      
      return this.normalizeLeases(result.leases);
    } catch (error) {
      logger.error('Failed to get leases from PropertyWare', error);
      throw error;
    }
  }
  
  /**
   * Update work order status in PropertyWare
   */
  async updateWorkOrderStatus(workOrderId: string, status: string, notes?: string): Promise<void> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        workOrderId,
        status,
        notes: notes || '',
        updatedBy: 'PMIP',
        updatedDate: new Date()
      };
      
      await this.client.updateWorkOrderAsync(request);
      
      logger.info(`Updated work order ${workOrderId} status to ${status}`);
    } catch (error) {
      logger.error(`Failed to update work order ${workOrderId}`, error);
      throw error;
    }
  }
  
  /**
   * Create inspection in PropertyWare
   */
  async scheduleInspection(leaseId: string, date: Date, type: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        leaseId,
        inspectionDate: date,
        inspectionType: type,
        notes: `Scheduled via PMIP`,
        createdBy: 'PMIP'
      };
      
      const [result] = await this.client.createInspectionAsync(request);
      
      return result;
    } catch (error) {
      logger.error('Failed to schedule inspection', error);
      throw error;
    }
  }
  
  /**
   * Get lease details
   */
  async getLeaseDetails(leaseId: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const [result] = await this.client.getLeaseByIdAsync({ leaseId });
      
      if (!result) {
        throw new Error(`Lease not found: ${leaseId}`);
      }
      
      return this.normalizeLease(result);
    } catch (error) {
      logger.error(`Failed to get lease details for ${leaseId}`, error);
      throw error;
    }
  }
  
  /**
   * Calculate deposit refund
   */
  async calculateDeposit(leaseId: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const request = {
        leaseId,
        includeCharges: true,
        includeCredits: true
      };
      
      const [result] = await this.client.calculateDepositRefundAsync(request);
      
      return {
        totalDeposit: result.totalDeposit,
        totalCharges: result.totalCharges,
        refundAmount: result.refundAmount,
        charges: result.charges || []
      };
    } catch (error) {
      logger.error(`Failed to calculate deposit for lease ${leaseId}`, error);
      throw error;
    }
  }
  
  /**
   * Get work order by ID
   */
  async getWorkOrder(workOrderId: string): Promise<any> {
    await this.rateLimiter.wait();
    
    try {
      const [result] = await this.client.getWorkOrderByIdAsync({ workOrderId });
      
      if (!result) {
        throw new Error(`Work order not found: ${workOrderId}`);
      }
      
      return this.normalizeWorkOrder(result);
    } catch (error) {
      logger.error(`Failed to get work order ${workOrderId}`, error);
      throw error;
    }
  }
  
  // Normalization methods
  
  private normalizePortfolios(portfolios: any[]): any[] {
    return portfolios.map(p => this.normalizePortfolio(p));
  }
  
  private normalizePortfolio(portfolio: any): any {
    return {
      portfolioId: portfolio.ID,
      name: portfolio.Name,
      active: portfolio.Active === 'true',
      ownerFirstName: portfolio.OwnerFirstName,
      ownerLastName: portfolio.OwnerLastName,
      ownerEmail: portfolio.OwnerEmail,
      ownerPhone: portfolio.OwnerPhone,
      address: portfolio.Address,
      city: portfolio.City,
      state: portfolio.State,
      zip: portfolio.Zip,
      createdAt: new Date(portfolio.CreatedDate),
      updatedAt: new Date(portfolio.ModifiedDate)
    };
  }
  
  private normalizeBuildings(buildings: any[]): any[] {
    return buildings.map(b => this.normalizeBuilding(b));
  }
  
  private normalizeBuilding(building: any): any {
    return {
      buildingId: building.ID,
      buildingKey: building.Key,
      portfolioKey: building.PortfolioKey,
      buildingName: building.Name,
      address: building.Address,
      city: building.City,
      state: building.State,
      zip: building.Zip,
      unitCount: parseInt(building.UnitCount) || 0,
      yearBuilt: building.YearBuilt,
      squareFeet: building.SquareFeet,
      createdAt: new Date(building.CreatedDate),
      updatedAt: new Date(building.ModifiedDate)
    };
  }
  
  private normalizeWorkOrders(workOrders: any[]): any[] {
    return workOrders.map(wo => this.normalizeWorkOrder(wo));
  }
  
  private normalizeWorkOrder(workOrder: any): any {
    return {
      workOrderId: workOrder.ID,
      buildingId: workOrder.BuildingID,
      portfolioId: workOrder.PortfolioID,
      unitId: workOrder.UnitID,
      description: workOrder.Description,
      status: workOrder.Status,
      priority: workOrder.Priority,
      category: workOrder.Category,
      assignedVendor: workOrder.AssignedVendor,
      createdBy: workOrder.CreatedBy,
      createdAt: new Date(workOrder.CreatedDate),
      updatedAt: new Date(workOrder.ModifiedDate),
      completedAt: workOrder.CompletedDate ? new Date(workOrder.CompletedDate) : null,
      estimatedCost: parseFloat(workOrder.EstimatedCost) || 0,
      actualCost: parseFloat(workOrder.ActualCost) || 0
    };
  }
  
  private normalizeLeases(leases: any[]): any[] {
    return leases.map(l => this.normalizeLease(l));
  }
  
  private normalizeLease(lease: any): any {
    return {
      leaseId: lease.ID,
      buildingId: lease.BuildingID,
      unitId: lease.UnitID,
      tenantName: `${lease.TenantFirstName} ${lease.TenantLastName}`.trim(),
      tenantEmail: lease.TenantEmail,
      tenantPhone: lease.TenantPhone,
      startDate: new Date(lease.StartDate),
      endDate: new Date(lease.EndDate),
      rentAmount: parseFloat(lease.RentAmount) || 0,
      depositAmount: parseFloat(lease.DepositAmount) || 0,
      status: lease.Status,
      createdAt: new Date(lease.CreatedDate),
      updatedAt: new Date(lease.ModifiedDate)
    };
  }
  
  /**
   * Disconnect from PropertyWare
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.isInitialized = false;
    logger.info('PropertyWare integration disconnected');
  }
}