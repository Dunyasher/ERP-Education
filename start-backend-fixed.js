// Fixed Backend Startup Script
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';

console.log('🔄 Connecting to MongoDB...');
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ MongoDB Connected successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('⚠️  Server will continue but database operations may fail');
  console.log('   Retrying connection every 5 seconds...\n');
  
  const retryInterval = setInterval(() => {
    mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log('✅ MongoDB Connected successfully (retry)');
      clearInterval(retryInterval);
    })
    .catch(() => {
      // Silently retry
    });
  }, 5000);
});

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/students', require('./backend/routes/students'));
app.use('/api/teachers', require('./backend/routes/teachers'));
app.use('/api/categories', require('./backend/routes/categories'));
app.use('/api/courses', require('./backend/routes/courses'));
app.use('/api/lessons', require('./backend/routes/lessons'));
app.use('/api/fees', require('./backend/routes/fees'));
app.use('/api/attendance', require('./backend/routes/attendance'));
app.use('/api/pages', require('./backend/routes/pages'));
app.use('/api/blog', require('./backend/routes/blog'));
app.use('/api/reports', require('./backend/routes/reports'));
app.use('/api/dashboard', require('./backend/routes/dashboard'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Education ERP API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'College Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      register: '/api/auth/register'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🚀 BACKEND SERVER IS RUNNING!');
  console.log('='.repeat(50));
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login Endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log('='.repeat(50));
  console.log('');
  console.log('✅ Server is ready to accept connections!');
  console.log('✅ Frontend can now connect to this backend');
  console.log('');
});

