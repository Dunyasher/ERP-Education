const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const updateToAccountant = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get email and password from command line arguments
    const email = process.argv[2] || 'accountant@college.com';
    const newPassword = process.argv[3] || 'newpassword';

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      console.log('\n💡 To create an accountant, run:');
      console.log('   node backend/scripts/createAccountant.js <email> <password>');
      process.exit(1);
    }

    console.log(`📧 User Email: ${user.email}`);
    console.log(`👤 Current Role: ${user.role}`);
    console.log(`📛 Name: ${user.profile?.firstName || 'N/A'} ${user.profile?.lastName || ''}`.trim());
    console.log(`\n🔄 Updating role to "accountant" and resetting password...`);

    // Update role to accountant
    user.role = 'accountant';
    
    // Reset password
    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }
    user.password = newPassword;
    user.markModified('password');
    
    await user.save();

    console.log('✅ User updated successfully!');
    console.log('═'.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`🆔 Unique ID: ${user.uniqueId || 'N/A'}`);
    console.log('═'.repeat(60));
    console.log('\n🎉 You can now login as accountant with these credentials!');
    console.log('\n⚠️  Please change this password after first login for security.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    process.exit(1);
  }
};

updateToAccountant();

