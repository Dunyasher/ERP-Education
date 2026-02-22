/**
 * Connect Server Script
 * Starts the backend server and verifies connection
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🚀 Connecting Server...\n');
console.log('='.repeat(70));

// Check if backend directory exists
const backendPath = path.join(__dirname, 'backend');
const fs = require('fs');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found!');
  process.exit(1);
}

// Start the server
console.log('📡 Starting backend server...\n');

const serverProcess = spawn('npm', ['start'], {
  cwd: backendPath,
  shell: true,
  stdio: 'inherit'
});

// Wait for server to start
let attempts = 0;
const maxAttempts = 30; // 30 seconds max

const checkServer = setInterval(() => {
  attempts++;
  
  const req = http.get('http://localhost:5000', (res) => {
    clearInterval(checkServer);
    console.log('\n' + '='.repeat(70));
    console.log('✅ Server is now CONNECTED and running!');
    console.log('📡 Backend URL: http://localhost:5000');
    console.log('🌐 API URL: http://localhost:5000/api');
    console.log('\n✨ You can now:');
    console.log('   1. Access the API at http://localhost:5000/api');
    console.log('   2. Use the frontend to connect');
    console.log('   3. Login with admin credentials');
    console.log('\n⚠️  Keep this terminal open to keep the server running!');
    console.log('   Press Ctrl+C to stop the server');
    console.log('='.repeat(70));
  });

  req.on('error', () => {
    if (attempts >= maxAttempts) {
      clearInterval(checkServer);
      console.log('\n❌ Server failed to start after 30 seconds');
      console.log('   Check backend logs for errors');
      serverProcess.kill();
      process.exit(1);
    }
  });

  req.setTimeout(1000, () => {
    req.destroy();
  });
}, 1000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  serverProcess.kill();
  clearInterval(checkServer);
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill();
  clearInterval(checkServer);
  process.exit(0);
});

