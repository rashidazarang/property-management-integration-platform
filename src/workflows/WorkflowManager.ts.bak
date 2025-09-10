/**
 * Workflow Manager for PMIP
 * Orchestrates complex multi-step property management workflows
 */

import { EventEmitter } from 'events';
import { Workflow, WorkflowStep, RetryPolicy } from '../types';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';

export class WorkflowManager extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, any> = new Map();
  private scheduledJobs: Map<string, any> = new Map();
  private pmip: any; // Reference to main PMIP instance
  
  constructor(pmip: any) {
    super();
    this.pmip = pmip;
  }
  
  /**
   * Register a new workflow
   */
  async register(name: string, workflow: any): Promise<void> {
    this.workflows.set(name, {
      name: workflow.name || name,
      description: workflow.description,
      schedule: workflow.schedule,
      trigger: workflow.trigger || 'manual',
      steps: this.normalizeSteps(workflow.steps),
      errorHandler: workflow.errorHandler,
      retryPolicy: workflow.retryPolicy || this.getDefaultRetryPolicy()
    });
    
    // Set up scheduled execution if needed
    if (workflow.schedule) {
      this.scheduleWorkflow(name, workflow.schedule);
    }
    
    logger.info(`Workflow registered: ${name}`);
  }
  
  /**
   * Normalize workflow steps
   */
  private normalizeSteps(steps: any[]): WorkflowStep[] {
    return steps.map(step => {
      if (typeof step === 'string') {
        return {
          action: step,
          params: {},
          parallel: false,
          timeout: 300000, // 5 minutes default
          retries: 3
        };
      }
      return {
        ...step,
        timeout: step.timeout || 300000,
        retries: step.retries || 3
      };
    });
  }
  
  /**
   * Get default retry policy
   */
  private getDefaultRetryPolicy(): RetryPolicy {
    return {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000
    };
  }
  
  /**
   * Schedule a workflow
   */
  private scheduleWorkflow(name: string, schedule: string): void {
    if (this.scheduledJobs.has(name)) {
      this.scheduledJobs.get(name).stop();
    }
    
    const job = cron.schedule(schedule, async () => {
      logger.info(`Scheduled execution of workflow: ${name}`);
      await this.execute(name);
    });
    
    this.scheduledJobs.set(name, job);
    logger.info(`Workflow scheduled: ${name} (${schedule})`);
  }
  
  /**
   * Execute a workflow
   */
  async execute(workflowName: string, params?: any): Promise<any> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }
    
    const executionId = this.generateExecutionId();
    const execution = {
      id: executionId,
      workflow: workflowName,
      startTime: new Date(),
      params,
      status: 'running',
      currentStep: 0,
      results: []
    };
    
    this.activeExecutions.set(executionId, execution);
    
    // Emit start event
    this.emit('workflow.started', {
      executionId,
      workflow: workflowName,
      params
    });
    
    try {
      // Execute each step
      for (let i = 0; i < workflow.steps.length; i++) {
        execution.currentStep = i;
        const step = workflow.steps[i];
        
        // Check condition if present
        if (step.condition && !this.evaluateCondition(step.condition, execution)) {
          logger.debug(`Skipping step ${i} due to condition: ${step.condition}`);
          continue;
        }
        
        // Execute step with retry logic
        const result = await this.executeStep(step, execution, workflow.retryPolicy);
        execution.results.push(result);
        
        // Emit progress event
        this.emit('workflow.progress', {
          executionId,
          workflow: workflowName,
          step: i,
          totalSteps: workflow.steps.length,
          result
        });
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      // Emit completion event
      this.emit('workflow.completed', {
        executionId,
        workflow: workflowName,
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
        results: execution.results
      });
      
      return execution;
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error;
      
      // Execute error handler if present
      if (workflow.errorHandler) {
        try {
          await this.executeStep(workflow.errorHandler, execution);
        } catch (handlerError) {
          logger.error('Error handler failed', handlerError);
        }
      }
      
      // Emit error event
      this.emit('workflow.error', {
        executionId,
        workflow: workflowName,
        error
      });
      
      throw error;
      
    } finally {
      // Clean up
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 300000); // Keep for 5 minutes for debugging
    }
  }
  
  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, execution: any, retryPolicy?: RetryPolicy): Promise<any> {
    const [integration, method] = step.action.split('.');
    
    // Get the integration
    const integrationInstance = this.pmip.getIntegration(integration);
    if (!integrationInstance) {
      throw new Error(`Integration not found: ${integration}`);
    }
    
    // Prepare parameters
    const params = this.resolveParams(step.params, execution);
    
    // Execute with retry logic
    let lastError;
    const policy = retryPolicy || this.getDefaultRetryPolicy();
    
    for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
      try {
        // Set timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Step timeout')), step.timeout);
        });
        
        // Execute method
        const resultPromise = integrationInstance[method](params);
        
        // Race between timeout and execution
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        logger.debug(`Step executed successfully: ${step.action}`);
        return result;
        
      } catch (error) {
        lastError = error;
        logger.warn(`Step failed (attempt ${attempt + 1}/${policy.maxAttempts}): ${step.action}`, error);
        
        if (attempt < policy.maxAttempts - 1) {
          // Calculate delay
          const delay = this.calculateDelay(attempt, policy);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: string, execution: any): boolean {
    try {
      // Simple evaluation - in production, use a safe evaluator
      const func = new Function('execution', `return ${condition}`);
      return func(execution);
    } catch (error) {
      logger.error(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }
  
  /**
   * Resolve parameters with execution context
   */
  private resolveParams(params: any, execution: any): any {
    if (!params) return {};
    
    // Deep clone params
    const resolved = JSON.parse(JSON.stringify(params));
    
    // Replace placeholders with execution values
    // Example: {{results.0.portfolioIds}} -> execution.results[0].portfolioIds
    const replaceTokens = (obj: any): any => {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].startsWith('{{') && obj[key].endsWith('}}')) {
          const path = obj[key].slice(2, -2);
          obj[key] = this.getValueByPath(execution, path);
        } else if (typeof obj[key] === 'object') {
          replaceTokens(obj[key]);
        }
      }
      return obj;
    };
    
    return replaceTokens(resolved);
  }
  
  /**
   * Get value by path from object
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Calculate retry delay
   */
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoff) {
      case 'exponential':
        const delay = policy.initialDelay * Math.pow(2, attempt);
        return Math.min(delay, policy.maxDelay || 60000);
      case 'linear':
        return policy.initialDelay * (attempt + 1);
      case 'fixed':
      default:
        return policy.initialDelay;
    }
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get workflow count
   */
  getWorkflowCount(): number {
    return this.workflows.size;
  }
  
  /**
   * Get all workflows
   */
  getWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
  
  /**
   * Get workflow by name
   */
  getWorkflow(name: string): Workflow | undefined {
    return this.workflows.get(name);
  }
  
  /**
   * Stop all scheduled jobs
   */
  async stopAll(): Promise<void> {
    for (const [name, job] of this.scheduledJobs) {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    }
    this.scheduledJobs.clear();
  }
}