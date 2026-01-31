/**
 * Check Backend Status and MongoDB Connection
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function checkConnections() {
  console.log('🔍 Checking Backend Status...\n');
  console.log('='.repeat(60));

  // Check MongoDB
  console.log('1️⃣  Testing MongoDB Connection...');
  try {
    if (!process.env.MONGO_URI) {
      console.log('   ❌ MONGO_URI not set in backend/.env');
    } else {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
      const dbName = mongoose.connection.db.databaseName;
      console.log(`   ✅ MongoDB: Connected to database: ${dbName}`);
      await mongoose.connection.close();
    }
  } catch (error) {
    console.log(`   ❌ MongoDB: ${error.message}`);
  }

  // Check Backend Server
  console.log('\n2️⃣  Testing Backend Server...');
  const http = require('http');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ Backend: ${data.trim()}`);
        } else {
          console.log(`   ❌ Backend: Status ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Backend: ${err.message}`);
      console.log('   → Make sure backend is running: cd backend && npm start');
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Backend: Connection timeout');
      console.log('   → Make sure backend is running: cd backend && npm start');
      resolve();
    });
  });
}

checkConnections().then(() => {
  console.log('\n' + '='.repeat(60));
  process.exit(0);
});

