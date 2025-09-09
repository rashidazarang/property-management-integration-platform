/**
 * GreenLight Lambda Adapter
 * Wraps existing GreenLight Lambda functions for use in PMIP
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { GreenlightConfig } from '../../types';
import { logger } from '../../utils/logger';

export class GreenlightAdapter {
  private lambdaClient: LambdaClient;
  private snsClient: SNSClient;
  private config: GreenlightConfig;
  private functionCache: Map<string, string> = new Map();

  constructor(config: GreenlightConfig) {
    this.config = config;
    
    // Initialize AWS clients
    const awsConfig = {
      region: config.region,
      ...(config.profile && { profile: config.profile })
    };
    
    this.lambdaClient = new LambdaClient(awsConfig);
    this.snsClient = new SNSClient(awsConfig);
    
    // Cache function ARNs
    this.functionCache.set('workorders', config.functions.workorders);
    this.functionCache.set('leases', config.functions.leases);
    this.functionCache.set('tenants', config.functions.tenants);
    this.functionCache.set('web', config.functions.web);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing GreenLight Lambda adapter');
    
    // Verify Lambda functions are accessible
    for (const [name, arn] of this.functionCache) {
      try {
        // Test invoke with empty payload
        await this.invokeLambda(name, { test: true });
        logger.info(`Verified access to ${name} Lambda function`);
      } catch (error) {
        logger.warn(`Could not verify ${name} Lambda: ${error.message}`);
      }
    }
  }

  /**
   * Invoke a Lambda function directly
   */
  private async invokeLambda(functionName: string, payload: any): Promise<any> {
    const functionArn = this.functionCache.get(functionName);
    if (!functionArn) {
      throw new Error(`Unknown Lambda function: ${functionName}`);
    }

    const command = new InvokeCommand({
      FunctionName: functionArn,
      Payload: JSON.stringify(payload)
    });

    const response = await this.lambdaClient.send(command);
    
    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      if (response.StatusCode !== 200) {
        throw new Error(`Lambda invocation failed: ${result.errorMessage || 'Unknown error'}`);
      }
      return result;
    }
    
    return null;
  }

  /**
   * Publish to SNS topic (for workflow orchestration)
   */
  private async publishToSNS(handler: string, action: string, data?: any): Promise<void> {
    const message = {
      handler,
      action,
      ...data
    };

    const command = new PublishCommand({
      TopicArn: this.config.snsTopic,
      Message: JSON.stringify(message),
      MessageAttributes: {
        handler: {
          DataType: 'String',
          StringValue: handler
        }
      }
    });

    await this.snsClient.send(command);
  }

  // Workflow step implementations (maps to your 11-step workflow)

  async getPWPortfolios(): Promise<any> {
    logger.info('Executing getPWPortfolios via Lambda');
    return this.publishToSNS('workorders', 'getPWPortfolios', {
      next: { handler: 'workorders', action: 'getPWWorkOrders' }
    });
  }

  async getPWWorkOrders(portfolioIds?: string[]): Promise<any> {
    logger.info('Executing getPWWorkOrders via Lambda');
    return this.publishToSNS('workorders', 'getPWWorkOrders', {
      portfolioIds,
      next: { handler: 'tenants', action: 'getSFCustomers' }
    });
  }

  async getSFCustomers(page?: number): Promise<any> {
    logger.info('Executing getSFCustomers via Lambda');
    return this.publishToSNS('tenants', 'getSFCustomers', {
      page,
      next: { handler: 'workorders', action: 'getSFJobs' }
    });
  }

  async getSFJobs(page?: number): Promise<any> {
    logger.info('Executing getSFJobs via Lambda');
    return this.publishToSNS('workorders', 'getSFJobs', {
      page,
      next: { handler: 'leases', action: 'getPWBuildings' }
    });
  }

  async getPWBuildings(): Promise<any> {
    logger.info('Executing getPWBuildings via Lambda');
    return this.publishToSNS('leases', 'getPWBuildings', {
      next: { handler: 'leases', action: 'getPWLeases' }
    });
  }

  async getPWLeases(buildingIds?: string[]): Promise<any> {
    logger.info('Executing getPWLeases via Lambda');
    return this.publishToSNS('leases', 'getPWLeases', {
      buildingIds,
      next: { handler: 'workorders', action: 'pushPortfoliosToSF' }
    });
  }

  async pushPortfoliosToSF(): Promise<any> {
    logger.info('Executing pushPortfoliosToSF via Lambda');
    return this.publishToSNS('workorders', 'pushPortfoliosToSF', {
      next: { handler: 'workorders', action: 'syncUnitsToSF' }
    });
  }

  async syncUnitsToSF(): Promise<any> {
    logger.info('Executing syncUnitsToSF via Lambda');
    return this.publishToSNS('workorders', 'syncUnitsToSF', {
      next: { handler: 'leases', action: 'pushLeaseTenantsToSF' }
    });
  }

  async pushLeaseTenantsToSF(): Promise<any> {
    logger.info('Executing pushLeaseTenantsToSF via Lambda');
    return this.publishToSNS('leases', 'pushLeaseTenantsToSF', {
      next: { handler: 'workorders', action: 'pushWorkOrdersToSF' }
    });
  }

  async pushWorkOrdersToSF(): Promise<any> {
    logger.info('Executing pushWorkOrdersToSF via Lambda');
    return this.publishToSNS('workorders', 'pushWorkOrdersToSF', {
      next: { handler: 'workorders', action: 'pushJobUpdatesToPW' }
    });
  }

  async pushJobUpdatesToPW(): Promise<any> {
    logger.info('Executing pushJobUpdatesToPW via Lambda');
    return this.publishToSNS('workorders', 'pushJobUpdatesToPW');
  }

  /**
   * Trigger full sync workflow
   */
  async triggerFullSync(): Promise<any> {
    logger.info('Triggering full GreenLight sync workflow');
    return this.invokeLambda('web', { action: 'trigger' });
  }

  /**
   * Get sync status from Supabase
   */
  async getSyncStatus(): Promise<any> {
    // This would query your Supabase sync_state table
    // For now, return mock status
    return {
      lastSync: new Date(),
      status: 'completed',
      entitiesProcessed: {
        portfolios: 228,
        buildings: 337,
        workOrders: 343,
        leases: 425
      }
    };
  }

  /**
   * Enable/disable dry run mode
   */
  async setDryRun(enabled: boolean): Promise<void> {
    logger.info(`Setting dry run mode to ${enabled}`);
    // This would update AWS SSM Parameter Store
    // For now, just log
  }

  /**
   * Get Lambda function metrics
   */
  async getMetrics(): Promise<any> {
    return {
      invocations: {
        workorders: 0, // Would fetch from CloudWatch
        leases: 0,
        tenants: 0,
        web: 0
      },
      errors: {
        workorders: 0,
        leases: 0,
        tenants: 0,
        web: 0
      },
      duration: {
        workorders: 0,
        leases: 0,
        tenants: 0,
        web: 0
      }
    };
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnecting GreenLight adapter');
    // Clean up if needed
  }
}