const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
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

module.exports = mongoose.model('Attendance', attendanceSchema);

