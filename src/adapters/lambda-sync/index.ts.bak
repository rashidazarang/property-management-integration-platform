/**
 * AWS Lambda Sync Adapter
 * Wraps existing Lambda-based sync implementations for use in PMIP
 * Supports SNS-based workflow orchestration patterns
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { LambdaSyncConfig } from '../../types';
import { logger } from '../../utils/logger';

export class LambdaSyncAdapter {
  private lambdaClient: LambdaClient;
  private snsClient: SNSClient;
  private config: LambdaSyncConfig;
  private functionCache: Map<string, string> = new Map();

  constructor(config: LambdaSyncConfig) {
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
    logger.info('Initializing Lambda Sync adapter');
    
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

  // Generic workflow step implementations

  async fetchPortfolios(): Promise<any> {
    logger.info('Fetching portfolios via Lambda');
    return this.publishToSNS('workorders', 'getPortfolios', {
      next: { handler: 'workorders', action: 'getWorkOrders' }
    });
  }

  async fetchWorkOrders(portfolioIds?: string[]): Promise<any> {
    logger.info('Fetching work orders via Lambda');
    return this.publishToSNS('workorders', 'getWorkOrders', {
      portfolioIds,
      next: { handler: 'tenants', action: 'getCustomers' }
    });
  }

  async fetchCustomers(page?: number): Promise<any> {
    logger.info('Fetching customers via Lambda');
    return this.publishToSNS('tenants', 'getCustomers', {
      page,
      next: { handler: 'workorders', action: 'getJobs' }
    });
  }

  async fetchJobs(page?: number): Promise<any> {
    logger.info('Fetching jobs via Lambda');
    return this.publishToSNS('workorders', 'getJobs', {
      page,
      next: { handler: 'leases', action: 'getBuildings' }
    });
  }

  async fetchBuildings(): Promise<any> {
    logger.info('Fetching buildings via Lambda');
    return this.publishToSNS('leases', 'getBuildings', {
      next: { handler: 'leases', action: 'getLeases' }
    });
  }

  async fetchLeases(buildingIds?: string[]): Promise<any> {
    logger.info('Fetching leases via Lambda');
    return this.publishToSNS('leases', 'getLeases', {
      buildingIds,
      next: { handler: 'workorders', action: 'syncPortfolios' }
    });
  }

  async syncPortfolios(): Promise<any> {
    logger.info('Syncing portfolios via Lambda');
    return this.publishToSNS('workorders', 'syncPortfolios', {
      next: { handler: 'workorders', action: 'syncUnits' }
    });
  }

  async syncUnits(): Promise<any> {
    logger.info('Syncing units via Lambda');
    return this.publishToSNS('workorders', 'syncUnits', {
      next: { handler: 'leases', action: 'syncTenants' }
    });
  }

  async syncTenants(): Promise<any> {
    logger.info('Syncing tenants via Lambda');
    return this.publishToSNS('leases', 'syncTenants', {
      next: { handler: 'workorders', action: 'syncWorkOrders' }
    });
  }

  async syncWorkOrders(): Promise<any> {
    logger.info('Syncing work orders via Lambda');
    return this.publishToSNS('workorders', 'syncWorkOrders', {
      next: { handler: 'workorders', action: 'syncJobUpdates' }
    });
  }

  async syncJobUpdates(): Promise<any> {
    logger.info('Syncing job updates via Lambda');
    return this.publishToSNS('workorders', 'syncJobUpdates');
  }

  /**
   * Trigger full sync workflow
   */
  async triggerFullSync(): Promise<any> {
    logger.info('Triggering full sync workflow');
    return this.invokeLambda('web', { action: 'trigger' });
  }

  /**
   * Get sync status from data warehouse
   */
  async getSyncStatus(): Promise<any> {
    // This would query your data warehouse sync_state table
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
    // This would update AWS SSM Parameter Store or equivalent
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
    logger.info('Disconnecting Lambda Sync adapter');
    // Clean up if needed
  }
}