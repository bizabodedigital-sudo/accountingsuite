/**
 * Bizabode Accounting Suite - Agent Orchestrator
 * Coordinates the execution of specialized agents according to BMad-Method framework
 */

const CoordinationAgent = require('./coordination-agent');

class Orchestrator {
  constructor() {
    this.startTime = Date.now();
    this.coordinationAgent = new CoordinationAgent();
  }

  async start() {
    console.log("🚀 Bizabode Accounting Suite - Agent Orchestrator Starting...");
    console.log("📋 Following BMad-Method framework guidelines");
    console.log("=" * 60);
    
    try {
      await this.coordinationAgent.execute();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n🎉 Orchestration completed successfully in ${duration}ms`);
      console.log("📦 Ready for: npm run install:bmad");
      
    } catch (error) {
      console.error("\n❌ Orchestration failed:", error.message);
      process.exit(1);
    }
  }
}

// Start the orchestration
if (require.main === module) {
  const orchestrator = new Orchestrator();
  orchestrator.start();
}

module.exports = Orchestrator;













