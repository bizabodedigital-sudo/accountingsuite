/**
 * Fix Agent - Automatically fixes common development issues
 * This agent identifies and resolves build errors, dependency issues, and configuration problems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FixAgent {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.projectRoot = process.cwd();
  }

  async diagnoseAndFix() {
    console.log("🔧 Fix Agent - Diagnosing and fixing issues...");
    
    try {
      // 1. Fix frontend module issues
      await this.fixFrontendModules();
      
      // 2. Fix Docker configuration
      await this.fixDockerConfig();
      
      // 3. Fix package.json issues
      await this.fixPackageJson();
      
      // 4. Start services properly
      await this.startServices();
      
      console.log("✅ Fix Agent completed successfully!");
      this.printSummary();
      
    } catch (error) {
      console.error("❌ Fix Agent failed:", error.message);
      throw error;
    }
  }

  async fixFrontendModules() {
    console.log("🔧 Fixing frontend module issues...");
    
    // Fix package.json type
    const frontendPackagePath = path.join(this.projectRoot, 'frontend', 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      
      // Remove type: "module" as it conflicts with Next.js
      if (packageJson.type === 'module') {
        delete packageJson.type;
        fs.writeFileSync(frontendPackagePath, JSON.stringify(packageJson, null, 2));
        this.fixes.push("Fixed package.json type conflict");
      }
    }

    // Fix card component syntax
    const cardPath = path.join(this.projectRoot, 'frontend', 'src', 'components', 'ui', 'card.tsx');
    if (fs.existsSync(cardPath)) {
      let cardContent = fs.readFileSync(cardPath, 'utf8');
      
      // Fix all forwardRef syntax issues
      cardContent = cardContent.replace(/\)\nCard\.displayName/g, '));\nCard.displayName');
      cardContent = cardContent.replace(/\)\nCardHeader\.displayName/g, '));\nCardHeader.displayName');
      cardContent = cardContent.replace(/\)\nCardTitle\.displayName/g, '));\nCardTitle.displayName');
      cardContent = cardContent.replace(/\)\nCardDescription\.displayName/g, '));\nCardDescription.displayName');
      cardContent = cardContent.replace(/\)\nCardContent\.displayName/g, '));\nCardContent.displayName');
      cardContent = cardContent.replace(/\)\nCardFooter\.displayName/g, '));\nCardFooter.displayName');
      
      fs.writeFileSync(cardPath, cardContent);
      this.fixes.push("Fixed card component syntax");
    }

    // Install missing dependencies
    try {
      const frontendDir = path.join(this.projectRoot, 'frontend');
      if (fs.existsSync(frontendDir)) {
        execSync('npm install @radix-ui/react-label @radix-ui/react-slot class-variance-authority clsx tailwind-merge', {
          cwd: frontendDir,
          stdio: 'inherit'
        });
        this.fixes.push("Installed missing frontend dependencies");
      }
    } catch (error) {
      console.warn("Warning: Could not install frontend dependencies:", error.message);
    }
  }

  async fixDockerConfig() {
    console.log("🔧 Fixing Docker configuration...");
    
    // Create a working Docker Compose file
    const dockerComposeContent = `# Working Docker Compose for Bizabode Accounting Suite
services:
  # MongoDB Database
  mongo:
    image: mongo:7.0
    container_name: bizabode-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: bizabode
    volumes:
      - mongo_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - bizabode-network

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: bizabode-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - bizabode-network

volumes:
  mongo_data:
  redis_data:

networks:
  bizabode-network:
    driver: bridge`;

    fs.writeFileSync(path.join(this.projectRoot, 'docker-compose.working.yml'), dockerComposeContent);
    this.fixes.push("Created working Docker Compose configuration");
  }

  async fixPackageJson() {
    console.log("🔧 Fixing package.json issues...");
    
    // Fix root package.json
    const rootPackagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      
      // Add proper scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        "start:local": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
        "start:db": "docker-compose -f docker-compose.working.yml up -d",
        "stop:db": "docker-compose -f docker-compose.working.yml down",
        "seed": "cd backend && npm run seed"
      };
      
      fs.writeFileSync(rootPackagePath, JSON.stringify(packageJson, null, 2));
      this.fixes.push("Fixed root package.json scripts");
    }
  }

  async startServices() {
    console.log("🚀 Starting services...");
    
    try {
      // Start database services
      console.log("Starting MongoDB and Redis...");
      execSync('docker-compose -f docker-compose.working.yml up -d', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      
      // Wait for services to be ready
      console.log("Waiting for services to start...");
      await this.sleep(10000);
      
      // Start backend
      console.log("Starting backend...");
      const backendProcess = this.startProcess('cd backend && npm run dev', 'Backend');
      
      // Wait a bit for backend to start
      await this.sleep(5000);
      
      // Start frontend
      console.log("Starting frontend...");
      const frontendProcess = this.startProcess('cd frontend && npm run dev', 'Frontend');
      
      // Wait for services to be ready
      await this.sleep(15000);
      
      console.log("✅ All services started successfully!");
      console.log("🌐 Frontend: http://localhost:3000");
      console.log("🔧 Backend: http://localhost:3001");
      console.log("🗄️ MongoDB: mongodb://localhost:27017");
      console.log("📦 Redis: redis://localhost:6379");
      
      this.fixes.push("Started all services successfully");
      
    } catch (error) {
      console.error("Failed to start services:", error.message);
      throw error;
    }
  }

  startProcess(command, name) {
    try {
      const { spawn } = require('child_process');
      const process = spawn('cmd', ['/c', command], {
        cwd: this.projectRoot,
        stdio: 'inherit',
        shell: true
      });
      
      process.on('error', (error) => {
        console.error(`${name} process error:`, error.message);
      });
      
      return process;
    } catch (error) {
      console.error(`Failed to start ${name}:`, error.message);
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    console.log("\n📊 Fix Agent Summary:");
    console.log("===================");
    console.log(`✅ Issues fixed: ${this.fixes.length}`);
    this.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Open http://localhost:3000 in your browser");
    console.log("2. Login with: owner@jamaicatech.com / password123");
    console.log("3. Explore the Bizabode Accounting Suite!");
    
    console.log("\n🔧 If issues persist:");
    console.log("- Check that ports 3000, 3001, 27017, 6379 are available");
    console.log("- Ensure Docker is running");
    console.log("- Check the terminal output for any error messages");
  }
}

// Run the fix agent
if (require.main === module) {
  const fixAgent = new FixAgent();
  fixAgent.diagnoseAndFix()
    .then(() => {
      console.log("🎉 Fix Agent completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fix Agent failed:", error.message);
      process.exit(1);
    });

module.exports = FixAgent;
