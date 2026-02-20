const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const studentSchema = new mongoose.Schema({
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
  admissionNo: {
    type: String
  },
  rollNo: {
    type: String
  },
  // Class and Section information
  className: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  // QR Code for digital attendance
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  // Biometric data for attendance
  biometric: {
    faceId: {
      type: String,
      sparse: true,
      select: false // Don't select by default for security
    },
    fingerprintId: {
      type: String,
      sparse: true,
      select: false // Don't select by default for security
    },
    faceTemplate: {
      type: String, // Base64 encoded face template
      select: false
    },
    fingerprintTemplate: {
      type: String, // Base64 encoded fingerprint template
      select: false
    },
    enrolledAt: Date,
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    photo: String,
    bloodGroup: String,
    nationality: String
  },
  contactInfo: {
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  parentInfo: {
    fatherName: String,
    fatherPhone: String,
    fatherOccupation: String,
    motherName: String,
    motherPhone: String,
    motherOccupation: String,
    guardianName: String,
    guardianPhone: String,
    guardianRelation: String
  },
  academicInfo: {
    instituteType: {
      type: String,
      enum: ['school', 'college', 'academy', 'short_course'],
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    // Support multiple courses per student
    courses: [{
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      enrolledDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'dropped'],
        default: 'active'
      }
    }],
    session: String,
    admissionDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred'],
      default: 'active'
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Can be Teacher or Accountant
      required: false
    },
    admittedByName: {
      type: String // Store name for quick reference
    }
  },
  feeInfo: {
    admissionFee: {
      type: Number,
      default: 0
    },
    totalFee: Number,
    paidFee: {
      type: Number,
      default: 0
    },
    pendingFee: Number,
    remainingFee: Number,
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure'
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure admissionNo is unique per college
studentSchema.index({ admissionNo: 1, collegeId: 1 }, { unique: true, sparse: true });

// Generate SR No and Admission No before saving
studentSchema.pre('save', async function(next) {
  try {
    if (!this.srNo) {
      try {
        this.srNo = await generateSerialNumber('STU');
      } catch (srError) {
        console.error('Error generating SR No:', srError);
        // Use fallback - timestamp based
        this.srNo = `STU-${Date.now().toString().slice(-6)}`;
      }
    }
    if (!this.admissionNo) {
      try {
        this.admissionNo = await generateSerialNumber('ADM');
      } catch (admError) {
        console.error('Error generating Admission No:', admError);
        // Use fallback - timestamp based
        this.admissionNo = `ADM-${Date.now().toString().slice(-6)}`;
      }
    }
    next();
  } catch (error) {
    console.error('Error in student pre-save hook:', error);
    // Continue with save even if serial number generation fails
    next();
  }
});

// Calculate pending fee and remaining fee
studentSchema.methods.calculatePendingFee = function() {
  this.feeInfo.pendingFee = this.feeInfo.totalFee - this.feeInfo.paidFee;
  this.feeInfo.remainingFee = (this.feeInfo.totalFee || 0) + (this.feeInfo.admissionFee || 0) - (this.feeInfo.paidFee || 0);
  return this.feeInfo.pendingFee;
};

module.exports = mongoose.model('Student', studentSchema);

