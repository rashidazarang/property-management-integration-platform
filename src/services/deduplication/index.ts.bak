/**
 * Deduplication Service for PMIP
 * Prevents duplicate records across property management systems
 */

import { EventEmitter } from 'events';
import { DeduplicationConfig, DeduplicationStrategy } from '../../types';
import { logger } from '../../utils/logger';
import * as crypto from 'crypto';

interface MatchResult {
  id: string;
  type: string;
  confidence: number;
  matchedFields: string[];
  entity: any;
}

export class DeduplicationService extends EventEmitter {
  private config: DeduplicationConfig;
  private cache: Map<string, any> = new Map();
  private strategies: Map<DeduplicationStrategy, Function> = new Map();
  
  constructor(config: DeduplicationConfig) {
    super();
    this.config = config;
    this.initializeStrategies();
  }
  
  /**
   * Initialize deduplication strategies
   */
  private initializeStrategies(): void {
    // Entity ID matching (exact match on PropertyWare/ServiceFusion IDs)
    this.strategies.set('entity-id', this.entityIdStrategy.bind(this));
    
    // Address matching (normalize and compare addresses)
    this.strategies.set('address-matching', this.addressMatchingStrategy.bind(this));
    
    // Name fuzzy matching (Levenshtein distance)
    this.strategies.set('name-fuzzy', this.nameFuzzyStrategy.bind(this));
    
    // Phone/Email matching
    this.strategies.set('phone-email', this.phoneEmailStrategy.bind(this));
    
    // Parent-child relationship matching
    this.strategies.set('parent-child', this.parentChildStrategy.bind(this));
    
    // Work order history matching
    this.strategies.set('work-order-history', this.workOrderHistoryStrategy.bind(this));
  }
  
  /**
   * Find matches for an entity
   */
  async findMatches(entity: any): Promise<MatchResult[]> {
    if (!this.config.enabled) {
      return [];
    }
    
    const matches: MatchResult[] = [];
    const entityHash = this.generateHash(entity);
    
    // Check cache first
    if (this.config.cache && this.cache.has(entityHash)) {
      const cached = this.cache.get(entityHash);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour TTL
        return cached.matches;
      }
    }
    
    // Run configured strategies
    for (const strategyName of this.config.strategies) {
      const strategy = this.strategies.get(strategyName);
      if (strategy) {
        try {
          const strategyMatches = await strategy(entity);
          matches.push(...strategyMatches);
        } catch (error) {
          logger.error(`Deduplication strategy ${strategyName} failed`, error);
        }
      }
    }
    
    // Deduplicate and sort matches by confidence
    const uniqueMatches = this.deduplicateMatches(matches);
    uniqueMatches.sort((a, b) => b.confidence - a.confidence);
    
    // Filter by confidence threshold
    const filteredMatches = uniqueMatches.filter(m => m.confidence >= this.config.confidence);
    
    // Cache results
    if (this.config.cache) {
      this.cache.set(entityHash, {
        matches: filteredMatches,
        timestamp: Date.now()
      });
    }
    
    // Emit event if duplicates found
    if (filteredMatches.length > 0) {
      this.emit('duplicate.detected', {
        entity,
        matches: filteredMatches,
        confidence: filteredMatches[0].confidence
      });
    }
    
