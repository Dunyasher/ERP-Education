const mongoose = require('mongoose');

const staffRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByName: {
    type: String,
    required: true
  },
  requestedByEmail: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['teacher', 'accountant', 'sweeper', 'security'],
    default: 'teacher'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedDetails: {
    name: String,
    email: String,
    phone: String,
    notes: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: String,
  approvedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
staffRequestSchema.index({ status: 1, createdAt: -1 });
staffRequestSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('StaffRequest', staffRequestSchema);

