/**
 * Simple Connection Test
 */

const http = require('http');

console.log('🔍 Testing Connections...\n');

// Test Backend
const testBackend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Backend Status: ${res.statusCode}`);
        console.log(`Backend Response: ${data}`);
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', (err) => {
      console.log(`Backend Error: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('Backend: Connection timeout');
      resolve(false);
    });
  });
};

// Test API
const testAPI = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/get-products?limit=1', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`API Status: ${res.statusCode}`);
        resolve(res.statusCode === 200 || res.statusCode === 401);
      });
    });

    req.on('error', (err) => {
      console.log(`API Error: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('API: Connection timeout');
      resolve(false);
    });
  });
};

(async () => {
  console.log('Testing Backend...');
  const backendOk = await testBackend();
  
  console.log('\nTesting API...');
  const apiOk = await testAPI();
  
  console.log('\n' + '='.repeat(40));
  console.log(`Backend: ${backendOk ? '✅ Connected' : '❌ Not Connected'}`);
  console.log(`API: ${apiOk ? '✅ Working' : '❌ Not Working'}`);
  console.log('='.repeat(40));
})();

