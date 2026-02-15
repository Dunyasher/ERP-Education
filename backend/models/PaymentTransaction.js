const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const paymentTransactionSchema = new mongoose.Schema({
  transactionNo: {
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
  receiptNo: String
}, {
  timestamps: true
});

// Generate Transaction No before saving
paymentTransactionSchema.pre('save', async function(next) {
  if (!this.transactionNo) {
    try {
      this.transactionNo = await generateSerialNumber('TXN');
    } catch (error) {
      console.error('Error generating transaction number:', error);
      // Fallback
      this.transactionNo = `TXN-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

