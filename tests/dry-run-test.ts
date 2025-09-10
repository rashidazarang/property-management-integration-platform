/**
 * PMIP Dry-Run Mode Test Harness
 * Tests the integration platform in dry-run mode with mock data
 */

import { createPMIP, PMIP } from '../src';
import { PMIPConfig } from '../src/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Create test configuration from environment variables
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
 * Test PropertyWare operations in dry-run mode
 */
async function testPropertyWareDryRun(pmip: PMIP) {
  console.log('\n=== Testing PropertyWare Integration (DRY-RUN) ===\n');
  
  const pw = pmip.getIntegration('propertyware');
  if (!pw) {
    console.error('PropertyWare integration not found');
    return;
  }
  
  try {
    // Test getting portfolios
    console.log('1. Getting portfolios...');
    const portfolios = await pw.getPortfolios();
    console.log(`   Found ${portfolios.length} mock portfolios`);
    portfolios.forEach(p => {
      console.log(`   - ${p.portfolioId}: ${p.name} (Owner: ${p.ownerFirstName} ${p.ownerLastName})`);
    });
    
    // Test getting buildings
    console.log('\n2. Getting buildings...');
    const buildings = await pw.getBuildings();
    console.log(`   Found ${buildings.length} mock buildings`);
    buildings.forEach(b => {
      console.log(`   - ${b.buildingId}: ${b.buildingName} at ${b.address}, ${b.city}, ${b.state}`);
    });
    
    // Test getting work orders
    console.log('\n3. Getting work orders...');
    const workOrders = await pw.getWorkOrders();
    console.log(`   Found ${workOrders.length} mock work orders`);
    workOrders.forEach(wo => {
      console.log(`   - ${wo.workOrderId}: ${wo.description} (Status: ${wo.status}, Priority: ${wo.priority})`);
    });
    
    // Test creating a work order
    console.log('\n4. Creating a new work order...');
    const newWorkOrder = await pw.createWorkOrder({
      buildingId: 'MOCK-BLD-001',
      portfolioId: 'MOCK-PF-001',
      description: 'Test work order from dry-run',
      priority: 'Normal',
      category: 'Maintenance'
    });
    console.log(`   Created work order: ${newWorkOrder.workOrderId}`);
    console.log(`   Status: ${newWorkOrder.status}`);
    
    // Test updating a work order
    console.log('\n5. Updating work order...');
    const updatedWorkOrder = await pw.updateWorkOrder('MOCK-WO-001', {
      status: 'Completed',
      completedAt: new Date()
    });
    console.log(`   Updated work order: ${updatedWorkOrder.workOrderId}`);
    console.log(`   New status: ${updatedWorkOrder.status}`);
    
  } catch (error) {
    console.error('PropertyWare test error:', error);
  }
}

/**
 * Test ServiceFusion operations in dry-run mode
 */
async function testServiceFusionDryRun(pmip: PMIP) {
  console.log('\n=== Testing ServiceFusion Integration (DRY-RUN) ===\n');
  
  const sf = pmip.getIntegration('servicefusion');
  if (!sf) {
    console.error('ServiceFusion integration not found');
    return;
  }
  
  try {
    // Test getting customers
    console.log('1. Getting customers...');
    const customers = await sf.getCustomers();
    console.log(`   Found ${customers.length} mock customers`);
    customers.forEach(c => {
      console.log(`   - ${c.customerId}: ${c.customerName} (Type: ${c.customerType})`);
    });
    
    // Test getting jobs
    console.log('\n2. Getting jobs...');
    const jobs = await sf.getJobs();
    console.log(`   Found ${jobs.length} mock jobs`);
    jobs.forEach(j => {
      console.log(`   - ${j.jobId}: ${j.description} (Status: ${j.status}, Priority: ${j.priority})`);
    });
    
    // Test creating a customer
    console.log('\n3. Creating a new customer...');
    const newCustomer = await sf.createCustomer({
      customerName: 'Test Customer from Dry-Run',
      customerType: 'building',
      address: '789 Test Street, Test City, CA 90210',
      phone: '555-9999',
      email: 'test@dryrun.com'
    });
    console.log(`   Created customer: ${newCustomer.customerId}`);
    console.log(`   Name: ${newCustomer.customerName}`);
    
    // Test creating a job
    console.log('\n4. Creating a new job...');
    const newJob = await sf.createJob({
      customerId: 'MOCK-SF-CUST-002',
      description: 'Test job from dry-run',
      priority: 'normal',
      category: 'General Maintenance',
      scheduledDate: new Date('2024-09-15')
    });
    console.log(`   Created job: ${newJob.jobId}`);
    console.log(`   Check number: ${newJob.checkNumber}`);
    console.log(`   Status: ${newJob.status}`);
    
    // Test updating a job
    console.log('\n5. Updating job...');
    const updatedJob = await sf.updateJob('MOCK-SF-JOB-001', {
      status: 'completed',
      completedDate: new Date()
    });
    console.log(`   Updated job: ${updatedJob.jobId}`);
    console.log(`   New status: ${updatedJob.status}`);
    
  } catch (error) {
    console.error('ServiceFusion test error:', error);
  }
}

