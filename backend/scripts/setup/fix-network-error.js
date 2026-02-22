/**
 * Network Error Fix Script
 * Diagnoses and fixes network connection issues
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing Network Error...\n');
console.log('='.repeat(70));

const issues = [];
const fixes = [];

// Check 1: Backend Server Status
console.log('\n1️⃣  Checking Backend Server...');
function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000', (res) => {
      console.log('   ✅ Backend server is RUNNING on port 5000');
      resolve(true);
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        issues.push('Backend server is NOT running');
        fixes.push('Start backend: cd backend && npm start');
        console.log('   ❌ Backend server is NOT RUNNING');
        console.log('   💡 Fix: Start backend server');
      } else {
        issues.push(`Backend error: ${err.message}`);
        console.log(`   ❌ Backend error: ${err.message}`);
      }
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      issues.push('Backend server timeout');
      fixes.push('Start backend: cd backend && npm start');
      console.log('   ❌ Backend server not responding');
      resolve(false);
    });
  });
}

// Check 2: Frontend API Configuration
console.log('\n2️⃣  Checking Frontend API Configuration...');
const clientEnvPath = path.join(__dirname, 'client', '.env');
const clientEnvLocalPath = path.join(__dirname, 'client', '.env.local');

let frontendEnv = '';
if (fs.existsSync(clientEnvLocalPath)) {
  frontendEnv = fs.readFileSync(clientEnvLocalPath, 'utf8');
  console.log('   📁 Using: client/.env.local');
} else if (fs.existsSync(clientEnvPath)) {
  frontendEnv = fs.readFileSync(clientEnvPath, 'utf8');
  console.log('   📁 Using: client/.env');
} else {
  console.log('   ⚠️  No .env file found (using defaults)');
}

const viteApiUrl = frontendEnv.match(/VITE_API_URL=(.+)/)?.[1]?.trim();
if (viteApiUrl) {
  if (viteApiUrl === 'http://localhost:5000/api') {
    console.log('   ✅ VITE_API_URL: Correctly configured');
  } else {
    issues.push(`VITE_API_URL mismatch: ${viteApiUrl}`);
    fixes.push(`Update VITE_API_URL to: http://localhost:5000/api`);
    console.log(`   ⚠️  VITE_API_URL: ${viteApiUrl} (should be http://localhost:5000/api)`);
  }
} else {
  console.log('   ⚠️  VITE_API_URL: Not set (using default: http://localhost:5000/api)');
}

// Check 3: Backend CORS Configuration
console.log('\n3️⃣  Checking Backend CORS Configuration...');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  const clientUrl = backendEnv.match(/CLIENT_URL=(.+)/)?.[1]?.trim();
  
  if (clientUrl) {
    if (clientUrl === 'http://localhost:5173') {
      console.log('   ✅ CLIENT_URL: Correctly configured');
    } else {
      console.log(`   ⚠️  CLIENT_URL: ${clientUrl} (should be http://localhost:5173)`);
      fixes.push(`Update CLIENT_URL in backend/.env to: http://localhost:5173`);
    }
  } else {
    console.log('   ⚠️  CLIENT_URL: Not set');
    fixes.push('Add CLIENT_URL=http://localhost:5173 to backend/.env');
  }
} else {
  console.log('   ❌ Backend .env file not found');
  issues.push('Backend .env file missing');
}

// Run checks
async function runDiagnostics() {
  const backendRunning = await checkBackend();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Diagnostic Summary:\n');

  if (issues.length === 0) {
    console.log('✨ No issues found! Everything should be working.');
  } else {
    console.log('❌ Issues Found:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }

  if (fixes.length > 0) {
    console.log('\n🔧 Fixes Needed:');
    fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ${fix}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n🚀 Quick Fix Commands:\n');

  if (!backendRunning) {
    console.log('1. Start Backend Server:');
    console.log('   cd backend');
    console.log('   npm start');
    console.log('');
  }

  if (viteApiUrl && viteApiUrl !== 'http://localhost:5000/api') {
    console.log('2. Fix Frontend API URL:');
    console.log('   Create or edit client/.env.local:');
    console.log('   VITE_API_URL=http://localhost:5000/api');
    console.log('');
  }

  console.log('3. After fixing, restart:');
  console.log('   - Backend server (if you started it)');
  console.log('   - Frontend dev server (if you changed .env)');
  console.log('');

  console.log('='.repeat(70));
}

runDiagnostics().catch(console.error);

