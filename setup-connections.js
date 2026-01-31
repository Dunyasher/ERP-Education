/**
 * Complete Connection Setup Script
 * Sets up and verifies all connections: Frontend, Backend, Database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Complete Connection Setup\n');
console.log('='.repeat(60));

// Check if .env files exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');
const backendEnvExample = path.join(__dirname, 'backend', '.env.example');
const clientEnvExample = path.join(__dirname, 'client', '.env.example');

// Create .env files if they don't exist
if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExample)) {
  console.log('📝 Creating backend/.env from .env.example...');
  fs.copyFileSync(backendEnvExample, backendEnvPath);
  console.log('✅ Backend .env file created');
  console.log('⚠️  Please edit backend/.env and configure your settings\n');
} else if (!fs.existsSync(backendEnvPath)) {
  console.log('⚠️  Backend .env file not found. Creating template...');
  const backendEnvTemplate = `PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/furniture
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=change-this-to-a-random-secret-key
REFRESH_TOKEN_EXPIRE=30d
SESSION_SECRET=change-this-to-a-random-secret-key
`;
  fs.writeFileSync(backendEnvPath, backendEnvTemplate);
  console.log('✅ Backend .env template created');
  console.log('⚠️  Please edit backend/.env and configure your settings\n');
}

if (!fs.existsSync(clientEnvPath) && fs.existsSync(clientEnvExample)) {
  console.log('📝 Creating client/.env from .env.example...');
  fs.copyFileSync(clientEnvExample, clientEnvPath);
  console.log('✅ Client .env file created\n');
} else if (!fs.existsSync(clientEnvPath)) {
  console.log('⚠️  Client .env file not found. Creating template...');
  const clientEnvTemplate = `VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
`;
  fs.writeFileSync(clientEnvPath, clientEnvTemplate);
  console.log('✅ Client .env template created\n');
}

// Check dependencies
console.log('📦 Checking Dependencies...\n');

const checkDependencies = (dir, name) => {
  const packageJsonPath = path.join(__dirname, dir, 'package.json');
  const nodeModulesPath = path.join(__dirname, dir, 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  ${name}: package.json not found`);
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`⚠️  ${name}: node_modules not found`);
    console.log(`   Run: cd ${dir} && npm install`);
    return false;
  }
  
  console.log(`✅ ${name}: Dependencies installed`);
  return true;
};

const backendReady = checkDependencies('backend', 'Backend');
const clientReady = checkDependencies('client', 'Frontend');

console.log('\n' + '='.repeat(60));
console.log('\n📋 Setup Summary:\n');

if (backendReady && clientReady) {
  console.log('✅ All dependencies are installed');
} else {
  console.log('⚠️  Some dependencies are missing');
  console.log('\nTo install:');
  if (!backendReady) {
    console.log('   cd backend && npm install');
  }
  if (!clientReady) {
    console.log('   cd client && npm install');
  }
}

console.log('\n📝 Next Steps:');
console.log('1. Configure backend/.env with your MongoDB URI and secrets');
console.log('2. Configure client/.env with your API URL');
console.log('3. Start MongoDB (if using local): mongod');
console.log('4. Start Backend: cd backend && npm start');
console.log('5. Start Frontend: cd client && npm run dev');
console.log('6. Verify connections: node verify-all-connections.js');

console.log('\n' + '='.repeat(60));
console.log('\n✨ Setup complete! Follow the steps above to connect everything.\n');
