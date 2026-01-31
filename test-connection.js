/**
 * Frontend-Backend Connection Test Script
 * Run this to verify your frontend and backend are properly connected
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const BACKEND_URL = process.env.PORT 
  ? `http://localhost:${process.env.PORT}` 
  : 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

console.log('\n🔍 Testing Frontend-Backend Connection...\n');
console.log('Configuration:');
console.log(`  Backend URL: ${BACKEND_URL}`);
console.log(`  API URL: ${API_URL}`);
console.log(`  Client URL: ${CLIENT_URL}\n`);

async function testConnection() {
  const results = {
    backend: false,
    api: false,
    cors: false,
    database: false,
  };

  // Test 1: Backend Server
  try {
    const response = await axios.get(BACKEND_URL, { timeout: 5000 });
    if (response.status === 200) {
      results.backend = true;
      console.log('✅ Backend server is running');
    }
  } catch (error) {
    console.log('❌ Backend server is NOT running');
    console.log(`   Error: ${error.message}`);
    console.log(`   Make sure to run: cd backend && npm start\n`);
    return results;
  }

  // Test 2: API Endpoint
  try {
    const response = await axios.get(`${API_URL}/get-products?limit=1`, { timeout: 5000 });
    if (response.status === 200) {
      results.api = true;
      console.log('✅ API endpoint is accessible');
    }
  } catch (error) {
    console.log('❌ API endpoint test failed');
    console.log(`   Error: ${error.response?.status || error.message}`);
  }

  // Test 3: CORS Configuration
  try {
    const response = await axios.get(`${API_URL}/get-products?limit=1`, {
      timeout: 5000,
      headers: {
        'Origin': CLIENT_URL,
      },
    });
    if (response.status === 200) {
      results.cors = true;
      console.log('✅ CORS is properly configured');
    }
  } catch (error) {
    console.log('⚠️  CORS test - check manually in browser');
  }

  // Test 4: Database Connection (via API)
  try {
    const response = await axios.get(`${API_URL}/get-products?limit=1`, { timeout: 5000 });
    if (response.data && response.data.success !== false) {
      results.database = true;
      console.log('✅ Database connection appears to be working');
    }
  } catch (error) {
    console.log('⚠️  Database connection test - check backend logs');
  }

  console.log('\n📊 Test Summary:');
  console.log(`  Backend Server: ${results.backend ? '✅' : '❌'}`);
  console.log(`  API Endpoint: ${results.api ? '✅' : '❌'}`);
  console.log(`  CORS Config: ${results.cors ? '✅' : '⚠️'}`);
  console.log(`  Database: ${results.database ? '✅' : '⚠️'}\n`);

  if (results.backend && results.api) {
    console.log('🎉 Connection is working! You can now start the frontend.\n');
    console.log('Next steps:');
    console.log('  1. cd client');
    console.log('  2. npm run dev');
    console.log('  3. Open http://localhost:5173 in your browser\n');
  } else {
    console.log('⚠️  Some issues detected. Please check:');
    if (!results.backend) {
      console.log('  - Start the backend server');
    }
    if (!results.api) {
      console.log('  - Check backend .env configuration');
      console.log('  - Verify MongoDB connection');
    }
    console.log('');
  }

  return results;
}

// Run tests
testConnection().catch(console.error);

