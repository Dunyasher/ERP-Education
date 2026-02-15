const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fixAndTest = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const email = 'admin@college.com';
    const password = 'admin123';

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found. Creating admin...');
      const newUser = await User.create({
        email: email,
        password: password,
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      console.log('✅ Admin created!\n');
      console.log('📧 Email:', newUser.email);
      console.log('🔑 Password:', password);
      process.exit(0);
    }

    console.log('✅ User found:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Password hash exists:', !!user.password);
    console.log('   Password hash length:', user.password ? user.password.length : 0);
    console.log('');

    // Test password comparison
    console.log('Testing password comparison...');
    const isMatch = await user.comparePassword(password);
    console.log('   comparePassword result:', isMatch);
    
    // Direct bcrypt test
    const directTest = await bcrypt.compare(password, user.password);
    console.log('   Direct bcrypt.compare result:', directTest);
    console.log('');

    if (!isMatch && !directTest) {
      console.log('❌ Password does not match. Resetting password...');
      user.password = password;
      user.markModified('password');
      await user.save();
      console.log('✅ Password reset!');
      
      // Test again
      const newUser = await User.findOne({ email: email });
      const testAfterReset = await newUser.comparePassword(password);
      console.log('   Test after reset:', testAfterReset);
    } else {
      console.log('✅ Password is correct!');
    }

    console.log('\n🎉 Login should work with:');
    console.log('   Email:', email);
    console.log('   Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

fixAndTest();

