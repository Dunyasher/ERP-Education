const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'leave'],
    default: 'absent'
  },
  // Attendance type: manual or digital
  attendanceType: {
    type: String,
    enum: ['manual', 'digital'],
    required: true,
    default: 'manual'
  },
  // Digital attendance method (if digital)
  digitalMethod: {
    type: String,
    enum: ['qr_code', 'card_scan', 'face_scan', 'fingerprint', 'biometric'],
    required: function() {
      return this.attendanceType === 'digital';
    }
  },
  // Card ID or QR code data (for digital)
  cardId: String,
  // Biometric data (for face scan or fingerprint)
  biometricData: {
    faceId: String, // Face recognition ID or template
    fingerprintId: String, // Fingerprint template ID
    confidence: Number, // Confidence score (0-100)
    deviceId: String // Device used for scanning
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be Teacher or Admin
    required: true
  },
  remarks: String,
  location: {
    type: {
      type: String,
      enum: ['online', 'offline']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ courseId: 1, date: 1 });
attendanceSchema.index({ attendanceType: 1, date: 1 });
attendanceSchema.index({ className: 1, section: 1, date: 1 });
attendanceSchema.index({ collegeId: 1, date: 1, attendanceType: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

