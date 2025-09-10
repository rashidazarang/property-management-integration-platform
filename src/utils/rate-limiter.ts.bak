/**
 * Rate Limiter utility for PMIP
 * Controls API request rates to avoid hitting limits
 */

export class RateLimiter {
  private interval: number;
  private lastCall: number = 0;
  private queue: Array<() => void> = [];
  private processing: boolean = false;
  
  constructor(requestsPerSecond: number = 1) {
    this.interval = 1000 / requestsPerSecond;
  }
  
  /**
   * Wait for rate limit before proceeding
   */
  async wait(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }
  
  /**
   * Process the queue of waiting requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCall;
      const delay = Math.max(0, this.interval - timeSinceLastCall);
      
      if (delay > 0) {
        await this.sleep(delay);
      }
      
      this.lastCall = Date.now();
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
    }
    
    this.processing = false;
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.lastCall = 0;
    this.queue = [];
    this.processing = false;
  }
  
  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
  
  /**
   * Update rate limit
   */
  setRate(requestsPerSecond: number): void {
    this.interval = 1000 / requestsPerSecond;
  }
}