const http = require('http');

console.log('\n' + '='.repeat(60));
console.log('   COLLEGE MANAGEMENT - CONNECTION TEST');
console.log('='.repeat(60) + '\n');

// Test Backend
console.log('1. Testing Backend (http://localhost:5000/api/health)...');
const backendReq = http.get('http://localhost:5000/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('   ✅ Backend is RUNNING');
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}\n`);
      
      // Test Login
      console.log('2. Testing Login API...');
      const loginData = JSON.stringify({
        email: 'admin@college.com',
        password: 'admin123'
      });
      
      const loginReq = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length
        }
      }, (loginRes) => {
        let loginData = '';
        loginRes.on('data', (chunk) => { loginData += chunk; });
        loginRes.on('end', () => {
          try {
            const result = JSON.parse(loginData);
            console.log('   ✅ Login API is WORKING');
            console.log(`   User: ${result.user.email}`);
            console.log(`   Role: ${result.user.role}`);
            console.log(`   Token: ${result.token.substring(0, 30)}...`);
            console.log('\n   🎉 Login credentials are correct!');
            console.log('   You can now login at: http://localhost:3000/login\n');
          } catch (e) {
            console.log('   ❌ Login API Error:', loginData);
            if (loginData.includes('Invalid credentials')) {
              console.log('   ⚠️  Credentials are wrong. Use: admin@college.com / admin123');
            }
          }
        });
      });
      
      loginReq.on('error', (e) => {
        console.log('   ❌ Login API Error:', e.message);
      });
      
      loginReq.write(loginData);
      loginReq.end();
      
    } catch (e) {
      console.log('   ❌ Backend Error:', data);
    }
  });
});

backendReq.on('error', (e) => {
  console.log('   ❌ Backend is NOT RUNNING');
  console.log('   Error:', e.message);
  console.log('\n   ⚠️  SOLUTION: Start the backend server');
  console.log('   Steps:');
  console.log('      1. Open a terminal in this directory');
  console.log('      2. Run: npm run server');
  console.log('      3. Wait for: "✅ MongoDB Connected successfully"');
  console.log('      4. Wait for: "🚀 Server running on port 5000"');
  console.log('      5. Keep the terminal window OPEN!');
  console.log('      6. Run this test again: node test-connection.js\n');
  console.log('   OR use the startup script:');
  console.log('      FIXED_START_SERVER.bat\n');
});

// Test Frontend
setTimeout(() => {
  console.log('3. Testing Frontend (http://localhost:3000)...');
  const frontendReq = http.get('http://localhost:3000', (res) => {
    console.log('   ✅ Frontend is RUNNING');
    console.log(`   Status: ${res.statusCode}\n`);
  });
  
  frontendReq.on('error', (e) => {
    console.log('   ❌ Frontend is NOT RUNNING');
    console.log('   Error:', e.message);
    console.log('\n   ⚠️  SOLUTION: Start the frontend');
    console.log('   Steps:');
    console.log('      1. Open a NEW terminal (keep backend running!)');
    console.log('      2. Run: npm run client');
    console.log('      3. Wait for: "Local: http://localhost:3000/"');
    console.log('      4. Then open: http://localhost:3000/login\n');
  });
}, 2000);

// Summary
setTimeout(() => {
  console.log('='.repeat(60));
  console.log('   TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ If all tests passed: Your system is ready!');
  console.log('❌ If tests failed: Follow the instructions above\n');
}, 4000);

