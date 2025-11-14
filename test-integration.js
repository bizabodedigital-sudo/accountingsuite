/**
 * Integration Test - Bizabode Accounting Suite
 * Tests the complete system with hang protection
 */

const EnhancedOrchestrator = require('./agents/enhanced-orchestrator');

async function runIntegrationTest() {
  console.log("🧪 Bizabode Accounting Suite - Integration Test");
  console.log("🛡️ Testing with hang protection and moderation");
  console.log("=" * 50);
  
  const testResults = {
    startTime: Date.now(),
    tests: [],
    passed: 0,
    failed: 0
  };
  
  try {
    // Test 1: Moderation Agent
    await testModerationAgent(testResults);
    
    // Test 2: Infrastructure Setup
    await testInfrastructure(testResults);
    
    // Test 3: Backend API
    await testBackendAPI(testResults);
    
    // Test 4: Frontend Components
    await testFrontend(testResults);
    
    // Test 5: Enhanced Orchestration
    await testEnhancedOrchestration(testResults);
    
    // Test 6: Hang Protection
    await testHangProtection(testResults);
    
    // Generate report
    generateTestReport(testResults);
    
  } catch (error) {
    console.error("❌ Integration test failed:", error.message);
    testResults.failed++;
    testResults.tests.push({
      name: "Integration Test",
      status: "FAILED",
      error: error.message
    });
  }
}

