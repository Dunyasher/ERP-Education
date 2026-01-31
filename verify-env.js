/**
 * Environment Variables Verification Script
 * Checks if required environment variables are set
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Environment Configuration...\n');

// Check Backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');

let backendIssues = [];
let frontendIssues = [];

if (fs.existsSync(backendEnvPath)) {
  console.log('✅ Backend .env file exists');
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Check required variables
  if (!backendEnv.includes('MONGO_URI=')) {
    backendIssues.push('MONGO_URI not found');
  }
  if (!backendEnv.includes('JWT_SECRET=')) {
    backendIssues.push('JWT_SECRET not found');
  }
  if (!backendEnv.includes('CLIENT_URL=')) {
    backendIssues.push('CLIENT_URL not found');
  }
  
  // Extract values for display
  const mongoMatch = backendEnv.match(/MONGO_URI=(.+)/);
  const clientUrlMatch = backendEnv.match(/CLIENT_URL=(.+)/);
  
  console.log('  Backend Configuration:');
  if (mongoMatch) {
    const mongoUri = mongoMatch[1].trim();
    console.log(`    MONGO_URI: ${mongoUri.substring(0, 30)}...`);
  }
  if (clientUrlMatch) {
    console.log(`    CLIENT_URL: ${clientUrlMatch[1].trim()}`);
  }
} else {
  console.log('❌ Backend .env file NOT found');
  backendIssues.push('Create backend/.env file');
}

if (fs.existsSync(clientEnvPath)) {
  console.log('\n✅ Frontend .env file exists');
  const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
  
  // Check required variables
  if (!clientEnv.includes('VITE_API_URL=')) {
    frontendIssues.push('VITE_API_URL not found');
  }
  
  // Extract values for display
  const apiUrlMatch = clientEnv.match(/VITE_API_URL=(.+)/);
  const socketUrlMatch = clientEnv.match(/VITE_SOCKET_URL=(.+)/);
  
  console.log('  Frontend Configuration:');
  if (apiUrlMatch) {
    console.log(`    VITE_API_URL: ${apiUrlMatch[1].trim()}`);
  }
  if (socketUrlMatch) {
    console.log(`    VITE_SOCKET_URL: ${socketUrlMatch[1].trim()}`);
  }
} else {
  console.log('\n❌ Frontend .env file NOT found');
  frontendIssues.push('Create client/.env file');
}

// Summary
console.log('\n📊 Summary:');
if (backendIssues.length === 0 && frontendIssues.length === 0) {
  console.log('✅ All required environment variables are configured!\n');
  console.log('Next steps:');
  console.log('  1. Start backend: cd backend && npm start');
  console.log('  2. Start frontend: cd client && npm run dev');
  console.log('  3. Test connection: node test-connection.js\n');
} else {
  console.log('⚠️  Issues found:\n');
  if (backendIssues.length > 0) {
    console.log('  Backend:');
    backendIssues.forEach(issue => console.log(`    - ${issue}`));
  }
  if (frontendIssues.length > 0) {
    console.log('  Frontend:');
    frontendIssues.forEach(issue => console.log(`    - ${issue}`));
  }
  console.log('\n💡 Tip: Check .env.example files for reference\n');
}

