const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const showAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all admin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    }).select('email role profile isActive createdAt');

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database.');
      console.log('\n💡 To create an admin user, run:');
      console.log('   node backend/scripts/createAdmin.js');
      process.exit(0);
    }

    console.log('📋 Admin Users in Database:');
    console.log('═'.repeat(60));
    
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Role: ${admin.role}`);
      console.log(`   📛 Name: ${admin.profile?.firstName || 'N/A'} ${admin.profile?.lastName || ''}`.trim());
      console.log(`   ✅ Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   📅 Created: ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n🔑 Default Admin Credentials:');
    console.log('   Email: admin@college.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Note: Passwords are hashed in the database for security.');
    console.log('   If you forgot the password, you can reset it from the Settings page.');
    console.log('   Or create a new admin using: node backend/scripts/createAdmin.js');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

showAdmin();

