const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'student_created', 
      'student_deleted', 
      'student_modified', 
      'teacher_created', 
      'expense_created', 
      'expense_updated',
      'expense_deleted',
      'fee_paid', 
      'fee_updated',
      'email_changed',
      'password_changed',
      'user_created',
      'user_updated',
      'user_deleted',
      'financial_data_updated',
      'income_recorded',
      'expense_recorded',
      'other'
    ],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'super_admin', 'director', 'owner', 'teacher', 'student', 'all'],
    default: 'all'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['student', 'teacher', 'expense', 'fee', 'user', 'financial', 'income', 'other']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    studentName: String,
    studentEmail: String,
    studentSrNo: String,
    deletedBy: String,
    deletedByEmail: String,
    createdBy: String,
    createdByEmail: String,
    updatedBy: String,
    updatedByEmail: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    reason: String,
    // Financial data
    amount: Number,
    category: String,
    date: Date,
    period: String, // daily, weekly, monthly
    // User changes
    userId: mongoose.Schema.Types.ObjectId,
    userEmail: String,
    oldEmail: String,
    newEmail: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

