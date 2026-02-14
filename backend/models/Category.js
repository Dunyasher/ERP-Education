const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const categorySchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
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

module.exports = mongoose.model('Category', categorySchema);

