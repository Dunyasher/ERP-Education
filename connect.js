/**
 * Frontend-Backend Connection Verification Script
 * Run this script to verify your frontend and backend are properly connected
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔍 Verifying Frontend-Backend Connection...\n');

// Test 1: Backend Server Health
function testBackendHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BACKEND_URL}/`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: data.trim() });
        } else {
          reject({ success: false, message: `Status: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      reject({ success: false, message: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ success: false, message: 'Connection timeout' });
    });
  });
}

// Test 2: API Endpoint
function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BACKEND_URL}/api/get-products?limit=1`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 401 is OK - means API is working but needs auth
          resolve({ success: true, message: `API responding (Status: ${res.statusCode})` });
        } else {
          reject({ success: false, message: `Status: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      reject({ success: false, message: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ success: false, message: 'Connection timeout' });
    });
  });
}

// Run tests
async function runTests() {
  console.log('📡 Testing Backend Connection...');
  try {
    const health = await testBackendHealth();
    console.log('✅ Backend Server:', health.message);
  } catch (error) {
    console.log('❌ Backend Server:', error.message);
    console.log('   → Make sure backend is running: cd backend && npm start');
    return;
  }

  console.log('\n🔌 Testing API Endpoint...');
  try {
    const api = await testAPIEndpoint();
    console.log('✅ API Endpoint:', api.message);
  } catch (error) {
    console.log('❌ API Endpoint:', error.message);
    console.log('   → Check backend routes and CORS configuration');
    return;
  }

  console.log('\n✨ Connection Status:');
  console.log(`   Backend: ${BACKEND_URL}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Ensure CLIENT_URL in backend/.env matches frontend URL');
  console.log('   2. Ensure VITE_API_URL in client/.env matches backend URL');
  console.log('   3. Restart both servers if you changed .env files');
  console.log('   4. Test in browser: Open frontend and check Network tab');
}

runTests().catch(console.error);

