/**
 * Script to create initial super admin account
 * Run this once to create the first super admin user
 * 
 * Usage: node backend/scripts/createSuperAdmin.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log('   If you want to create a new one, please delete the existing super admin first.');
      process.exit(0);
    }

    // Default super admin credentials (should be changed after first login)
    const superAdminData = {
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@system.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
      role: 'super_admin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      },
      // Super admin has all permissions by default
      permissions: {
        manageStudents: true,
        manageTeachers: true,
        manageCourses: true,
        manageFees: true,
        manageAttendance: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true
      },
      isActive: true
      // Note: collegeId is not required for super_admin
    };

    const superAdmin = await User.create(superAdminData);

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\n📋 Next steps:');
    console.log('   1. Log in with the super admin credentials');
    console.log('   2. Go to Account Settings');
    console.log('   3. Create a new college/institute');
    console.log('   4. Assign an admin to that college');
    console.log('   5. Configure payment system for the college');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();

