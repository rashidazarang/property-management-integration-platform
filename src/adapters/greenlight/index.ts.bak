/**
 * GreenLight Lambda Adapter (stub for now)
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';

export class GreenlightAdapter extends EventEmitter {
  private config: any;
  private isInitialized: boolean = false;
  
  constructor(config: any) {
    super();
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    logger.info('GreenLight adapter initialized (stub)');
    this.isInitialized = true;
  }
  
  async disconnect(): Promise<void> {
    logger.info('GreenLight adapter disconnected');
    this.isInitialized = false;
  }
}