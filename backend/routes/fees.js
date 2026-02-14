const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { FeeStructure, Invoice } = require('../models/Fee');
const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { authenticate, authorize } = require('../middleware/auth');

// Fee Structure Routes

// @route   GET /api/fees/structures
// @desc    Get all fee structures
// @access  Private
router.get('/structures', authenticate, async (req, res) => {
  try {
    const { instituteType, courseId } = req.query;
    const query = { isActive: true };
    
    if (instituteType) query.instituteType = instituteType;
    if (courseId) query.courseId = courseId;
    
    const structures = await FeeStructure.find(query)
      .populate('courseId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(structures);
  } catch (error) {
    console.error('Get fee structures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/structures
// @desc    Create fee structure
// @access  Private (Admin)
router.post('/structures', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const structure = await FeeStructure.create(req.body);
    res.status(201).json(structure);
  } catch (error) {
    console.error('Create fee structure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invoice Routes

// @route   GET /api/fees/invoices
// @desc    Get all invoices
// @access  Private
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const query = {};
    
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    
    const invoices = await Invoice.find(query)
      .populate({
        path: 'studentId',
        select: 'srNo personalInfo parentInfo academicInfo',
        populate: {
          path: 'academicInfo.courseId',
          select: 'name'
        }
      })
      .populate('feeStructureId')
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/fees/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/invoices/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('studentId')
      .populate('feeStructureId');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/invoices
// @desc    Create invoice
// @access  Private (Admin)
router.post('/invoices', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const invoiceData = req.body;
    const { collectedBy } = req.body;
    
    // Track who collected the fee (teacher or accountant)
    // Use collectedBy from request, or default to current user
    const collectedById = collectedBy || (req.user && req.user.id ? req.user.id : null);
    if (collectedById && mongoose.Types.ObjectId.isValid(collectedById)) {
      invoiceData.collectedBy = collectedById;
      // Fetch and store the name for quick reference
      try {
        const collectedByUser = await User.findById(collectedById);
        if (collectedByUser) {
          // If it's a teacher, get name from Teacher model
          const teacher = await Teacher.findOne({ userId: collectedById });
          if (teacher && teacher.personalInfo?.fullName) {
            invoiceData.collectedByName = teacher.personalInfo.fullName;
          } else {
            // Build name from user profile
            const firstName = collectedByUser.profile?.firstName || '';
            const lastName = collectedByUser.profile?.lastName || '';
            const fullName = (firstName + ' ' + lastName).trim();
            invoiceData.collectedByName = fullName || collectedByUser.email || 'Unknown';
          }
        } else {
          invoiceData.collectedByName = 'Unknown';
        }
      } catch (nameError) {
        console.error('Error fetching collected by name:', nameError);
        invoiceData.collectedByName = 'Unknown';
      }
    }
    
    // Calculate totals if not provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      if (!invoiceData.subtotal) {
        invoiceData.subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
      }
      if (!invoiceData.totalAmount) {
        invoiceData.totalAmount = invoiceData.subtotal - (invoiceData.discount || 0);
      }
      if (!invoiceData.pendingAmount) {
        invoiceData.pendingAmount = invoiceData.totalAmount - (invoiceData.paidAmount || 0);
      }
    }
    
    const invoice = await Invoice.create(invoiceData);
    
    // Update student fee info
    if (invoice.studentId) {
      const student = await Student.findById(invoice.studentId);
      if (student) {
        // Update total fee if not set
        if (!student.feeInfo.totalFee && invoice.totalAmount) {
          student.feeInfo.totalFee = invoice.totalAmount;
        }
        // Add paid amount
        student.feeInfo.paidFee = (student.feeInfo.paidFee || 0) + (invoice.paidAmount || 0);
        student.calculatePendingFee();
        await student.save();
      }
    }
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('feeStructureId');
    
    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/fees/invoices/:id/pay
// @desc    Record payment
// @access  Private (Admin)
router.put('/invoices/:id/pay', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { paidAmount, paymentMethod, paymentDate, collectedBy } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Track who collected the fee (teacher or accountant)
    const collectedById = collectedBy || (req.user && req.user.id ? req.user.id : null);
    if (collectedById && mongoose.Types.ObjectId.isValid(collectedById)) {
      invoice.collectedBy = collectedById;
      // Fetch and store the name for quick reference
      try {
        const collectedByUser = await User.findById(collectedById);
        if (collectedByUser) {
          // If it's a teacher, get name from Teacher model
          const teacher = await Teacher.findOne({ userId: collectedById });
          if (teacher && teacher.personalInfo?.fullName) {
            invoice.collectedByName = teacher.personalInfo.fullName;
          } else {
            // Build name from user profile
            const firstName = collectedByUser.profile?.firstName || '';
            const lastName = collectedByUser.profile?.lastName || '';
            const fullName = (firstName + ' ' + lastName).trim();
            invoice.collectedByName = fullName || collectedByUser.email || 'Unknown';
          }
        } else {
          invoice.collectedByName = 'Unknown';
        }
      } catch (nameError) {
        console.error('Error fetching collected by name:', nameError);
        invoice.collectedByName = 'Unknown';
      }
    }
    
    invoice.paidAmount += paidAmount;
    invoice.paymentMethod = paymentMethod;
    invoice.paymentDate = paymentDate || new Date();
    await invoice.save();
    
    // Update student fee info
    const student = await Student.findById(invoice.studentId);
    if (student) {
      student.feeInfo.paidFee += paidAmount;
      student.calculatePendingFee();
      await student.save();
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/fees/invoices/:id
// @desc    Delete invoice
// @access  Private (Admin)
router.delete('/invoices/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update student fee info before deleting
    const student = await Student.findById(invoice.studentId);
    if (student) {
      student.feeInfo.paidFee = Math.max(0, (student.feeInfo.paidFee || 0) - (invoice.paidAmount || 0));
      student.calculatePendingFee();
      await student.save();
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

