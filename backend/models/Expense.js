const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const expenseSchema = new mongoose.Schema({
  srNo: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true,
    enum: [
      'operational',
      'utilities',
      'maintenance',
      'supplies',
      'salary',
      'administrative',
      'department',
      'other'
    ],
    default: 'other'
  },
  department: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  vendor: {
    name: String,
    contact: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'cheque'],
    default: 'cash'
  },
  receiptNo: String,
  invoiceNo: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate SR No before saving
expenseSchema.pre('save', async function(next) {
  if (!this.srNo) {
    this.srNo = await generateSerialNumber('EXP');
  }
  next();
});

// Index for date queries
expenseSchema.index({ date: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ department: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

