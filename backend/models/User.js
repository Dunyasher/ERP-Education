const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const userSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'sweeper', 'security'],
    default: 'student'
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    address: String,
    photo: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

// Generate SR No and Unique ID before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.srNo) {
      const prefix = this.role === 'teacher' ? 'TEA' : 
                     this.role === 'accountant' ? 'ACC' : 
                     this.role === 'student' ? 'STU' : 'USR';
      try {
        this.srNo = await generateSerialNumber(prefix);
      } catch (srError) {
        console.error('Error generating User SR No:', srError);
        // Use fallback - timestamp based
        this.srNo = `${prefix}-${Date.now().toString().slice(-6)}`;
      }
    }
    
    // Generate unique ID for teachers and accountants
    if ((this.role === 'teacher' || this.role === 'accountant') && !this.uniqueId) {
      const idPrefix = this.role === 'teacher' ? 'TID' : 'AID';
      try {
        this.uniqueId = await generateSerialNumber(idPrefix);
      } catch (idError) {
        console.error('Error generating Unique ID:', idError);
        // Use fallback - timestamp based
        this.uniqueId = `${idPrefix}-${Date.now().toString().slice(-6)}`;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in user pre-save hook:', error);
    // Continue with save even if serial number generation fails
    next();
  }
});

module.exports = mongoose.model('User', userSchema);

