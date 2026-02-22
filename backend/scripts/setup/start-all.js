/**
 * Start All Services Script
 * Starts MongoDB, Backend, and Frontend in the correct order
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting All Services...\n');
console.log('='.repeat(60));

// Check if .env files exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');

if (!fs.existsSync(backendEnvPath)) {
  console.log('⚠️  Backend .env file not found!');
  console.log('   Run: node setup-connections.js first\n');
  process.exit(1);
}

if (!fs.existsSync(clientEnvPath)) {
  console.log('⚠️  Client .env file not found!');
  console.log('   Run: node setup-connections.js first\n');
  process.exit(1);
}

console.log('✅ Environment files found\n');

// Start Backend
console.log('🔧 Starting Backend Server...');
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🎨 Starting Frontend Server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'client'),
    shell: true,
    stdio: 'inherit'
  });

  frontend.on('error', (err) => {
    console.error('❌ Failed to start frontend:', err);
  });
}, 3000);

console.log('\n✅ Services starting...');
console.log('   Backend: http://localhost:5000');
console.log('   Frontend: http://localhost:5173');
console.log('\n⚠️  Press Ctrl+C to stop all services\n');

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all services...');
  backend.kill();
  process.exit(0);
});

