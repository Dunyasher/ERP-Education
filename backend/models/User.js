const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const userSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function() {
      return this.role !== 'super_admin';
    },
    index: true
  },
  permissions: {
    manageStudents: { type: Boolean, default: false },
    manageTeachers: { type: Boolean, default: false },
    manageCourses: { type: Boolean, default: false },
    manageFees: { type: Boolean, default: false },
    manageAttendance: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    manageSettings: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false }
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Temporary password storage for super admin viewing (optional, not hashed)
  // This is only set when password is created/reset by super admin
  tempPassword: {
    type: String,
    select: false // Not selected by default for security
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

// Compound index to ensure email is unique per college (sparse for super_admin)
userSchema.index({ email: 1, collegeId: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
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

