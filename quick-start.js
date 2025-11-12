/**
 * Quick Start Script - Bizabode Accounting Suite
 * Demonstrates the enhanced orchestration with hang protection
 */

const EnhancedOrchestrator = require('./agents/enhanced-orchestrator');

async function quickStart() {
  console.log("🚀 Bizabode Accounting Suite - Quick Start");
  console.log("🛡️ Enhanced with hang protection and moderation");
  console.log("=" * 50);
  
  try {
    const orchestrator = new EnhancedOrchestrator();
    
    // Set up status monitoring
    const statusInterval = setInterval(() => {
      const status = orchestrator.getStatus();
      console.log(`📊 Status - Duration: ${status.duration}s, Memory: ${status.memoryUsage}MB`);
    }, 10000); // Every 10 seconds
    
    // Start orchestration
    await orchestrator.start();
    
    // Clear status monitoring
    clearInterval(statusInterval);
    
    console.log("\n🎉 Quick start completed successfully!");
    console.log("📋 Next steps:");
    console.log("  1. Run: npm run install:bmad");
    console.log("  2. Run: npm run dev");
    console.log("  3. Open: http://localhost:3000");
    
  } catch (error) {
    console.error("\n❌ Quick start failed:", error.message);
    console.log("\n🔄 Recovery options:");
    console.log("  1. Check system requirements");
    console.log("  2. Verify Docker is running");
    console.log("  3. Try: npm run clean && npm run install:bmad");
  }
}

// Run quick start
if (require.main === module) {
  quickStart();
}

module.exports = quickStart;











