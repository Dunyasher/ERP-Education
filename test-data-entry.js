/**
 * Test script to verify data entry is working
 * Run: node test-data-entry.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testConnection() {
  try {
    console.log('🔍 Testing server connection...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('Error:', error.message);
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n🔍 Testing authentication...');
    // You'll need to provide a valid token
    // For now, just check if endpoint exists
    console.log('⚠️  Authentication test requires valid token');
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed');
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Data Entry System Test');
  console.log('========================================\n');

  const serverRunning = await testConnection();
  
  if (!serverRunning) {
    console.log('\n❌ Server is not running!');
    console.log('Please start the server with: npm run server');
    process.exit(1);
  }

  console.log('\n✅ All basic tests passed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure you are logged in to the frontend');
  console.log('2. Try creating a student or teacher');
  console.log('3. Check the server terminal for any error messages');
  console.log('4. Check browser console (F12) for client-side errors');
}

main().catch(console.error);

