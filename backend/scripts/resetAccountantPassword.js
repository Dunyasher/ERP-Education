const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const resetAccountantPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get email from command line arguments
    const email = process.argv[2];
    if (!email) {
      console.log('❌ Please provide accountant email address');
      console.log('\nUsage: node backend/scripts/resetAccountantPassword.js <email> [newPassword]');
      console.log('Example: node backend/scripts/resetAccountantPassword.js accountant@college.com newpassword123');
      process.exit(1);
    }

    // Find accountant by email
    const accountant = await User.findOne({ email: email.toLowerCase().trim(), role: 'accountant' });
    
    if (!accountant) {
      console.log(`❌ Accountant with email "${email}" not found.`);
      console.log('\n💡 To see all accountants, run:');
      console.log('   node backend/scripts/showAccountant.js');
      process.exit(1);
    }

    // Get new password from command line or use default
    const newPassword = process.argv[3] || 'password123';

    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log(`📧 Accountant Email: ${accountant.email}`);
    console.log(`📛 Name: ${accountant.profile?.firstName || 'N/A'} ${accountant.profile?.lastName || ''}`.trim());
    console.log(`\n🔄 Resetting password...`);

    // Reset password
    accountant.password = newPassword;
    accountant.markModified('password');
    await accountant.save();

    console.log('✅ Password reset successfully!');
    console.log(`\n🔑 New Password: ${newPassword}`);
    console.log('\n⚠️  Please change this password after first login for security.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  }
};

resetAccountantPassword();

