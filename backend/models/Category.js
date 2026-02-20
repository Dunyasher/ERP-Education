const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const categorySchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true
  },
  instituteType: {
    type: String,
    enum: ['school', 'college', 'academy', 'short_course'],
    required: true
  },
  categoryType: {
    type: String,
    enum: ['course', 'teacher', 'staff', 'student', 'expense', 'income'],
    required: false,
    default: 'course'
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

// Generate slug from name
categorySchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Generate SR No before saving
categorySchema.pre('save', async function(next) {
  if (!this.srNo) {
    this.srNo = await generateSerialNumber('CAT');
  }
  next();
});

// Index for efficient queries
categorySchema.index({ categoryType: 1, instituteType: 1, isActive: 1 });
// Unique index on name + categoryType + instituteType + collegeId combination
categorySchema.index({ name: 1, categoryType: 1, instituteType: 1, collegeId: 1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { isActive: true, categoryType: { $exists: true } }
});
// Unique index on slug per college
categorySchema.index({ slug: 1, collegeId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Category', categorySchema);

