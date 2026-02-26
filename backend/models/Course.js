const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const courseSchema = new mongoose.Schema({
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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
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
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  // Class schedules - multiple timings for the same course
  schedules: [{
    startTime: {
      type: String, // Format: "HH:mm" (e.g., "14:00" for 2 PM)
      required: true
    },
    endTime: {
      type: String, // Format: "HH:mm" (e.g., "16:00" for 4 PM)
      required: true
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    room: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    }
  },
  fee: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  capacity: {
    type: Number,
    default: 50
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  requirements: [String],
  learningOutcomes: [String],
  thumbnail: String,
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Compound index to ensure slug is unique per college
courseSchema.index({ slug: 1, collegeId: 1 }, { unique: true });

// Generate slug from name
courseSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Generate SR No before saving
courseSchema.pre('save', async function(next) {
  if (!this.srNo) {
    this.srNo = await generateSerialNumber('CRS');
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);

