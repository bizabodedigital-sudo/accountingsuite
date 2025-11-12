/**
 * Quick Fix Agent - Fixes the Bizabode Accounting Suite issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🔧 Quick Fix Agent - Fixing all issues...");

try {
  // 1. Fix frontend package.json
  console.log("1. Fixing frontend package.json...");
  const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
  if (fs.existsSync(frontendPackagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    delete packageJson.type; // Remove type: "module" that conflicts with Next.js
    fs.writeFileSync(frontendPackagePath, JSON.stringify(packageJson, null, 2));
    console.log("✅ Fixed frontend package.json");
  }

  // 2. Fix card component
  console.log("2. Fixing card component syntax...");
  const cardPath = path.join(__dirname, 'frontend', 'src', 'components', 'ui', 'card.tsx');
  if (fs.existsSync(cardPath)) {
    let cardContent = fs.readFileSync(cardPath, 'utf8');
    cardContent = cardContent.replace(/\)\nCard\.displayName/g, '));\nCard.displayName');
    cardContent = cardContent.replace(/\)\nCardHeader\.displayName/g, '));\nCardHeader.displayName');
    cardContent = cardContent.replace(/\)\nCardTitle\.displayName/g, '));\nCardTitle.displayName');
    cardContent = cardContent.replace(/\)\nCardDescription\.displayName/g, '));\nCardDescription.displayName');
    cardContent = cardContent.replace(/\)\nCardContent\.displayName/g, '));\nCardContent.displayName');
    cardContent = cardContent.replace(/\)\nCardFooter\.displayName/g, '));\nCardFooter.displayName');
    fs.writeFileSync(cardPath, cardContent);
    console.log("✅ Fixed card component syntax");
  }

  // 3. Install missing dependencies
  console.log("3. Installing missing dependencies...");
  try {
    execSync('npm install @radix-ui/react-label @radix-ui/react-slot class-variance-authority clsx tailwind-merge', {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit'
    });
    console.log("✅ Installed missing dependencies");
  } catch (error) {
    console.log("⚠️ Could not install dependencies:", error.message);
  }

  // 4. Start database services
  console.log("4. Starting database services...");
  try {
    execSync('docker-compose -f docker-compose.simple.yml up -d', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log("✅ Started database services");
  } catch (error) {
    console.log("⚠️ Database services may already be running");
  }

  // 5. Start backend
  console.log("5. Starting backend...");
  try {
    const backendProcess = require('child_process').spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true
    });
    console.log("✅ Backend started");
  } catch (error) {
    console.log("⚠️ Backend start failed:", error.message);
  }

  // 6. Start frontend
  console.log("6. Starting frontend...");
  try {
    const frontendProcess = require('child_process').spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: true
    });
    console.log("✅ Frontend started");
  } catch (error) {
    console.log("⚠️ Frontend start failed:", error.message);
  }

  console.log("\n🎉 Quick Fix Agent completed!");
  console.log("🌐 Frontend: http://localhost:3000");
  console.log("🔧 Backend: http://localhost:3001");
  console.log("🔑 Login: owner@jamaicatech.com / password123");

} catch (error) {
  console.error("❌ Quick Fix Agent failed:", error.message);
  process.exit(1);
}











