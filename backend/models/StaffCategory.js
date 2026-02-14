const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const staffCategorySchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  instituteType: {
    type: String,
    enum: ['school', 'college', 'academy', 'short_course'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate SR No before saving
staffCategorySchema.pre('save', async function(next) {
  if (!this.srNo) {
    try {
      this.srNo = await generateSerialNumber('STF-CAT');
    } catch (error) {
      console.error('Error generating StaffCategory SR No:', error);
      this.srNo = `STF-CAT-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Index for efficient queries
staffCategorySchema.index({ instituteType: 1, isActive: 1 });
// Unique index on name + instituteType combination
staffCategorySchema.index({ name: 1, instituteType: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

module.exports = mongoose.model('StaffCategory', staffCategorySchema);

