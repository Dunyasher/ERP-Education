/**
 * Full Connection Test: Database <-> Backend <-> Frontend
 * Tests the complete connection chain
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Load backend dependencies
let mongoose;
try {
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  mongoose = require(path.join(backendNodeModules, 'mongoose'));
} catch (e) {
  console.error('❌ Could not load mongoose. Make sure backend dependencies are installed.');
  process.exit(1);
}

// Load environment variables
require(path.join(__dirname, 'backend', 'node_modules', 'dotenv')).config({
  path: path.join(__dirname, 'backend', '.env')
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

console.log('🔍 Testing Full Connection Chain: Database ↔ Backend ↔ Frontend\n');
console.log('='.repeat(70));

const results = {
  database: { status: 'pending', message: '' },
  backend: { status: 'pending', message: '' },
  api: { status: 'pending', message: '' },
  frontend: { status: 'pending', message: '' }
};

// Test 1: Database Connection (Backend to MongoDB)
async function testDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      return { success: false, message: 'MONGO_URI not set in backend/.env' };
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    const dbName = mongoose.connection.db.databaseName;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    await mongoose.connection.close();

    return { 
      success: true, 
      message: `Connected to "${dbName}" database with ${collections.length} collections` 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Test 2: Backend Server
function testBackend() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: `Server running on ${BACKEND_URL}` });
        } else {
          resolve({ success: false, message: `Status: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, message: 'Connection timeout - Backend server not running' });
    });
  });
}

// Test 3: API Endpoint (Backend to Database)
function testAPI() {
  return new Promise((resolve) => {
    const req = http.get(`${API_URL}/get-products?limit=1`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, message: `API responding - ${json.data?.length || 0} products returned` });
          } catch (e) {
            resolve({ success: true, message: `API responding (Status: ${res.statusCode})` });
          }
        } else if (res.statusCode === 401) {
          resolve({ success: true, message: `API responding (Auth required - Status: ${res.statusCode})` });
        } else {
          resolve({ success: false, message: `Status: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, message: 'Connection timeout' });
    });
  });
}

// Test 4: Frontend Configuration
function testFrontendConfig() {
  const clientEnvPath = path.join(__dirname, 'client', '.env');
  const clientEnvLocalPath = path.join(__dirname, 'client', '.env.local');
  
  let envContent = '';
  if (fs.existsSync(clientEnvLocalPath)) {
    envContent = fs.readFileSync(clientEnvLocalPath, 'utf8');
  } else if (fs.existsSync(clientEnvPath)) {
    envContent = fs.readFileSync(clientEnvPath, 'utf8');
  }

  const viteApiUrl = envContent.match(/VITE_API_URL=(.+)/)?.[1]?.trim();
  
  if (!viteApiUrl) {
    return { 
      success: true, 
      message: 'Using default: http://localhost:5000/api (no .env file found)' 
    };
  }

  const expectedUrl = API_URL;
  if (viteApiUrl === expectedUrl || viteApiUrl === API_URL.replace('http://localhost:5000', BACKEND_URL)) {
    return { success: true, message: `Configured correctly: ${viteApiUrl}` };
  } else {
    return { 
      success: false, 
      message: `Mismatch! Frontend expects: ${viteApiUrl}, Backend is: ${API_URL}` 
    };
  }
}

// Run all tests
async function runTests() {
  console.log('\n1️⃣  Testing Database Connection (Backend → MongoDB)...');
  const dbResult = await testDatabase();
  results.database = {
    status: dbResult.success ? '✅' : '❌',
    message: dbResult.message
  };
  console.log(`   ${results.database.status} ${results.database.message}`);

  console.log('\n2️⃣  Testing Backend Server...');
  const backendResult = await testBackend();
  results.backend = {
    status: backendResult.success ? '✅' : '❌',
    message: backendResult.message
  };
  console.log(`   ${results.backend.status} ${results.backend.message}`);

  if (!backendResult.success) {
    console.log('\n   ⚠️  Backend server is not running!');
    console.log('   → Start it with: cd backend && npm start\n');
  } else {
    console.log('\n3️⃣  Testing API Endpoint (Backend → Database)...');
    const apiResult = await testAPI();
    results.api = {
      status: apiResult.success ? '✅' : '❌',
      message: apiResult.message
    };
    console.log(`   ${results.api.status} ${results.api.message}`);
  }

  console.log('\n4️⃣  Testing Frontend Configuration...');
  const frontendResult = testFrontendConfig();
  results.frontend = {
    status: frontendResult.success ? '✅' : '❌',
    message: frontendResult.message
  };
  console.log(`   ${results.frontend.status} ${results.frontend.message}`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Connection Summary:\n');
  console.log(`   ${results.database.status} Database Connection (Backend ↔ MongoDB)`);
  console.log(`   ${results.backend.status} Backend Server`);
  console.log(`   ${results.api.status} API Endpoints (Backend ↔ Database)`);
  console.log(`   ${results.frontend.status} Frontend Configuration`);

  const criticalPassed = results.database.status === '✅' && results.backend.status === '✅';
  
  if (criticalPassed && results.api.status === '✅' && results.frontend.status === '✅') {
    console.log('\n✨ All connections successful! Your application is fully connected.');
    console.log('\n📝 Connection Flow:');
    console.log('   Frontend → Backend → Database ✅');
    console.log('   Database → Backend → Frontend ✅');
  } else if (criticalPassed) {
    console.log('\n⚠️  Core connections working, but some issues detected.');
  } else {
    console.log('\n❌ Critical connections failed. Please fix the issues above.');
  }

  console.log('\n' + '='.repeat(70));
}

runTests().catch(console.error);

