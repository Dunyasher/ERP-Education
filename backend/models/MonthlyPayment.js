const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const monthlyPaymentSchema = new mongoose.Schema({
  paymentNo: {
    type: String,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'cheque'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  collectedByName: {
    type: String
  },
  notes: String,
  receiptNo: String,
  status: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'overdue'],
    default: 'paid'
  },
  isAdmissionFee: {
    type: Boolean,
    default: false
  },
  isMonthlyFee: {
    type: Boolean,
    default: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentTransaction',
    required: false
  }
}, {
  timestamps: true
});

// Generate Payment No before saving
monthlyPaymentSchema.pre('save', async function(next) {
  if (!this.paymentNo) {
    try {
      this.paymentNo = await generateSerialNumber('MPAY');
    } catch (error) {
      console.error('Error generating payment number:', error);
      this.paymentNo = `MPAY-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

// Index for efficient queries
monthlyPaymentSchema.index({ studentId: 1, year: 1, month: 1 });
monthlyPaymentSchema.index({ paymentDate: 1 });

module.exports = mongoose.model('MonthlyPayment', monthlyPaymentSchema);