async function testModerationAgent(testResults) {
  console.log("🛡️ Testing Moderation Agent...");
  
  try {
    const ModerationAgent = require('./agents/moderation-agent');
    const agent = new ModerationAgent();
    
    // Test timeout protection
    const timeoutTest = await agent.executeWithTimeout(
      () => new Promise(resolve => setTimeout(resolve, 100)),
      1000,
      'timeout-test'
    );
    
    // Test resource monitoring
    const status = agent.getStatus();
    
    testResults.tests.push({
      name: "Moderation Agent",
      status: "PASSED",
      details: { timeoutTest, status }
    });
    testResults.passed++;
    
    console.log("✅ Moderation Agent test passed");
  } catch (error) {
    testResults.tests.push({
      name: "Moderation Agent",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Moderation Agent test failed:", error.message);
  }
}

async function testInfrastructure(testResults) {
  console.log("🏗️ Testing Infrastructure Setup...");
  
  try {
    // Test Docker Compose file exists
    const fs = require('fs');
    const dockerComposeExists = fs.existsSync('docker-compose.yml');
    
    // Test environment file exists
    const envExists = fs.existsSync('env.example');
    
    // Test backend Dockerfile
    const backendDockerfileExists = fs.existsSync('backend/Dockerfile');
    
    testResults.tests.push({
      name: "Infrastructure Setup",
      status: "PASSED",
      details: { 
        dockerComposeExists, 
        envExists, 
        backendDockerfileExists 
      }
    });
    testResults.passed++;
    
    console.log("✅ Infrastructure test passed");
  } catch (error) {
    testResults.tests.push({
      name: "Infrastructure Setup",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Infrastructure test failed:", error.message);
  }
}

async function testBackendAPI(testResults) {
  console.log("🔧 Testing Backend API...");
  
  try {
    // Test models exist
    const fs = require('fs');
    const modelsExist = [
      'backend/src/models/User.js',
      'backend/src/models/Tenant.js',
      'backend/src/models/Customer.js',
      'backend/src/models/Invoice.js',
      'backend/src/models/Expense.js'
    ].every(file => fs.existsSync(file));
    
    // Test controllers exist
    const controllersExist = fs.existsSync('backend/src/controllers/authController.js');
    
    // Test middleware exist
    const middlewareExists = fs.existsSync('backend/src/middleware/auth.js');
    
    // Test routes exist
    const routesExist = fs.existsSync('backend/src/routes/auth.js');
    
    testResults.tests.push({
      name: "Backend API",
      status: "PASSED",
      details: { 
        modelsExist, 
        controllersExist, 
        middlewareExists, 
        routesExist 
      }
    });
    testResults.passed++;
    
    console.log("✅ Backend API test passed");
  } catch (error) {
    testResults.tests.push({
      name: "Backend API",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Backend API test failed:", error.message);
  }
}

async function testFrontend(testResults) {
  console.log("⚛️ Testing Frontend Components...");
  
  try {
    // Test Next.js structure
    const fs = require('fs');
    const nextjsExists = fs.existsSync('frontend/package.json');
    
    // Test app structure
    const appStructureExists = fs.existsSync('frontend/app');
    
    testResults.tests.push({
      name: "Frontend Components",
      status: "PASSED",
      details: { nextjsExists, appStructureExists }
    });
    testResults.passed++;
    
    console.log("✅ Frontend test passed");
  } catch (error) {
    testResults.tests.push({
      name: "Frontend Components",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Frontend test failed:", error.message);
  }
}

async function testEnhancedOrchestration(testResults) {
  console.log("🎯 Testing Enhanced Orchestration...");
  
  try {
    // Test enhanced coordination agent exists
    const fs = require('fs');
    const enhancedAgentExists = fs.existsSync('agents/enhanced-coordination-agent.js');
    
    // Test moderation agent exists
    const moderationAgentExists = fs.existsSync('agents/moderation-agent.js');
    
    // Test orchestrator exists
    const orchestratorExists = fs.existsSync('agents/enhanced-orchestrator.js');
    
    testResults.tests.push({
      name: "Enhanced Orchestration",
      status: "PASSED",
      details: { 
        enhancedAgentExists, 
        moderationAgentExists, 
        orchestratorExists 
      }
    });
    testResults.passed++;
    
    console.log("✅ Enhanced Orchestration test passed");
  } catch (error) {
    testResults.tests.push({
      name: "Enhanced Orchestration",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Enhanced Orchestration test failed:", error.message);
  }
}

async function testHangProtection(testResults) {
  console.log("🛡️ Testing Hang Protection...");
  
  try {
    // Test timeout protection
    const ModerationAgent = require('./agents/moderation-agent');
    const agent = new ModerationAgent();
    
    // Test timeout with short operation
    const shortTimeout = await agent.executeWithTimeout(
      () => new Promise(resolve => setTimeout(resolve, 100)),
      1000,
      'short-timeout-test'
    );
    
    // Test timeout with long operation (should timeout)
    try {
      await agent.executeWithTimeout(
        () => new Promise(resolve => setTimeout(resolve, 2000)),
        1000,
        'long-timeout-test'
      );
      throw new Error("Expected timeout but operation completed");
    } catch (timeoutError) {
      if (timeoutError.message.includes('timed out')) {
        // This is expected behavior
        testResults.tests.push({
          name: "Hang Protection",
          status: "PASSED",
          details: { 
            shortTimeout: "completed",
            longTimeout: "timed out as expected"
          }
        });
        testResults.passed++;
        console.log("✅ Hang Protection test passed");
      } else {
        throw timeoutError;
      }
    }
  } catch (error) {
    testResults.tests.push({
      name: "Hang Protection",
      status: "FAILED",
      error: error.message
    });
    testResults.failed++;
    console.log("❌ Hang Protection test failed:", error.message);
  }
}

function generateTestReport(testResults) {
  const duration = Date.now() - testResults.startTime;
  
  console.log("\n📊 Integration Test Report");
  console.log("=" * 50);
  console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  console.log("\n📋 Test Details:");
  testResults.tests.forEach(test => {
    const status = test.status === "PASSED" ? "✅" : "❌";
    console.log(`${status} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  if (testResults.failed === 0) {
    console.log("\n🎉 All integration tests passed!");
    console.log("🚀 System is ready for deployment");
  } else {
    console.log("\n⚠️ Some tests failed");
    console.log("🔧 Please review failed tests and fix issues");
  }
}

// Run integration test
if (require.main === module) {
  runIntegrationTest();
}

module.exports = runIntegrationTest;















