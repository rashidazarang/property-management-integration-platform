/**
 * Natural Language Processing Test
 * Tests the MCP Intelligence integration with PMIP
 */

import { createPMIP, PMIP } from '../src';
import { PMIPConfig } from '../src/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Create test configuration
 */
function createTestConfig(): PMIPConfig {
  return {
    environment: 'development',
    region: 'us-east-1',
    integrations: {
      propertyware: {
        url: process.env.PROPERTYWARE_URL || 'https://app.propertyware.com/pw/api/v1/soap.asmx',
        wsdl: process.env.PROPERTYWARE_WSDL || 'https://app.propertyware.com/pw/api/v1/soap.asmx?WSDL',
        username: process.env.PROPERTYWARE_USERNAME || 'test-username',
        password: process.env.PROPERTYWARE_PASSWORD || 'test-password',
        rateLimit: 2,
        timeout: 30000
      },
      servicefusion: {
        baseUrl: process.env.SERVICEFUSION_BASE_URL || 'https://api.servicefusion.com/v1',
        clientId: process.env.SERVICEFUSION_CLIENT_ID || 'test-client-id',
        clientSecret: process.env.SERVICEFUSION_CLIENT_SECRET || 'test-client-secret',
        rateLimit: 0.5,
        timeout: 30000
      }
    },
    dataWarehouse: {
      type: 'supabase',
      url: process.env.SUPABASE_URL || 'https://test.supabase.co',
      key: process.env.SUPABASE_KEY || 'test-key',
      ssl: true
    },
    deduplication: {
      enabled: true,
      confidence: 0.8,
      strategies: ['entity-id', 'address-matching', 'name-fuzzy']
    }
  };
}

/**
 * Test natural language queries
 */
async function testNaturalLanguageQueries(pmip: PMIP) {
  console.log('\n=== Testing Natural Language Queries ===\n');
  
  const testQueries = [
    // PropertyWare queries
    'Show all portfolios',
    'Show all buildings',
    'Show all open work orders',
    'Create an emergency work order for unit 501',
    'Show high priority work orders',
    
    // ServiceFusion queries
    'List all customers',
    'Show today\'s jobs',
    'List all technicians',
    'Create a job for maintenance',
    
    // Cross-system queries
    'Sync work orders from PropertyWare to ServiceFusion',
    'Copy today\'s work orders to ServiceFusion jobs'
  ];
  
  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const result = await pmip.query(query);
      
      if (result.success === false) {
        console.log('❌ Query failed:', result.errors);
        if (result.suggestions) {
          console.log('💡 Suggestions:', result.suggestions);
        }
      } else {
        console.log('✅ Query successful');
        console.log('📊 Results:', 
          Array.isArray(result) ? `${result.length} items` : 
          typeof result === 'object' ? Object.keys(result).join(', ') : 
          result
        );
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
    }
  }
}

/**
 * Test query suggestions
 */
async function testSuggestions(pmip: PMIP) {
  console.log('\n=== Testing Query Suggestions ===\n');
  
  const partials = ['show', 'create', 'sync', 'work', 'job', 'tech'];
  
  for (const partial of partials) {
    console.log(`\nPartial: "${partial}"`);
    console.log('─'.repeat(30));
    
    const suggestions = await pmip.getSuggestions(partial);
    
    if (suggestions.length > 0) {
      console.log('Suggestions:');
      suggestions.forEach(s => console.log(`  • ${s}`));
    } else {
      console.log('No suggestions found');
    }
  }
}

/**
 * Test cross-system sync
 */
async function testCrossSystemSync(pmip: PMIP) {
  console.log('\n=== Testing Cross-System Sync ===\n');
  
  try {
    // Test PropertyWare to ServiceFusion sync
    console.log('1. Syncing work orders to ServiceFusion...');
    const pw2sf = await pmip.query('Sync open work orders from PropertyWare to ServiceFusion');
    
    if (pw2sf.synced !== undefined) {
      console.log(`   ✅ Synced ${pw2sf.synced} work orders`);
      console.log(`   - Work Orders: ${pw2sf.workOrders?.length || 0}`);
      console.log(`   - Jobs Created: ${pw2sf.jobs?.length || 0}`);
    } else {
      console.log('   ℹ️  Result:', pw2sf);
    }
    
    // Test ServiceFusion to PropertyWare sync
    console.log('\n2. Syncing jobs back to PropertyWare...');
    const sf2pw = await pmip.query('Update PropertyWare with completed ServiceFusion jobs');
    
    if (sf2pw.synced !== undefined) {
      console.log(`   ✅ Updated ${sf2pw.synced} work orders`);
      console.log(`   - Jobs: ${sf2pw.jobs?.length || 0}`);
      console.log(`   - Work Orders Updated: ${sf2pw.workOrders?.length || 0}`);
    } else {
      console.log('   ℹ️  Result:', sf2pw);
    }
    
  } catch (error) {
    console.error('❌ Cross-system sync error:', error);
  }
}

/**
 * Demonstrate complex queries
 */
async function testComplexQueries(pmip: PMIP) {
  console.log('\n=== Testing Complex Queries ===\n');
  
  const complexQueries = [
    {
      query: 'Create an emergency work order for plumbing issue at unit 501 in Anderson Tower',
      description: 'Creates work order with extracted details'
    },
    {
      query: 'Show all high priority open work orders from today',
      description: 'Filters by priority, status, and date'
    },
    {
      query: 'Assign technician John Smith to job 123',
      description: 'Assigns specific technician to specific job'
    },
    {
      query: 'Create a job in ServiceFusion for each open PropertyWare work order',
      description: 'Batch operation across systems'
    }
  ];
  
  for (const { query, description } of complexQueries) {
    console.log(`\n📝 ${description}`);
    console.log(`Query: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      const result = await pmip.query(query);
      console.log('✅ Result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('================================================');
  console.log('    PMIP NATURAL LANGUAGE PROCESSING TEST');
  console.log('    Powered by MCP Intelligence');
  console.log('================================================');
  console.log('\n🧠 Testing semantic understanding and intelligent routing\n');
  
  let pmip: PMIP | null = null;
  
  try {
    // Create configuration
    const config = createTestConfig();
    
    // Initialize PMIP with Intelligence Service
    console.log('Initializing PMIP with Intelligence Service...\n');
    pmip = await createPMIP(config, {
      dryRun: true,  // Use dry-run mode for testing
      reuseGreenlight: false
    });
    
    // Test natural language queries
    await testNaturalLanguageQueries(pmip);
    
    // Test suggestions
    await testSuggestions(pmip);
    
    // Test cross-system sync
    await testCrossSystemSync(pmip);
    
    // Test complex queries
    await testComplexQueries(pmip);
    
    console.log('\n================================================');
    console.log('✅ NATURAL LANGUAGE PROCESSING TEST COMPLETED');
    console.log('================================================\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (pmip) {
      await pmip.shutdown();
    }
  }
}

// Run tests if executed directly
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

export { runTests, createTestConfig };