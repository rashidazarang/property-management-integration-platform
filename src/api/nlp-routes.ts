/**
 * Natural Language Processing API Routes
 * Provides HTTP endpoints for MCP Intelligence integration
 */

import { Router, Request, Response } from 'express';
import { PMIP } from '../index.js';
import { logger } from '../utils/logger.js';

export function createNLPRoutes(pmip: PMIP): Router {
  const router = Router();

  /**
   * POST /api/nlp/query
   * Process a natural language query
   */
  router.post('/query', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }
      
      logger.info(`NLP Query received: "${query}"`);
      
      const result = await pmip.query(query);
      
      res.json({
        success: true,
        query,
        result
      });
    } catch (error) {
      logger.error('NLP query error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * GET /api/nlp/suggestions
   * Get query suggestions based on partial input
   */
  router.get('/suggestions', async (req: Request, res: Response) => {
    try {
      const partial = req.query.partial as string || '';
      
      const suggestions = await pmip.getSuggestions(partial);
      
      res.json({
        success: true,
        partial,
        suggestions
      });
    } catch (error) {
      logger.error('Suggestions error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /api/nlp/validate
   * Validate a query before execution
   */
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }
      
      // For now, all queries are valid with mock intelligence
      // Real validation will come with MCP Intelligence package
      res.json({
        success: true,
        query,
        validation: {
          isValid: true,
          confidence: 0.85,
          suggestions: []
        }
      });
    } catch (error) {
      logger.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * GET /api/nlp/examples
   * Get example queries for different operations
   */
  router.get('/examples', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      
      const examples: Record<string, string[]> = {
        propertyware: [
          'Show all portfolios',
          'Show all buildings',
          'Show all open work orders',
          'Create a work order for unit 501',
          'Create an emergency maintenance work order',
          'Show leases expiring this month',
          'List all tenants in building 123'
        ],
        servicefusion: [
          'List all customers',
          'Show today\'s jobs',
          'List all available technicians',
          'Create a job for customer ABC',
          'Assign technician John to job 123',
          'Create an estimate for job 456',
          'Generate invoice for completed job'
        ],
        sync: [
          'Sync work orders from PropertyWare to ServiceFusion',
          'Sync jobs from ServiceFusion to PropertyWare',
          'Copy today\'s work orders to ServiceFusion',
          'Update PropertyWare with completed jobs'
        ],
        all: []
      };
      
      // Combine all examples
      examples.all = [
        ...examples.propertyware,
        ...examples.servicefusion,
        ...examples.sync
      ];
      
      const result = category && examples[category] 
        ? examples[category]
        : examples.all;
      
      res.json({
        success: true,
        category: category || 'all',
        examples: result
      });
    } catch (error) {
      logger.error('Examples error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /api/nlp/batch
   * Process multiple queries in batch
   */
  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const { queries } = req.body;
      
      if (!queries || !Array.isArray(queries)) {
        return res.status(400).json({
          success: false,
          error: 'Queries array is required'
        });
      }
      
      const results = [];
      
      for (const query of queries) {
        try {
          const result = await pmip.query(query);
          results.push({
            query,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            query,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      res.json({
        success: true,
        total: queries.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (error) {
      logger.error('Batch query error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  return router;
}

/**
 * Example usage in Express app:
 * 
 * import express from 'express';
 * import { createPMIP } from '@pmip/core';
 * import { createNLPRoutes } from './api/nlp-routes';
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * const pmip = await createPMIP(config);
 * const nlpRoutes = createNLPRoutes(pmip);
 * 
 * app.use('/api/nlp', nlpRoutes);
 * 
 * app.listen(3000, () => {
 *   console.log('PMIP API running on port 3000');
 * });
 */