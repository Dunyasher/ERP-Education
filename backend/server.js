const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Middleware - CORS Configuration (Optimized for seamless connection)
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173',
    'http://0.0.0.0:5173',
    'http://0.0.0.0:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));
// Increase JSON payload limit and optimize parsing
app.use(express.json({ 
  limit: '10mb', 
  extended: true,
  strict: false // Allow non-strict JSON
}));
app.use(express.urlencoded({ 
  limit: '10mb', 
  extended: true,
  parameterLimit: 50000
}));

// Fix typo middleware: collegeld -> collegeId
app.use((req, res, next) => {
  if (req.body && req.body.collegeld) {
    req.body.collegeId = req.body.collegeld;
    delete req.body.collegeld;
  }
  if (req.query && req.query.collegeld) {
    req.query.collegeId = req.query.collegeld;
    delete req.query.collegeld;
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request timeout middleware (60 seconds for login/auth operations)
app.use((req, res, next) => {
  // Longer timeout for auth endpoints
  const timeout = req.path.includes('/auth/') ? 60000 : 30000;
  req.setTimeout(timeout, () => {
    res.status(408).json({ message: 'Request timeout' });
  });
  next();
});

// Database Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';

let retryInterval = null;

const connectDB = () => {
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
  })
  .catch(err => {
    if (!retryInterval) {
      console.error('❌ MongoDB Connection Error:', err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.error('\n⚠️  MongoDB is not running!');
        console.error('📋 Solutions:');
        console.error('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
        console.error('   2. Start MongoDB service: net start MongoDB (Windows)');
        console.error('   3. Or use MongoDB Atlas (cloud): Update MONGODB_URI in backend/.env');
        console.error('      Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/education-erp');
        console.error('\n⚠️  Server will continue to run but database operations will fail until MongoDB is connected.');
        console.error('   Retrying connection every 5 seconds...\n');
      } else {
        console.error('\n⚠️  Server will continue to run but database operations may fail.');
        console.error('   Retrying connection every 5 seconds...\n');
      }
      
      // Retry connection every 5 seconds
      retryInterval = setInterval(() => {
        connectDB();
      }, 5000);
    }
  });
};

// Start database connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
const studentsRouter = require('./routes/students');
app.use('/api/students', studentsRouter);
console.log('✅ Students routes registered');
console.log('   - GET /api/students');
console.log('   - GET /api/students/:id/history');
console.log('   - GET /api/students/:id');
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/qrcode', require('./routes/qrcode'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/staff-requests', require('./routes/staffRequests'));
app.use('/api/staff-categories', require('./routes/staffCategories'));
app.use('/api/institute-types', require('./routes/instituteTypes'));
app.use('/api/accountant', require('./routes/accountant'));
console.log('✅ Accountant routes registered');
console.log('   - POST /api/accountant/monthly-payments');
console.log('   - GET /api/accountant/monthly-payments');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Education ERP API is running' });
});

// Test endpoint to verify students routes are working
app.get('/api/students/test', (req, res) => {
  res.json({ message: 'Students routes are working!', timestamp: new Date() });
});

// 404 handler for API routes (must be after all routes)
app.use('/api/*', (req, res) => {
  console.error('❌ 404 - Route not found:', req.method, req.originalUrl);
  console.error('Request path:', req.path);
  console.error('Request baseUrl:', req.baseUrl);
  res.status(404).json({ 
    message: 'API endpoint not found', 
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/students',
      'GET /api/students/:id',
      'GET /api/students/:id/history',
      'POST /api/students',
      'PUT /api/students/:id',
      'DELETE /api/students/:id'
    ]
  });
});

// Global Error Handler Middleware (must be last)
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err.message);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Stack:', err.stack);
  
  // Ensure response hasn't been sent
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Handle unhandled promise rejections - prevent server crash
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  // Don't exit - keep server running
});

// Handle uncaught exceptions - prevent server crash
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  // Don't exit - keep server running, but log the error
});

const PORT = process.env.PORT || 5000;

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EDUCATION ERP BACKEND SERVER');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS Enabled for: http://localhost:5173`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log('='.repeat(60));
  console.log('✅ Server is ready to accept connections\n');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use`);
    console.error('📋 This usually means the server is already running.');
    console.error('📋 Options:');
    console.error('   1. Use the existing server (recommended)');
    console.error('   2. Close the existing server and restart');
    console.error('   3. Change PORT in backend/.env to use a different port');
    console.error('\n💡 To find and close the existing server:');
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error('   taskkill /PID <PID> /F');
    console.error('\n⚠️  Server will not start on this port. Exiting...\n');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

