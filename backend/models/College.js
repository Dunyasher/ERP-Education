const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const collegeSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
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
  instituteType: {
    type: String,
    enum: ['school', 'college', 'academy', 'short_course'],
    required: true
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  registrationInfo: {
    registrationNumber: String,
    registrationDate: Date,
    licenseNumber: String,
    taxId: String
  },
  settings: {
    logo: String,
    theme: {
      primaryColor: {
        type: String,
        default: '#1976d2'
      },
      secondaryColor: {
        type: String,
        default: '#dc004e'
      }
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
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
collegeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
collegeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate SR No before saving
collegeSchema.pre('save', async function(next) {
  try {
    if (!this.srNo) {
      try {
        this.srNo = await generateSerialNumber('COL');
      } catch (srError) {
        console.error('Error generating College SR No:', srError);
        // Use fallback - timestamp based
        this.srNo = `COL-${Date.now().toString().slice(-6)}`;
      }
    }
    next();
  } catch (error) {
    console.error('Error in college pre-save hook:', error);
    next();
  }
});

module.exports = mongoose.model('College', collegeSchema);