    return filteredMatches;
  }
  
  /**
   * Entity ID matching strategy
   */
  private async entityIdStrategy(entity: any): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];
    
    // Check for PropertyWare ID
    if (entity.pwEntityId) {
      // Query database for existing entity with same PW ID
      // This would be a real database query in production
      const existing = await this.queryByPwId(entity.pwEntityId);
      if (existing) {
        matches.push({
          id: existing.id,
          type: 'entity-id',
          confidence: 1.0,
          matchedFields: ['pwEntityId'],
          entity: existing
        });
      }
    }
    
    // Check for ServiceFusion ID
    if (entity.sfCustomerId || entity.sfJobId) {
      const existing = await this.queryBySfId(entity.sfCustomerId || entity.sfJobId);
      if (existing) {
        matches.push({
          id: existing.id,
          type: 'entity-id',
          confidence: 1.0,
          matchedFields: ['sfCustomerId', 'sfJobId'],
          entity: existing
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Address matching strategy
   */
  private async addressMatchingStrategy(entity: any): Promise<MatchResult[]> {
    if (!entity.address) return [];
    
    const normalizedAddress = this.normalizeAddress(entity.address);
    const candidates = await this.queryByAddress(normalizedAddress);
    
    return candidates.map(candidate => ({
      id: candidate.id,
      type: 'address',
      confidence: this.calculateAddressConfidence(normalizedAddress, candidate.address),
      matchedFields: ['address'],
      entity: candidate
    }));
  }
  
  /**
   * Name fuzzy matching strategy
   */
  private async nameFuzzyStrategy(entity: any): Promise<MatchResult[]> {
    if (!entity.name && !entity.customerName) return [];
    
    const name = entity.name || entity.customerName;
    const candidates = await this.queryByNameFuzzy(name);
    
    return candidates.map(candidate => ({
      id: candidate.id,
      type: 'name-fuzzy',
      confidence: this.calculateNameSimilarity(name, candidate.name || candidate.customerName),
      matchedFields: ['name'],
      entity: candidate
    }));
  }
  
  /**
   * Phone/Email matching strategy
   */
  private async phoneEmailStrategy(entity: any): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];
    
    if (entity.phone) {
      const phoneMatches = await this.queryByPhone(this.normalizePhone(entity.phone));
      matches.push(...phoneMatches.map(m => ({
        id: m.id,
        type: 'phone',
        confidence: 0.95,
        matchedFields: ['phone'],
        entity: m
      })));
    }
    
    if (entity.email) {
      const emailMatches = await this.queryByEmail(entity.email.toLowerCase());
      matches.push(...emailMatches.map(m => ({
        id: m.id,
        type: 'email',
        confidence: 0.98,
        matchedFields: ['email'],
        entity: m
      })));
    }
    
    return matches;
  }
  
  /**
   * Parent-child relationship matching
   */
  private async parentChildStrategy(entity: any): Promise<MatchResult[]> {
    if (!entity.parentId && !entity.portfolioId && !entity.buildingId) return [];
    
    const parentId = entity.parentId || entity.portfolioId || entity.buildingId;
    const siblings = await this.queryByParent(parentId);
    
    return siblings
      .filter(s => this.isSimilarEntity(entity, s))
      .map(s => ({
        id: s.id,
        type: 'parent-child',
        confidence: 0.85,
        matchedFields: ['parentId', 'name'],
        entity: s
      }));
  }
  
  /**
   * Work order history matching
   */
  private async workOrderHistoryStrategy(entity: any): Promise<MatchResult[]> {
    if (entity.type !== 'workOrder' || !entity.description) return [];
    
    // Check for similar work orders in same building within 7 days
    const recentWorkOrders = await this.queryRecentWorkOrders(
      entity.buildingId,
      7 * 24 * 60 * 60 * 1000 // 7 days
    );
    
    return recentWorkOrders
      .filter(wo => this.calculateDescriptionSimilarity(entity.description, wo.description) > 0.8)
      .map(wo => ({
        id: wo.id,
        type: 'work-order-history',
        confidence: 0.9,
        matchedFields: ['buildingId', 'description', 'timeframe'],
        entity: wo
      }));
  }
  
  // Utility methods
  
  private generateHash(entity: any): string {
    const str = JSON.stringify(entity);
    return crypto.createHash('md5').update(str).digest('hex');
  }
  
  private deduplicateMatches(matches: MatchResult[]): MatchResult[] {
    const seen = new Set<string>();
    return matches.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }
  
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\bapt\b/g, 'apartment')
      .replace(/\bst\b/g, 'street')
      .replace(/\bave\b/g, 'avenue')
      .replace(/\bdr\b/g, 'drive')
      .replace(/\brd\b/g, 'road')
      .trim();
  }
  
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
  
  private calculateAddressConfidence(addr1: string, addr2: string): number {
    const normalized1 = this.normalizeAddress(addr1);
    const normalized2 = this.normalizeAddress(addr2);
    
    if (normalized1 === normalized2) return 1.0;
    
    // Calculate token overlap
    const tokens1 = new Set(normalized1.split(' '));
    const tokens2 = new Set(normalized2.split(' '));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }
  
  private calculateNameSimilarity(name1: string, name2: string): number {
    // Levenshtein distance normalized to 0-1
    const distance = this.levenshteinDistance(name1.toLowerCase(), name2.toLowerCase());
    const maxLength = Math.max(name1.length, name2.length);
    return 1 - (distance / maxLength);
  }
  
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    // Token-based similarity
    const tokens1 = new Set(desc1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(desc2.toLowerCase().split(/\s+/));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private isSimilarEntity(entity1: any, entity2: any): boolean {
    // Check if entities are similar based on multiple factors
    if (entity1.name && entity2.name) {
      return this.calculateNameSimilarity(entity1.name, entity2.name) > 0.8;
    }
    return false;
  }
  
  // Database query methods (placeholders - would connect to real database)
  
  private async queryByPwId(pwId: string): Promise<any> {
    // Query Supabase for entity with matching PW ID
    return null;
  }
  
  private async queryBySfId(sfId: string): Promise<any> {
    // Query Supabase for entity with matching SF ID
    return null;
  }
  
  private async queryByAddress(address: string): Promise<any[]> {
    // Query Supabase for entities with similar addresses
    return [];
  }
  
  private async queryByNameFuzzy(name: string): Promise<any[]> {
    // Query Supabase for entities with similar names
    return [];
  }
  
  private async queryByPhone(phone: string): Promise<any[]> {
    // Query Supabase for entities with matching phone
    return [];
  }
  
  private async queryByEmail(email: string): Promise<any[]> {
    // Query Supabase for entities with matching email
    return [];
  }
  
  private async queryByParent(parentId: string): Promise<any[]> {
    // Query Supabase for entities with same parent
    return [];
  }
  
  private async queryRecentWorkOrders(buildingId: string, timeframe: number): Promise<any[]> {
    // Query Supabase for recent work orders in building
    return [];
  }
}