/**
 * Script to create/update admin user: dunyasher@gmail.com
 * Run this to create or update the admin account
 * 
 * Usage: node backend/scripts/createDunyaAdmin.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';

async function createDunyaAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const email = 'dunyasher@gmail.com';
    const password = 'dunyaking984';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Find or create a college for this admin
    const College = require('../models/College');
    let college = await College.findOne({ email: 'dunyasher@gmail.com' });
    
    if (!college) {
      // Try to find any existing college
      college = await College.findOne({});
      
      if (!college) {
        // Create a default college for this admin
        console.log('📝 No college found. Creating default college...');
        college = await College.create({
          name: 'Dunya College',
          email: 'dunyasher@gmail.com',
          password: password,
          instituteType: 'college',
          contactInfo: {
            phone: '+1234567890'
          }
        });
        console.log('✅ Default college created:', college.name);
      }
    }
    
    if (existingUser) {
      console.log('ℹ️  User already exists. Updating password and role...');
      
      // Update password and ensure role is admin
      existingUser.password = password;
      existingUser.tempPassword = password; // Store for super admin viewing
      existingUser.role = 'admin';
      existingUser.collegeId = college._id; // Assign to college
      
      // Ensure user is active
      existingUser.isActive = true;
      
      await existingUser.save();
      
      console.log('✅ Admin user updated successfully!');
      console.log('📧 Email:', existingUser.email);
      console.log('🔑 Password:', password);
      console.log('👤 Role:', existingUser.role);
      console.log('🏢 College ID:', existingUser.collegeId || 'Not assigned (needs college assignment)');
      console.log('✅ Status:', existingUser.isActive ? 'Active' : 'Inactive');
      
      if (!existingUser.collegeId) {
        console.log('\n⚠️  WARNING: This admin is not assigned to any college.');
        console.log('   To assign to a college, use the super admin panel or create a college first.');
      }
    } else {
      console.log('📝 Creating new admin user...');
      
      // Create new admin user
      const admin = await User.create({
        email: email.toLowerCase().trim(),
        password: password,
        tempPassword: password, // Store for super admin viewing
        role: 'admin',
        collegeId: college._id, // Assign to college
        profile: {
          firstName: 'Dunya',
          lastName: 'Sher'
        },
        isActive: true,
        permissions: {
          manageStudents: true,
          manageTeachers: true,
          manageCourses: true,
          manageFees: true,
          manageAttendance: true,
          viewReports: true,
          manageUsers: true,
          manageSettings: false // Only super admin can manage college settings
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password:', password);
      console.log('👤 Role:', admin.role);
      console.log('🏢 College:', college.name);
      console.log('✅ Status: Active');
    }

    console.log('\n🎉 You can now login with:');
    console.log('   Email: dunyasher@gmail.com');
    console.log('   Password: dunyaking984');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - email might already exist with different case');
    }
    process.exit(1);
  }
}

// Run the script
createDunyaAdmin();

