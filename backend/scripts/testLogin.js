const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testLogin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get credentials from command line or use defaults
    const email = process.argv[2] || 'admin@college.com';
    const password = process.argv[3] || 'admin123';

    console.log(`Testing login for: ${email}`);
    console.log(`Password: ${password}\n`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}\n`);

    // Test password comparison
    console.log('Testing password...');
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      console.log('✅ Password is CORRECT!');
      console.log('   Login should work with these credentials.');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('   The password does not match.');
      console.log('\n💡 To reset the password, run:');
      console.log(`   node scripts/resetAdminPassword.js ${email} ${password}`);
    }

    process.exit(isMatch ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testLogin();

