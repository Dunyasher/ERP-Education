/**
 * Comprehensive Connection Verification Script
 * Tests: MongoDB, Redis, Backend API, and Frontend-Backend Connection
 */

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

// Try to load mongoose and redis from backend node_modules
let mongoose, redis;
try {
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  mongoose = require(path.join(backendNodeModules, 'mongoose'));
  redis = require(path.join(backendNodeModules, 'redis'));
} catch (e) {
  console.log('⚠️  Note: mongoose and redis not found. Some tests will be skipped.');
}

// Load environment variables
let dotenv;
try {
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  dotenv = require(path.join(backendNodeModules, 'dotenv'));
} catch (e) {
  // Try to load from root or use manual parsing
  try {
    dotenv = require('dotenv');
  } catch (e2) {
    console.log('⚠️  Note: dotenv not found. Loading env manually.');
  }
}

const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  if (dotenv) {
    dotenv.config({ path: envPath });
  } else {
    // Manual env loading
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
} else {
  console.log('⚠️  Warning: backend/.env file not found');
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔍 Verifying All Connections...\n');
console.log('='.repeat(60));

const results = {
  mongodb: { status: 'pending', message: '' },
  redis: { status: 'pending', message: '' },
  backend: { status: 'pending', message: '' },
  api: { status: 'pending', message: '' },
  cors: { status: 'pending', message: '' }
};

// Test 1: MongoDB Connection
async function testMongoDB() {
  try {
    if (!mongoose) {
      return { success: false, message: 'mongoose not available - install backend dependencies' };
    }

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
    return { success: false, message: error.message };
  }
}

// Test 2: Redis Connection
async function testRedis() {
  return new Promise((resolve) => {
    try {
      if (!redis) {
        resolve({ success: false, message: 'redis not available - install backend dependencies (optional)' });
        return;
      }

      const redisConfig = {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          reconnectStrategy: () => false
        }
      };

      if (process.env.REDIS_USERNAME) {
        redisConfig.username = process.env.REDIS_USERNAME;
      }
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }
      if (process.env.REDIS_SSL === 'true') {
        redisConfig.socket.tls = {};
      }

      const client = redis.createClient(redisConfig);

      client.on('error', (err) => {
        client.quit();
        resolve({ success: false, message: err.message });
      });

      (async () => {
        try {
          await client.connect();
          await client.ping();
          await client.quit();
          resolve({ success: true, message: 'Redis connection successful' });
        } catch (error) {
          resolve({ success: false, message: error.message });
        }
      })();
    } catch (error) {
      resolve({ success: false, message: error.message });
    }
  });
}

// Test 3: Backend Server Health
function testBackendHealth() {
  return new Promise((resolve) => {
    const url = new URL(BACKEND_URL);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(BACKEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: data.trim() });
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

// Test 4: API Endpoint
function testAPIEndpoint() {
  return new Promise((resolve) => {
    const url = new URL(`${BACKEND_URL}/api/get-products?limit=1`);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(`${BACKEND_URL}/api/get-products?limit=1`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // 200 = success, 401 = needs auth (but API is working)
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

// Test 5: CORS Configuration
function testCORS() {
  return new Promise((resolve) => {
    const url = new URL(`${BACKEND_URL}/api/get-products?limit=1`);
    const client = url.protocol === 'https:' ? https : http;

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

// Run all tests
async function runAllTests() {
  console.log('\n📊 Test Results:\n');

  // Test MongoDB
  console.log('1️⃣  Testing MongoDB Connection...');
  const mongoResult = await testMongoDB();
  results.mongodb = {
    status: mongoResult.success ? '✅' : '❌',
    message: mongoResult.message
  };
  console.log(`   ${results.mongodb.status} MongoDB: ${results.mongodb.message}`);

  // Test Redis
  console.log('\n2️⃣  Testing Redis Connection...');
  const redisResult = await testRedis();
  results.redis = {
    status: redisResult.success ? '✅' : '❌',
    message: redisResult.message
  };
  console.log(`   ${results.redis.status} Redis: ${results.redis.message}`);

  // Test Backend
  console.log('\n3️⃣  Testing Backend Server...');
  const backendResult = await testBackendHealth();
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
  console.log('\n4️⃣  Testing API Endpoint...');
  const apiResult = await testAPIEndpoint();
  results.api = {
    status: apiResult.success ? '✅' : '❌',
    message: apiResult.message
  };
  console.log(`   ${results.api.status} API: ${results.api.message}`);

  // Test CORS
  console.log('\n5️⃣  Testing CORS Configuration...');
  const corsResult = await testCORS();
  results.cors = {
    status: corsResult.success ? '✅' : '❌',
    message: corsResult.message
  };
  console.log(`   ${results.cors.status} CORS: ${results.cors.message}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Connection Summary:\n');
  console.log(`   ${results.mongodb.status} MongoDB Database`);
  console.log(`   ${results.redis.status} Redis Cache`);
  console.log(`   ${results.backend.status} Backend Server`);
  console.log(`   ${results.api.status} API Endpoints`);
  console.log(`   ${results.cors.status} CORS Configuration`);

  const allPassed = Object.values(results).every(r => r.status === '✅');
  
  if (allPassed) {
    console.log('\n✨ All connections successful! Your application is ready to use.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Start frontend: cd client && npm run dev');
    console.log('   3. Open browser: http://localhost:5173');
  } else {
    console.log('\n⚠️  Some connections failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    
    if (results.mongodb.status === '❌') {
      console.log('   • MongoDB: Check MONGO_URI in backend/.env');
    }
    if (results.redis.status === '❌') {
      console.log('   • Redis: Check REDIS_* variables in backend/.env (optional)');
    }
    if (results.backend.status === '❌') {
      console.log('   • Backend: Start server with "cd backend && npm start"');
    }
    if (results.cors.status === '❌') {
      console.log('   • CORS: Ensure CLIENT_URL in backend/.env matches frontend URL');
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);

