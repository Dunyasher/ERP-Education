/**
 * Problem Diagnostic Script
 * Checks for common issues in the application
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🔍 Diagnosing Potential Problems...\n');
console.log('='.repeat(70));

const issues = [];
const warnings = [];

// Check 1: Environment Files
console.log('\n1️⃣  Checking Environment Configuration...');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');
const clientEnvLocalPath = path.join(__dirname, 'client', '.env.local');

if (!fs.existsSync(backendEnvPath)) {
  issues.push('❌ Backend .env file is missing!');
  console.log('   ❌ Backend .env: NOT FOUND');
} else {
  console.log('   ✅ Backend .env: Found');
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  
  if (!backendEnv.includes('MONGO_URI=')) {
    issues.push('❌ MONGO_URI not set in backend/.env');
    console.log('   ⚠️  MONGO_URI: Not found');
  } else {
    console.log('   ✅ MONGO_URI: Set');
  }
  
  if (!backendEnv.includes('JWT_SECRET=') || backendEnv.includes('JWT_SECRET=change-this')) {
    warnings.push('⚠️  JWT_SECRET should be changed from default');
    console.log('   ⚠️  JWT_SECRET: Using default (should change)');
  } else {
    console.log('   ✅ JWT_SECRET: Set');
  }
}

if (!fs.existsSync(clientEnvPath) && !fs.existsSync(clientEnvLocalPath)) {
  warnings.push('⚠️  Frontend .env file not found (using defaults)');
  console.log('   ⚠️  Frontend .env: Not found (using defaults)');
} else {
  console.log('   ✅ Frontend .env: Found');
}

// Check 2: Backend Server
console.log('\n2️⃣  Checking Backend Server...');
function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000', (res) => {
      console.log('   ✅ Backend server: Running on port 5000');
      resolve(true);
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        issues.push('❌ Backend server is not running on port 5000');
        console.log('   ❌ Backend server: NOT RUNNING');
        console.log('   💡 Solution: Run "cd backend && npm start"');
      } else {
        issues.push(`❌ Backend server error: ${err.message}`);
        console.log(`   ❌ Backend server: ${err.message}`);
      }
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      issues.push('❌ Backend server timeout - may not be running');
      console.log('   ❌ Backend server: Timeout (not responding)');
      resolve(false);
    });
  });
}

// Check 3: Database Connection
console.log('\n3️⃣  Checking Database Connection...');
async function checkDatabase() {
  try {
    const mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
    const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));
    
    dotenv.config({ path: backendEnvPath });
    
    if (!process.env.MONGO_URI) {
      issues.push('❌ MONGO_URI not set');
      console.log('   ❌ MongoDB: MONGO_URI not configured');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`   ✅ MongoDB: Connected to "${dbName}"`);
    await mongoose.connection.close();
  } catch (error) {
    issues.push(`❌ MongoDB connection failed: ${error.message}`);
    console.log(`   ❌ MongoDB: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Solution: Check if MongoDB is running');
    } else if (error.message.includes('authentication')) {
      console.log('   💡 Solution: Check MongoDB credentials');
    }
  }
}

// Check 4: API Endpoints
console.log('\n4️⃣  Checking API Endpoints...');
function checkAPI() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/get-products?limit=1', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ API: Working correctly');
        resolve(true);
      } else {
        warnings.push(`⚠️  API returned status ${res.statusCode}`);
        console.log(`   ⚠️  API: Status ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('   ❌ API: Backend not running');
      } else {
        issues.push(`❌ API error: ${err.message}`);
        console.log(`   ❌ API: ${err.message}`);
      }
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('   ❌ API: Timeout');
      resolve(false);
    });
  });
}

// Check 5: Frontend Configuration
console.log('\n5️⃣  Checking Frontend Configuration...');
let frontendEnv = '';
if (fs.existsSync(clientEnvLocalPath)) {
  frontendEnv = fs.readFileSync(clientEnvLocalPath, 'utf8');
} else if (fs.existsSync(clientEnvPath)) {
  frontendEnv = fs.readFileSync(clientEnvPath, 'utf8');
}

if (frontendEnv) {
  const viteApiUrl = frontendEnv.match(/VITE_API_URL=(.+)/)?.[1]?.trim();
  if (viteApiUrl) {
    if (viteApiUrl === 'http://localhost:5000/api') {
      console.log('   ✅ VITE_API_URL: Correctly configured');
    } else {
      warnings.push(`⚠️  VITE_API_URL is set to ${viteApiUrl}, expected http://localhost:5000/api`);
      console.log(`   ⚠️  VITE_API_URL: ${viteApiUrl}`);
    }
  } else {
    console.log('   ⚠️  VITE_API_URL: Not set (using default)');
  }
} else {
  console.log('   ⚠️  Frontend .env: Not found (using defaults)');
}

// Check 6: Port Availability
console.log('\n6️⃣  Checking Port Availability...');
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => {
        console.log(`   ✅ Port ${port}: Available`);
        resolve(true);
      });
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        warnings.push(`⚠️  Port ${port} is in use (may be your server)`);
        console.log(`   ⚠️  Port ${port}: In use (may be your server)`);
      } else {
        issues.push(`❌ Port ${port} error: ${err.message}`);
        console.log(`   ❌ Port ${port}: ${err.message}`);
      }
      resolve(false);
    });
  });
}

// Run all checks
async function runDiagnostics() {
  await checkDatabase();
  const backendRunning = await checkBackend();
  
  if (backendRunning) {
    await checkAPI();
  }
  
  await checkPort(5000);
  await checkPort(5173);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Diagnostic Summary:\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✨ No problems detected! Everything looks good.');
  } else {
    if (issues.length > 0) {
      console.log('❌ CRITICAL ISSUES:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (issues.length > 0) {
    console.log('\n💡 Quick Fixes:');
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Check backend/.env has MONGO_URI set');
    console.log('   3. Verify MongoDB is running/accessible');
    console.log('   4. Check firewall/network settings');
  }
}

runDiagnostics().catch(console.error);



