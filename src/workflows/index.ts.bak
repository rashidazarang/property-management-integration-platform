/**
 * Workflow exports for PMIP
 */

export { WorkflowManager } from './WorkflowManager';

// Export pre-built workflow definitions
export const workflows = {
  dailySync: {
    name: 'Daily Property Sync',
    description: 'Complete sync of all property data between PropertyWare and ServiceFusion',
    schedule: '0 */30 12-23 * * 2-6', // Every 30 min, 6am-5pm CST, Mon-Fri
    trigger: 'schedule',
    steps: [
      { action: 'greenlight.getPWPortfolios' },
      { action: 'greenlight.getPWWorkOrders' },
      { action: 'greenlight.getSFCustomers' },
      { action: 'greenlight.getSFJobs' },
      { action: 'greenlight.getPWBuildings' },
      { action: 'greenlight.getPWLeases' },
      { action: 'greenlight.pushPortfoliosToSF' },
      { action: 'greenlight.syncUnitsToSF' },
      { action: 'greenlight.pushLeaseTenantsToSF' },
      { action: 'greenlight.pushWorkOrdersToSF' },
      { action: 'greenlight.pushJobUpdatesToPW' }
    ]
  },
  
  emergencyMaintenance: {
    name: 'Emergency Maintenance Response',
    description: 'Handle urgent maintenance requests with automatic vendor dispatch',
    trigger: 'event',
    steps: [
      {
        action: 'propertyware.getWorkOrder',
        condition: 'params.priority === "emergency"'
      },
      {
        action: 'deduplication.findCustomer',
        params: { entity: '{{results.0.building}}' }
      },
      {
        action: 'servicefusion.createUrgentJob',
        params: {
          workOrderId: '{{results.0.workOrderId}}',
          customerId: '{{results.1.customerId}}',
          description: '{{results.0.description}}'
        }
      },
      {
        action: 'notifications.alertOnCall',
        params: {
          jobId: '{{results.2.jobId}}',
          priority: 'emergency'
        }
      },
      {
        action: 'propertyware.updateStatus',
        params: {
          workOrderId: '{{results.0.workOrderId}}',
          status: 'Dispatched'
        }
      }
    ]
  },
  
  tenantMoveOut: {
    name: 'Tenant Move-Out Process',
    description: 'Complete move-out workflow including inspection and deposit calculation',
    trigger: 'manual',
    steps: [
      {
        action: 'propertyware.getLeaseDetails',
        params: { leaseId: '{{params.leaseId}}' }
      },
      {
        action: 'propertyware.scheduleInspection',
        params: {
          leaseId: '{{params.leaseId}}',
          date: '{{params.moveOutDate}}',
          type: 'Move-Out'
        }
      },
      {
        action: 'servicefusion.createInspectionJob',
        params: {
          leaseId: '{{params.leaseId}}',
          customerId: '{{results.0.buildingCustomerId}}',
          date: '{{params.moveOutDate}}'
        }
      },
      {
        action: 'propertyware.calculateDeposit',
        params: { leaseId: '{{params.leaseId}}' }
      },
      {
        action: 'notifications.sendMoveOutPacket',
        params: {
          tenant: '{{results.0.tenant}}',
          deposit: '{{results.3.refundAmount}}',
          inspectionJob: '{{results.2.jobId}}'
        }
      }
    ]
  },
  
  monthEndReconciliation: {
    name: 'Month-End Financial Reconciliation',
    description: 'Reconcile work orders and invoices between systems',
    trigger: 'schedule',
    schedule: '0 0 1 * *', // First day of each month at midnight
    steps: [
      {
        action: 'servicefusion.getCompletedJobs',
        params: {
          startDate: '{{lastMonth.start}}',
          endDate: '{{lastMonth.end}}'
        }
      },
      {
        action: 'propertyware.getCompletedWorkOrders',
        params: {
          startDate: '{{lastMonth.start}}',
          endDate: '{{lastMonth.end}}'
        }
      },
      {
        action: 'reconciliation.matchWorkOrders',
        params: {
          sfJobs: '{{results.0}}',
          pwWorkOrders: '{{results.1}}'
        }
      },
      {
        action: 'reconciliation.generateReport',
        params: {
          matched: '{{results.2.matched}}',
          unmatched: '{{results.2.unmatched}}'
        }
      },
      {
        action: 'notifications.sendReconciliationReport',
        params: {
          report: '{{results.3}}',
          recipients: '{{config.financeTeam}}'
        }
      }
    ]
  },
  
  vendorOnboarding: {
    name: 'Vendor Onboarding',
    description: 'Onboard new vendor across both systems',
    trigger: 'manual',
    steps: [
      {
        action: 'propertyware.createVendor',
        params: '{{params.vendor}}'
      },
      {
        action: 'servicefusion.createTechnician',
        params: {
          vendor: '{{params.vendor}}',
          pwVendorId: '{{results.0.vendorId}}'
        }
      },
      {
        action: 'dataWarehouse.createVendorMapping',
        params: {
          pwVendorId: '{{results.0.vendorId}}',
          sfTechnicianId: '{{results.1.technicianId}}'
        }
      },
      {
        action: 'notifications.sendVendorWelcome',
        params: {
          vendor: '{{params.vendor}}',
          credentials: '{{results.1.credentials}}'
        }
      }
    ]
  }
};