const mongoose = require('mongoose');
const { generateSerialNumber } = require('../utils/autoSerialNumber');

const feeStructureSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true
  },
  instituteType: {
    type: String,
    enum: ['school', 'college', 'academy', 'short_course'],
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  feeComponents: [{
    name: String,
    amount: Number,
    frequency: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    }
  }],
  totalAmount: Number,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate total amount
feeStructureSchema.pre('save', function(next) {
  if (this.feeComponents && this.feeComponents.length > 0) {
    this.totalAmount = this.feeComponents.reduce((sum, component) => sum + component.amount, 0);
  }
  next();
});

// Generate SR No before saving
feeStructureSchema.pre('save', async function(next) {
  if (!this.srNo) {
    this.srNo = await generateSerialNumber('FEE');
  }
  next();
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String
  },
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
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  items: [{
    description: String,
    amount: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  subtotal: Number,
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'cheque']
  },
  paymentDate: Date,
  notes: String,
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be Teacher or Accountant
    required: false
  },
  collectedByName: {
    type: String // Store name for quick reference
  }
}, {
  timestamps: true
});

// Generate Invoice No before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNo) {
    this.invoiceNo = await generateSerialNumber('INV');
  }
  next();
});

// Calculate amounts and update status
invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    this.totalAmount = this.subtotal - (this.discount || 0);
    this.pendingAmount = this.totalAmount - (this.paidAmount || 0);
  }
  
  // Update status based on payment and due date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.pendingAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    // Check if partial payment is overdue
    if (this.dueDate && new Date(this.dueDate) < today) {
      this.status = 'overdue';
    } else {
      this.status = 'partial';
    }
  } else {
    // No payment made - check if overdue
    if (this.dueDate && new Date(this.dueDate) < today) {
      this.status = 'overdue';
    } else {
      this.status = 'pending';
    }
  }
  
  next();
});

// Compound index to ensure invoiceNo is unique per college
invoiceSchema.index({ invoiceNo: 1, collegeId: 1 }, { unique: true, sparse: true });

module.exports = {
  FeeStructure: mongoose.model('FeeStructure', feeStructureSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema)
};

