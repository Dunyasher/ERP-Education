const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const showAccountant = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all accountant users
    const accountantUsers = await User.find({ 
      role: 'accountant' 
    }).select('email role profile uniqueId isActive createdAt');

    if (accountantUsers.length === 0) {
      console.log('❌ No accountant users found in the database.');
      console.log('\n💡 To create an accountant user:');
      console.log('   1. Login as admin');
      console.log('   2. Go to Teachers page');
      console.log('   3. Click "Add Teacher"');
      console.log('   4. Select role as "Accountant"');
      console.log('   5. Fill in the details');
      process.exit(0);
    }

    console.log('📋 Accountant Users in Database:');
    console.log('═'.repeat(60));
    
    accountantUsers.forEach((accountant, index) => {
      console.log(`\n${index + 1}. Accountant User:`);
      console.log(`   📧 Email: ${accountant.email}`);
      console.log(`   👤 Role: ${accountant.role}`);
      console.log(`   🆔 Unique ID: ${accountant.uniqueId || 'N/A'}`);
      console.log(`   📛 Name: ${accountant.profile?.firstName || 'N/A'} ${accountant.profile?.lastName || ''}`.trim());
      console.log(`   📞 Phone: ${accountant.profile?.phone || 'N/A'}`);
      console.log(`   ✅ Status: ${accountant.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   📅 Created: ${accountant.createdAt ? new Date(accountant.createdAt).toLocaleString() : 'N/A'}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n🔑 Default Password Information:');
    console.log('   If the accountant was created without specifying a password,');
    console.log('   the default password is: password123');
    console.log('\n⚠️  Note: Passwords are hashed in the database for security.');
    console.log('   You cannot see the actual password, but you can reset it.');
    console.log('\n💡 To reset an accountant password:');
    console.log('   1. Login as admin');
    console.log('   2. Go to Settings page');
    console.log('   3. Find the accountant user');
    console.log('   4. Click "Change Password" and set a new password');
    console.log('\n   OR use the reset script:');
    console.log('   node backend/scripts/resetAccountantPassword.js <email> <newPassword>');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

showAccountant();

