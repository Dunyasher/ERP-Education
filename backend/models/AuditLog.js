const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'student_created',
      'student_updated',
      'student_deleted',
      'fee_paid',
      'fee_updated',
      'attendance_marked',
      'attendance_updated',
      'expense_created',
      'expense_updated',
      'expense_deleted',
      'teacher_created',
      'teacher_updated',
      'course_created',
      'course_updated',
      'settings_changed',
      'password_changed',
      'login',
      'logout'
    ]
  },
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    name: String
  },
  targetType: {
    type: String,
    enum: ['student', 'teacher', 'fee', 'expense', 'attendance', 'course', 'user', 'system']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  approvedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    approvedAt: Date
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ requiresApproval: 1, isApproved: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

