const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const teacherSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  teacherId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffCategory'
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    photo: String,
    bloodGroup: String
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  qualification: {
    degree: String,
    specialization: String,
    university: String,
    yearOfPassing: Number,
    experience: Number // years
  },
  employment: {
    instituteType: {
      type: String,
      enum: ['school', 'college', 'academy', 'short_course'],
      required: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'resigned'],
      default: 'active'
    },
    subjects: [{
      type: String
    }],
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }]
  },
  salary: {
    basicSalary: Number,
    allowances: Number,
    totalSalary: Number,
    bankAccount: String,
    bankName: String,
    ifscCode: String
  }
}, {
  timestamps: true
});

// Generate SR No and Teacher ID before saving
teacherSchema.pre('save', async function(next) {
  try {
    if (!this.srNo) {
      try {
        this.srNo = await generateSerialNumber('TEA');
      } catch (srError) {
        console.error('Error generating Teacher SR No:', srError);
        // Use fallback - timestamp based
        this.srNo = `TEA-${Date.now().toString().slice(-6)}`;
      }
    }
    if (!this.teacherId) {
      try {
        this.teacherId = await generateSerialNumber('TID');
      } catch (tidError) {
        console.error('Error generating Teacher ID:', tidError);
        // Use fallback - timestamp based
        this.teacherId = `TID-${Date.now().toString().slice(-6)}`;
      }
    }
    next();
  } catch (error) {
    console.error('Error in teacher pre-save hook:', error);
    // Continue with save even if serial number generation fails
    next();
  }
});

// Calculate total salary
teacherSchema.pre('save', function(next) {
  if (this.salary && typeof this.salary === 'object') {
    const basicSalary = parseFloat(this.salary.basicSalary) || 0;
    const allowances = parseFloat(this.salary.allowances) || 0;
    if (basicSalary > 0 || allowances > 0) {
      this.salary.totalSalary = basicSalary + allowances;
    }
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);

