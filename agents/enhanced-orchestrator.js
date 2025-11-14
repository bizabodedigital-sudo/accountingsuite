/**
 * Enhanced Bizabode Accounting Suite - Agent Orchestrator
 * Uses Moderation Agent to prevent hangs and ensure smooth execution
 * Coordinates the execution of specialized agents with timeout protection
 */

const EnhancedCoordinationAgent = require('./enhanced-coordination-agent');

class EnhancedOrchestrator {
  constructor() {
    this.startTime = Date.now();
    this.coordinationAgent = new EnhancedCoordinationAgent();
    this.maxExecutionTime = 600000; // 10 minutes
    this.heartbeatInterval = 30000; // 30 seconds
    this.heartbeatTimer = null;
  }

  async start() {
    console.log("🚀 Bizabode Accounting Suite - Enhanced Orchestrator Starting...");
    console.log("📋 Following BMad-Method framework guidelines with hang protection");
    console.log("=" * 60);
    
    try {
      // Set up heartbeat monitoring
      this.setupHeartbeat();
      
      // Set up global timeout
      const globalTimeout = setTimeout(() => {
        console.warn("⏰ Global execution timeout reached, initiating graceful shutdown");
        this.handleGlobalTimeout();
      }, this.maxExecutionTime);
      
      // Execute coordination
      await this.coordinationAgent.execute();
      
      // Clear timeout on success
      clearTimeout(globalTimeout);
      
      const duration = Date.now() - this.startTime;
      console.log(`\n🎉 Enhanced orchestration completed successfully in ${duration}ms`);
      console.log("📦 Ready for: npm run install:bmad");
      
      // Get final status
      const status = this.coordinationAgent.getEnhancedStatus();
      console.log("📊 Final system status:", status);
      
    } catch (error) {
      console.error("\n❌ Enhanced orchestration failed:", error.message);
      
      // Get error status
      const status = this.coordinationAgent.getEnhancedStatus();
      console.log("📊 Error status:", status);
      
      // Provide recovery suggestions
      this.provideRecoverySuggestions(error);
      
      process.exit(1);
    } finally {
      // Cleanup
      this.cleanup();
    }
  }

  setupHeartbeat() {
    console.log("💓 Setting up heartbeat monitoring...");
    
    this.heartbeatTimer = setInterval(() => {
      const duration = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage();
      
      console.log(`💓 Heartbeat - Duration: ${Math.round(duration/1000)}s, Memory: ${Math.round(memoryUsage.heapUsed/1024/1024)}MB`);
      
      // Check for potential issues
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn("⚠️ High memory usage detected");
      }
      
      if (duration > this.maxExecutionTime * 0.8) { // 80% of max time
        console.warn("⚠️ Approaching execution time limit");
      }
    }, this.heartbeatInterval);
  }

  handleGlobalTimeout() {
    console.log("⏰ Handling global timeout...");
    
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Get current status
    const status = this.coordinationAgent.getEnhancedStatus();
    console.log("📊 Timeout status:", status);
    
    // Provide timeout recovery options
    console.log("🔄 Timeout recovery options:");
    console.log("  1. Continue with reduced scope");
    console.log("  2. Use fallback components");
    console.log("  3. Manual intervention required");
  }

  provideRecoverySuggestions(error) {
    console.log("\n🔄 Recovery suggestions:");
    
    if (error.message.includes('timeout')) {
      console.log("  - Increase timeout limits");
      console.log("  - Use fallback components");
      console.log("  - Break down into smaller tasks");
    } else if (error.message.includes('memory')) {
      console.log("  - Reduce memory usage");
      console.log("  - Use streaming for large operations");
      console.log("  - Implement pagination");
    } else if (error.message.includes('database')) {
      console.log("  - Check database connection");
      console.log("  - Use mock database for development");
      console.log("  - Verify environment variables");
    } else {
      console.log("  - Check error logs for details");
      console.log("  - Verify all dependencies are installed");
      console.log("  - Try running individual components");
    }
  }

  cleanup() {
    console.log("🧹 Enhanced orchestrator cleanup...");
    
    // Clear heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Cleanup coordination agent
    if (this.coordinationAgent && this.coordinationAgent.moderationAgent) {
      this.coordinationAgent.moderationAgent.cleanup();
    }
    
    console.log("✅ Cleanup completed");
  }

  // Get orchestrator status
  getStatus() {
    const duration = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    return {
      duration: Math.round(duration / 1000),
      memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      coordinationStatus: this.coordinationAgent ? this.coordinationAgent.getEnhancedStatus() : null,
      heartbeatActive: !!this.heartbeatTimer
    };
  }
}

// Start the enhanced orchestration
if (require.main === module) {
  const orchestrator = new EnhancedOrchestrator();
  orchestrator.start();
}

module.exports = EnhancedOrchestrator;















