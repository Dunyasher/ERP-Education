/**
 * Connect All: Frontend, Backend, Database
 * Comprehensive connection and verification script
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🔗 Connecting All: Frontend ↔ Backend ↔ Database\n');
console.log('='.repeat(70));

// Load environment variables
let dotenv;
try {
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  dotenv = require(path.join(backendNodeModules, 'dotenv'));
} catch (e) {
  try {
    dotenv = require('dotenv');
  } catch (e2) {
    // Manual parsing
  }
}

const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  if (dotenv) {
    dotenv.config({ path: envPath });
  } else {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = `${BACKEND_URL}/api`;

const results = {
  mongodb: { status: 'pending', message: '' },
  backend: { status: 'pending', message: '' },
  api: { status: 'pending', message: '' },
  cors: { status: 'pending', message: '' },
  frontend: { status: 'pending', message: '' }
};

// Test MongoDB
async function testMongoDB() {
  try {
    const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
    const mongoose = require(path.join(backendNodeModules, 'mongoose'));
    
    if (!process.env.MONGO_URI) {
      return { success: false, message: 'MONGO_URI not set in backend/.env' };
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    const dbName = mongoose.connection.db.databaseName;
    await mongoose.connection.close();

    return { success: true, message: `Connected to database: ${dbName}` };
  } catch (error) {
    if (error.message.includes('Cannot find module')) {
      return { success: false, message: 'mongoose not available - install backend dependencies' };
    }
    return { success: false, message: error.message };
  }
}

// Test Backend
function testBackend() {
  return new Promise((resolve) => {
    const url = new URL(BACKEND_URL);
    const client = url.protocol === 'https:' ? require('https') : http;

    const req = client.get(BACKEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: data.trim() });
        } else {
          resolve({ success: false, message: `Status: ${res.statusCode} - ${data.substring(0, 50)}` });
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

// Test API
function testAPI() {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}/get-products?limit=1`);
    const client = url.protocol === 'https:' ? require('https') : http;

    const req = client.get(`${API_URL}/get-products?limit=1`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          resolve({ success: true, message: `API responding (Status: ${res.statusCode})` });
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

// Test CORS
function testCORS() {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}/get-products?limit=1`);
    const client = url.protocol === 'https:' ? require('https') : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    };

    const req = client.request(options, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      if (corsHeader && (corsHeader === FRONTEND_URL || corsHeader === '*')) {
        resolve({ success: true, message: `CORS configured for ${FRONTEND_URL}` });
      } else {
        resolve({ success: false, message: 'CORS not properly configured' });
      }
    });

    req.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, message: 'Connection timeout' });
    });

    req.end();
  });
}

// Test Frontend
function testFrontend() {
  return new Promise((resolve) => {
    const url = new URL(FRONTEND_URL);
    const client = url.protocol === 'https:' ? require('https') : http;

    const req = client.get(FRONTEND_URL, (res) => {
      resolve({ success: true, message: `Frontend accessible (Status: ${res.statusCode})` });
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

// Run all tests
async function runAllTests() {
  console.log('\n📊 Connection Test Results:\n');

  // Test MongoDB
  console.log('1️⃣  Testing MongoDB Connection...');
  const mongoResult = await testMongoDB();
  results.mongodb = {
    status: mongoResult.success ? '✅' : '❌',
    message: mongoResult.message
  };
  console.log(`   ${results.mongodb.status} MongoDB: ${results.mongodb.message}`);

  // Test Backend
  console.log('\n2️⃣  Testing Backend Server...');
  const backendResult = await testBackend();
  results.backend = {
    status: backendResult.success ? '✅' : '❌',
    message: backendResult.message
  };
  console.log(`   ${results.backend.status} Backend: ${results.backend.message}`);

  if (!backendResult.success) {
    console.log('\n   ⚠️  Backend server is not running!');
    console.log('   → Start backend: cd backend && npm start');
    console.log('\n📋 Summary:');
    console.log('   ⚠️  Cannot test API and CORS without backend running');
    return;
  }

  // Test API
  console.log('\n3️⃣  Testing API Endpoint...');
  const apiResult = await testAPI();
  results.api = {
    status: apiResult.success ? '✅' : '❌',
    message: apiResult.message
  };
  console.log(`   ${results.api.status} API: ${results.api.message}`);

  // Test CORS
  console.log('\n4️⃣  Testing CORS Configuration...');
  const corsResult = await testCORS();
  results.cors = {
    status: corsResult.success ? '✅' : '❌',
    message: corsResult.message
  };
  console.log(`   ${results.cors.status} CORS: ${results.cors.message}`);

  // Test Frontend
  console.log('\n5️⃣  Testing Frontend Server...');
  const frontendResult = await testFrontend();
  results.frontend = {
    status: frontendResult.success ? '✅' : '❌',
    message: frontendResult.message
  };
  console.log(`   ${results.frontend.status} Frontend: ${results.frontend.message}`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Complete Connection Summary:\n');
  console.log(`   ${results.mongodb.status} MongoDB Database`);
  console.log(`   ${results.backend.status} Backend Server`);
  console.log(`   ${results.api.status} API Endpoints`);
  console.log(`   ${results.cors.status} CORS Configuration`);
  console.log(`   ${results.frontend.status} Frontend Server`);

  const allPassed = Object.values(results).every(r => r.status === '✅');
  
  if (allPassed) {
    console.log('\n✨ All connections successful! Your application is fully connected.');
    console.log('\n🌐 Access Points:');
    console.log(`   • Frontend: ${FRONTEND_URL}`);
    console.log(`   • Backend API: ${API_URL}`);
    console.log(`   • Backend Health: ${BACKEND_URL}`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Open browser: ' + FRONTEND_URL);
    console.log('   2. Login or register to test authentication');
    console.log('   3. Access admin dashboard: ' + FRONTEND_URL + '/admin/dashboard');
  } else {
    console.log('\n⚠️  Some connections failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    
    if (results.mongodb.status === '❌') {
      console.log('   • MongoDB: Check MONGO_URI in backend/.env');
      console.log('   • Start MongoDB: mongod (or check MongoDB service)');
    }
    if (results.backend.status === '❌') {
      console.log('   • Backend: Start server with "cd backend && npm start"');
      console.log('   • Check backend/.env configuration');
    }
    if (results.frontend.status === '❌') {
      console.log('   • Frontend: Start server with "cd client && npm run dev"');
      console.log('   • Check client/.env configuration');
    }
    if (results.cors.status === '❌') {
      console.log('   • CORS: Ensure CLIENT_URL in backend/.env matches frontend URL');
    }
  }

  console.log('\n' + '='.repeat(70));
}

// Run tests
runAllTests().catch(console.error);

