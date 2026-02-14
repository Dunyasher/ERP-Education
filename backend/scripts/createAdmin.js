const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@college.com' });
    if (adminExists) {
      console.log('ℹ️  Admin user already exists:', adminExists.email);
      console.log('   You can use: admin@college.com / admin123');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@college.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@college.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('\n🎉 You can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();

