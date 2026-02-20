const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { FeeStructure, Invoice } = require('../models/Fee');
const PaymentTransaction = require('../models/PaymentTransaction');
const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { authenticate, authorize } = require('../middleware/auth');
const { addCollegeFilter, buildCollegeQuery } = require('../middleware/collegeFilter');

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
// @access  Private (Admin, Accountant)
router.post('/invoices', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
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
// @access  Private (Admin, Accountant)
router.put('/invoices/:id/pay', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
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
    
    // Create payment transaction record
    const transactionData = {
      studentId: invoice.studentId,
      invoiceId: invoice._id,
      amount: paidAmount,
      paymentMethod: paymentMethod,
      paymentDate: paymentDate || new Date(),
      collectedBy: collectedById,
      collectedByName: invoice.collectedByName
    };
    
    const transaction = await PaymentTransaction.create(transactionData);
    
    // Update student fee info
    const student = await Student.findById(invoice.studentId);
    if (student) {
      student.feeInfo.paidFee += paidAmount;
      student.calculatePendingFee();
      await student.save();
    }
    
    res.json({ invoice, transaction });
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

// @route   GET /api/fees/student/:studentId/summary
// @desc    Get comprehensive student fee summary with payment tracking
// @access  Private
router.get('/student/:studentId/summary', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Verify student belongs to user's college
    const studentQuery = buildCollegeQuery(req, { _id: studentId });
    const student = await Student.findOne(studentQuery)
      .populate('userId', 'email')
      .populate('academicInfo.courseId', 'name');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get all invoices for this student
    const invoiceQuery = buildCollegeQuery(req, { studentId });
    const invoices = await Invoice.find(invoiceQuery)
      .populate('feeStructureId')
      .sort({ invoiceDate: -1 });
    
    // Get all payment transactions for this student
    let paymentTransactions = [];
    try {
      const PaymentTransactionModel = require('../models/PaymentTransaction');
      paymentTransactions = await PaymentTransactionModel.find({ studentId })
        .populate('invoiceId', 'invoiceNo dueDate')
        .sort({ paymentDate: -1 });
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
    }
    
    // Calculate totals
    let totalFeeAmount = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let totalOverdueAmount = 0;
    let paidOnTimeCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Process each invoice
    const invoiceDetails = invoices.map(invoice => {
      const invoiceTotal = invoice.totalAmount || 0;
      const invoicePaid = invoice.paidAmount || 0;
      const invoicePending = invoice.pendingAmount || (invoiceTotal - invoicePaid);
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const paymentDate = invoice.paymentDate ? new Date(invoice.paymentDate) : null;
      
      // Determine payment status
      let paymentStatus = 'pending';
      let isOverdue = false;
      let isPaidOnTime = false;
      
      if (invoice.status === 'paid') {
        if (dueDate && paymentDate) {
          if (paymentDate <= dueDate) {
            paymentStatus = 'paid_on_time';
            isPaidOnTime = true;
            paidOnTimeCount++;
          } else {
            paymentStatus = 'paid_late';
            overdueCount++;
          }
        } else {
          paymentStatus = 'paid';
          paidOnTimeCount++;
        }
      } else if (invoice.status === 'partial') {
        paymentStatus = 'partial';
        pendingCount++;
        if (dueDate && today > dueDate) {
          isOverdue = true;
          overdueCount++;
        }
      } else if (invoice.status === 'overdue') {
        paymentStatus = 'overdue';
        isOverdue = true;
        overdueCount++;
      } else {
        paymentStatus = 'pending';
        pendingCount++;
        if (dueDate && today > dueDate) {
          isOverdue = true;
          overdueCount++;
        }
      }
      
      // Get payment transactions for this invoice
      const invoiceTransactions = paymentTransactions.filter(txn => 
        txn.invoiceId?._id?.toString() === invoice._id.toString()
      );
      
      totalFeeAmount += invoiceTotal;
      totalPaidAmount += invoicePaid;
      totalPendingAmount += invoicePending;
      
      if (isOverdue) {
        totalOverdueAmount += invoicePending;
      }
      
      return {
        invoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        paymentDate: invoice.paymentDate,
        totalAmount: invoiceTotal,
        paidAmount: invoicePaid,
        pendingAmount: invoicePending,
        discount: invoice.discount || 0,
        status: invoice.status,
        paymentStatus: paymentStatus,
        isOverdue: isOverdue,
        isPaidOnTime: isPaidOnTime,
        items: invoice.items || [],
        paymentMethod: invoice.paymentMethod,
        collectedByName: invoice.collectedByName,
        transactions: invoiceTransactions.map(txn => ({
          transactionNo: txn.transactionNo,
          amount: txn.amount,
          paymentDate: txn.paymentDate,
          paymentMethod: txn.paymentMethod,
          receiptNo: txn.receiptNo,
          notes: txn.notes
        }))
      };
    });
    
    // Calculate overall payment percentage
    const paymentPercentage = totalFeeAmount > 0 
      ? ((totalPaidAmount / totalFeeAmount) * 100).toFixed(2)
      : 0;
    
    // Determine overall payment status
    let overallStatus = 'complete';
    if (totalPendingAmount > 0) {
      if (totalOverdueAmount > 0) {
        overallStatus = 'overdue';
      } else {
        overallStatus = 'pending';
      }
    }
    
    // Get student's fee info
    const studentTotalFee = student.feeInfo?.totalFee || 0;
    const studentPaidFee = student.feeInfo?.paidFee || 0;
    const studentPendingFee = student.feeInfo?.pendingFee || (studentTotalFee - studentPaidFee);
    
    // Use student's fee info if available, otherwise use calculated totals
    const finalTotalFee = studentTotalFee > 0 ? studentTotalFee : totalFeeAmount;
    const finalPaidFee = studentPaidFee > 0 ? studentPaidFee : totalPaidAmount;
    const finalPendingFee = studentPendingFee > 0 ? studentPendingFee : totalPendingAmount;
    
    res.json({
      studentId: student._id,
      studentName: student.personalInfo?.fullName,
      studentSrNo: student.srNo,
      admissionNo: student.admissionNo,
      course: student.academicInfo?.courseId?.name || 'N/A',
      summary: {
        totalFeeAmount: finalTotalFee,
        totalPaidAmount: finalPaidFee,
        totalPendingAmount: finalPendingFee,
        totalOverdueAmount: totalOverdueAmount,
        paymentPercentage: paymentPercentage,
        overallStatus: overallStatus
      },
      paymentStatus: {
        paidOnTime: paidOnTimeCount,
        overdue: overdueCount,
        pending: pendingCount,
        totalInvoices: invoices.length
      },
      invoices: invoiceDetails,
      confirmation: {
        totalPaidOverall: finalPaidFee,
        totalDueOverall: finalPendingFee,
        totalFeeOverall: finalTotalFee,
        lastPaymentDate: paymentTransactions.length > 0 
          ? paymentTransactions[0].paymentDate 
          : null,
        paymentCount: paymentTransactions.length
      }
    });
  } catch (error) {
    console.error('Get student fee summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