/**
 * Test workflow synchronization in dry-run mode
 */
async function testWorkflowSync(pmip: PMIP) {
  console.log('\n=== Testing Workflow Sync (DRY-RUN) ===\n');
  
  const pw = pmip.getIntegration('propertyware');
  const sf = pmip.getIntegration('servicefusion');
  
  if (!pw || !sf) {
    console.error('Both integrations required for sync test');
    return;
  }
  
  try {
    console.log('1. Simulating PropertyWare -> ServiceFusion sync...');
    
    // Get work orders from PropertyWare
    const workOrders = await pw.getWorkOrders();
    console.log(`   Found ${workOrders.length} work orders in PropertyWare`);
    
    // For each work order, create/update job in ServiceFusion
    for (const wo of workOrders) {
      console.log(`\n   Processing work order: ${wo.workOrderId}`);
      console.log(`   - Description: ${wo.description}`);
      console.log(`   - Status: ${wo.status}`);
      
      // In dry-run mode, simulate creating a job
      const job = await sf.createJob({
        description: wo.description,
        priority: wo.priority?.toLowerCase() || 'normal',
        category: wo.category || 'General',
        customFields: {
          propertyWareId: wo.workOrderId,
          buildingId: wo.buildingId,
          portfolioId: wo.portfolioId
        }
      });
      
      console.log(`   ✓ Created ServiceFusion job: ${job.jobId}`);
    }
    
    console.log('\n2. Simulating ServiceFusion -> PropertyWare sync...');
    
    // Get jobs from ServiceFusion
    const jobs = await sf.getJobs();
    console.log(`   Found ${jobs.length} jobs in ServiceFusion`);
    
    // For completed jobs, update work orders in PropertyWare
    const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'in_progress');
    for (const job of completedJobs) {
      if (job.customFields?.propertyWareId) {
        console.log(`\n   Processing job: ${job.jobId}`);
        console.log(`   - PropertyWare ID: ${job.customFields.propertyWareId}`);
        console.log(`   - Status: ${job.status}`);
        
        const updatedWO = await pw.updateWorkOrder(job.customFields.propertyWareId, {
          status: job.status === 'completed' ? 'Completed' : 'In Progress',
          sfJobId: job.jobId
        });
        
        console.log(`   ✓ Updated PropertyWare work order: ${updatedWO.workOrderId}`);
      }
    }
    
  } catch (error) {
    console.error('Workflow sync test error:', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('================================================');
  console.log('    PMIP DRY-RUN MODE INTEGRATION TEST');
  console.log('================================================');
  console.log('\n🏗️  Running in DRY-RUN mode - No actual API calls will be made');
  console.log('📋 All operations will use mock data\n');
  
  let pmip: PMIP | null = null;
  
  try {
    // Create configuration
    const config = createTestConfig();
    
    // Initialize PMIP with dry-run mode enabled
    console.log('Initializing PMIP with dry-run mode...\n');
    pmip = await createPMIP(config, {
      dryRun: true,
      reuseGreenlight: false
    });
    
    // Run PropertyWare tests
    await testPropertyWareDryRun(pmip);
    
    // Run ServiceFusion tests
    await testServiceFusionDryRun(pmip);
    
    // Run workflow sync test
    await testWorkflowSync(pmip);
    
    // Get status
    console.log('\n=== PMIP Status ===\n');
    const status = await pmip.getStatus();
    console.log('Integrations:', status.integrations);
    console.log('Workflows:', status.workflows?.length || 0, 'registered');
    
    console.log('\n================================================');
    console.log('✅ DRY-RUN TEST COMPLETED SUCCESSFULLY');
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
// Simply run the tests as this file is imported by tsx
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

export { runTests, createTestConfig };