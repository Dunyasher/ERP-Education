const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const instituteTypeSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  value: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'school'
  },
  color: {
    type: String,
    default: '#1976d2'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate SR No before saving
instituteTypeSchema.pre('save', async function(next) {
  if (!this.srNo) {
    try {
      this.srNo = await generateSerialNumber('INST-TYPE');
    } catch (error) {
      console.error('Error generating InstituteType SR No:', error);
      this.srNo = `INST-TYPE-${Date.now().toString().slice(-6)}`;
    }
  }
  
  // Generate value from name if not provided
  if (!this.value && this.name) {
    this.value = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  
  next();
});

// Index for efficient queries
instituteTypeSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('InstituteType', instituteTypeSchema);

