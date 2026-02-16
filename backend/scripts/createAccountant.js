const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAccountant = async () => {
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
    const password = process.argv[3] || 'password123';
    const firstName = process.argv[4] || 'Accountant';
    const lastName = process.argv[5] || 'User';
    const phone = process.argv[6] || '';

    // Check if accountant already exists
    const accountantExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (accountantExists) {
      console.log(`ℹ️  Accountant user already exists: ${accountantExists.email}`);
      console.log(`   Role: ${accountantExists.role}`);
      if (accountantExists.role !== 'accountant') {
        console.log(`   ⚠️  Warning: This user has role "${accountantExists.role}", not "accountant"`);
      }
      console.log('\n💡 To reset password, run:');
      console.log(`   node backend/scripts/resetAccountantPassword.js ${email} <newPassword>`);
      process.exit(0);
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log('🔄 Creating accountant user...\n');

    // Create accountant user
    const accountant = await User.create({
      email: email.toLowerCase().trim(),
      password: password,
      role: 'accountant',
      profile: {
        firstName: firstName,
        lastName: lastName,
        phone: phone
      }
    });

    console.log('✅ Accountant user created successfully!');
    console.log('═'.repeat(60));
    console.log(`📧 Email: ${accountant.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${accountant.role}`);
    console.log(`🆔 Unique ID: ${accountant.uniqueId || 'N/A'}`);
    console.log(`📛 Name: ${accountant.profile?.firstName || 'N/A'} ${accountant.profile?.lastName || ''}`.trim());
    console.log(`📞 Phone: ${accountant.profile?.phone || 'N/A'}`);
    console.log('═'.repeat(60));
    console.log('\n🎉 You can now login with these credentials!');
    console.log('\n⚠️  Please change this password after first login for security.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating accountant user:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 This email is already registered. Use a different email or reset the password.');
    }
    process.exit(1);
  }
};

createAccountant();

