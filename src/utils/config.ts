/**
 * Configuration management for PMIP
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

class ConfigManager {
  private config: Map<string, any> = new Map();
  
  constructor() {
    this.loadEnvironmentVariables();
    this.setDefaults();
  }
  
  private loadEnvironmentVariables(): void {
    // PropertyWare
    this.set('PW_URL', process.env.PW_URL || 'https://api.propertyware.com');
    this.set('PW_WSDL', process.env.PW_WSDL || 'https://api.propertyware.com/services?wsdl');
    this.set('PW_USERNAME', process.env.PW_USERNAME);
    this.set('PW_PASSWORD', process.env.PW_PASSWORD);
    
    // ServiceFusion
    this.set('SF_BASE_URL', process.env.SF_BASE_URL || 'https://api.servicefusion.com');
    this.set('SF_CLIENT_ID', process.env.SF_CLIENT_ID);
    this.set('SF_CLIENT_SECRET', process.env.SF_CLIENT_SECRET);
    
    // Supabase
    this.set('SUPABASE_URL', process.env.SUPABASE_URL);
    this.set('SUPABASE_SERVICE_ROLE', process.env.SUPABASE_SERVICE_ROLE);
    
    // AWS
    this.set('AWS_REGION', process.env.AWS_REGION || 'us-east-1');
    this.set('AWS_PROFILE', process.env.AWS_PROFILE || 'greenlight-dev');
    
    // GreenLight Lambda ARNs
    this.set('LAMBDA_WORKORDERS', process.env.LAMBDA_WORKORDERS || 'arn:aws:lambda:us-east-1:557477747490:function:GreenLightWorkOrders');
    this.set('LAMBDA_LEASES', process.env.LAMBDA_LEASES || 'arn:aws:lambda:us-east-1:557477747490:function:GreenLightLeases');
    this.set('LAMBDA_TENANTS', process.env.LAMBDA_TENANTS || 'arn:aws:lambda:us-east-1:557477747490:function:GreenLightTenants');
    this.set('LAMBDA_WEB', process.env.LAMBDA_WEB || 'arn:aws:lambda:us-east-1:557477747490:function:GreenLightWebTrigger');
    this.set('SNS_TOPIC', process.env.SNS_TOPIC || 'arn:aws:sns:us-east-1:557477747490:GreenLightSNSTopic');
    
    // Application settings
    this.set('NODE_ENV', process.env.NODE_ENV || 'development');
    this.set('LOG_LEVEL', process.env.LOG_LEVEL || 'info');
    this.set('PORT', process.env.PORT || 3000);
    this.set('DRY_RUN', process.env.DRY_RUN === 'true');
  }
  
  private setDefaults(): void {
    // Rate limits
    this.set('RATE_LIMIT_PW', 2); // requests per second
    this.set('RATE_LIMIT_SF', 0.5); // requests per second
    
    // Deduplication
    this.set('DEDUP_CONFIDENCE', 0.95);
    this.set('DEDUP_CACHE_TTL', 3600); // 1 hour
    
    // Retry policy
    this.set('MAX_RETRIES', 3);
    this.set('RETRY_DELAY', 1000); // 1 second
    this.set('RETRY_BACKOFF', 'exponential');
  }
  
  get(key: string): any {
    return this.config.get(key);
  }
  
  set(key: string, value: any): void {
    this.config.set(key, value);
  }
  
  has(key: string): boolean {
    return this.config.has(key);
  }
  
  getAll(): Record<string, any> {
    const obj: Record<string, any> = {};
    this.config.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  
  validate(): void {
    const required = [
      'PW_USERNAME',
      'PW_PASSWORD',
      'SF_CLIENT_ID',
      'SF_CLIENT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE'
    ];
    
    const missing = required.filter(key => !this.get(key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
}

export const config = new ConfigManager();