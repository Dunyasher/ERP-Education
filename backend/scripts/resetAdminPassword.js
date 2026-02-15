const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-erp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get email from command line argument or use default
    const email = process.argv[2] || 'dunyasher@gmail.com';
    const newPassword = process.argv[3] || 'admin123';

    // Find admin user
    const admin = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!admin) {
      console.log(`❌ Admin user with email "${email}" not found.`);
      console.log('\n📋 Available admin users:');
      const allAdmins = await User.find({ 
        role: { $in: ['admin', 'super_admin'] } 
      }).select('email role');
      
      if (allAdmins.length === 0) {
        console.log('   No admin users found.');
        console.log('\n💡 Create an admin user:');
        console.log('   node backend/scripts/createAdmin.js');
      } else {
        allAdmins.forEach((a, i) => {
          console.log(`   ${i + 1}. ${a.email} (${a.role})`);
        });
      }
      process.exit(1);
    }

    // Reset password
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password reset successfully!');
    console.log('\n📧 Email:', admin.email);
    console.log('🔑 New Password:', newPassword);
    console.log('👤 Role:', admin.role);
    console.log('\n🎉 You can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();

