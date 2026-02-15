const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const { Invoice } = require('../models/Fee');
const PaymentTransaction = require('../models/PaymentTransaction');
const MonthlyPayment = require('../models/MonthlyPayment');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require accountant role
router.use(authenticate);
router.use(authorize('accountant'));

// @route   GET /api/accountant/dashboard
// @desc    Get accountant dashboard stats
// @access  Private (Accountant)
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Total students
    const totalStudents = await Student.countDocuments({ 'academicInfo.status': 'active' });

    // Today's admissions
    const todayAdmissions = await Student.countDocuments({
      'academicInfo.admissionDate': {
        $gte: todayStart,
        $lte: todayEnd
      },
      'academicInfo.admittedBy': req.user._id
    });

    // Total fees collected (all time)
    const allInvoices = await Invoice.find({});
    const totalFeesCollected = allInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Pending fees
    const allStudents = await Student.find({ 'academicInfo.status': 'active' });
    const pendingFees = allStudents.reduce((sum, student) => {
      const pending = (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

    // This month's collections
    const thisMonthPayments = await MonthlyPayment.find({
      paymentDate: {
        $gte: currentMonthStart,
        $lte: currentMonthEnd
      }
    });
    const thisMonthCollections = thisMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Students with pending fees
    const studentsWithPendingFees = allStudents.filter(student => {
      const pending = (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0);
      return pending > 0;
    }).length;

    res.json({
      students: totalStudents,
      todayAdmissions,
      totalFeesCollected,
      pendingFees,
      thisMonthCollections,
      studentsWithPendingFees
    });
  } catch (error) {
    console.error('Accountant dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/accountant/admissions/:studentId/link-fees
// @desc    Link admission to fee structure and create initial invoice
// @access  Private (Accountant)
router.post('/admissions/:studentId/link-fees', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { feeStructureId, totalAmount, admissionFee, monthlyFee } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student fee info
    if (totalAmount) {
      student.feeInfo.totalFee = totalAmount;
    }
    if (feeStructureId) {
      student.feeInfo.feeStructureId = feeStructureId;
    }
    student.calculatePendingFee();
    await student.save();

    // Create initial invoice if not exists
    const existingInvoice = await Invoice.findOne({ studentId: studentId });
    if (!existingInvoice && totalAmount) {
      const invoiceData = {
        studentId: studentId,
        feeStructureId: feeStructureId || null,
        invoiceDate: new Date(),
        items: [
          ...(admissionFee ? [{ description: 'Admission Fee', amount: admissionFee, quantity: 1 }] : []),
          ...(monthlyFee ? [{ description: 'Monthly Fee', amount: monthlyFee, quantity: 1 }] : [])
        ],
        totalAmount: totalAmount,
        paidAmount: student.feeInfo.paidFee || 0,
        collectedBy: req.user._id,
        collectedByName: req.user.profile?.firstName && req.user.profile?.lastName 
          ? `${req.user.profile.firstName} ${req.user.profile.lastName}`.trim()
          : req.user.email
      };

      const invoice = await Invoice.create(invoiceData);
      
      // Update invoice pending amount
      invoice.pendingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
      await invoice.save();

      res.json({ 
        message: 'Admission linked to fees successfully',
        student,
        invoice
      });
    } else {
      res.json({ 
        message: 'Student fee info updated successfully',
        student
      });
    }
  } catch (error) {
    console.error('Link fees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/accountant/monthly-payments
// @desc    Record monthly payment for a student
// @access  Private (Accountant)
router.post('/monthly-payments', async (req, res) => {
  try {
    const { studentId, month, year, amount, paymentMethod, paymentDate, notes, receiptNo, invoiceId } = req.body;

    if (!studentId || !month || !year || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if payment for this month already exists
    const existingPayment = await MonthlyPayment.findOne({
      studentId,
      month: parseInt(month),
      year: parseInt(year),
      isMonthlyFee: true
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment for this month already recorded' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create monthly payment record
    const monthlyPaymentData = {
      studentId,
      month: parseInt(month),
      year: parseInt(year),
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      collectedBy: req.user._id,
      collectedByName: req.user.profile?.firstName && req.user.profile?.lastName 
        ? `${req.user.profile.firstName} ${req.user.profile.lastName}`.trim()
        : req.user.email,
      notes,
      receiptNo,
      isMonthlyFee: true,
      invoiceId: invoiceId || null
    };

    const monthlyPayment = await MonthlyPayment.create(monthlyPaymentData);

    // Create or update invoice
    let invoice = invoiceId ? await Invoice.findById(invoiceId) : await Invoice.findOne({ studentId });
    
    if (!invoice) {
      // Create new invoice if doesn't exist
      invoice = await Invoice.create({
        studentId,
        invoiceDate: new Date(),
        items: [{
          description: `Monthly Fee - ${new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
          amount: parseFloat(amount),
          quantity: 1
        }],
        totalAmount: parseFloat(amount),
        paidAmount: parseFloat(amount),
        collectedBy: req.user._id,
        collectedByName: monthlyPaymentData.collectedByName
      });
    } else {
      // Update existing invoice
      invoice.paidAmount = (invoice.paidAmount || 0) + parseFloat(amount);
      invoice.paymentDate = paymentDate || new Date();
      invoice.paymentMethod = paymentMethod;
      invoice.collectedBy = req.user._id;
      invoice.collectedByName = monthlyPaymentData.collectedByName;
      
      // Add item if not exists
      const monthItem = invoice.items.find(item => 
        item.description.includes(new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }))
      );
      if (!monthItem) {
        invoice.items.push({
          description: `Monthly Fee - ${new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
          amount: parseFloat(amount),
          quantity: 1
        });
        invoice.totalAmount = (invoice.totalAmount || 0) + parseFloat(amount);
      }
      
      await invoice.save();
    }

    // Create payment transaction
    const transactionData = {
      studentId,
      invoiceId: invoice._id,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      collectedBy: req.user._id,
      collectedByName: monthlyPaymentData.collectedByName,
      notes,
      receiptNo
    };

    const transaction = await PaymentTransaction.create(transactionData);

    // Update monthly payment with transaction ID
    monthlyPayment.transactionId = transaction._id;
    await monthlyPayment.save();

    // Update student fee info
    student.feeInfo.paidFee = (student.feeInfo.paidFee || 0) + parseFloat(amount);
    student.calculatePendingFee();
    await student.save();

    res.status(201).json({
      message: 'Monthly payment recorded successfully',
      monthlyPayment,
      transaction,
      invoice,
      student
    });
  } catch (error) {
    console.error('Record monthly payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/accountant/monthly-payments
// @desc    Get monthly payments with filters
// @access  Private (Accountant)
router.get('/monthly-payments', async (req, res) => {
  try {
    const { studentId, month, year, startDate, endDate } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await MonthlyPayment.find(query)
      .populate('studentId', 'srNo personalInfo.fullName academicInfo.courseId')
      .populate('invoiceId', 'invoiceNo')
      .populate('transactionId', 'transactionNo')
      .sort({ paymentDate: -1, year: -1, month: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get monthly payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/accountant/correct-error
// @desc    Correct errors in admission or fee records
// @access  Private (Accountant)
router.put('/correct-error', async (req, res) => {
  try {
    const { type, studentId, corrections } = req.body;

    if (!type || !studentId || !corrections) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let updatedData = {};

    if (type === 'admission') {
      // Correct admission data
      if (corrections.personalInfo) {
        student.personalInfo = { ...student.personalInfo, ...corrections.personalInfo };
      }
      if (corrections.contactInfo) {
        student.contactInfo = { ...student.contactInfo, ...corrections.contactInfo };
      }
      if (corrections.parentInfo) {
        student.parentInfo = { ...student.parentInfo, ...corrections.parentInfo };
      }
      if (corrections.academicInfo) {
        student.academicInfo = { ...student.academicInfo, ...corrections.academicInfo };
      }
    } else if (type === 'fee') {
      // Correct fee data
      if (corrections.totalFee !== undefined) {
        student.feeInfo.totalFee = corrections.totalFee;
      }
      if (corrections.paidFee !== undefined) {
        student.feeInfo.paidFee = corrections.paidFee;
      }
      if (corrections.feeStructureId) {
        student.feeInfo.feeStructureId = corrections.feeStructureId;
      }
      student.calculatePendingFee();
    }

    await student.save();

    res.json({
      message: 'Error corrected successfully',
      student
    });
  } catch (error) {
    console.error('Correct error error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/accountant/students/:id/payment-history
// @desc    Get complete payment history for a student including monthly payments
// @access  Private (Accountant)
router.get('/students/:id/payment-history', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .populate('academicInfo.courseId', 'name')
      .populate('feeInfo.feeStructureId');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all invoices
    const invoices = await Invoice.find({ studentId: id })
      .populate('feeStructureId')
      .sort({ createdAt: -1 });

    // Get all monthly payments
    const monthlyPayments = await MonthlyPayment.find({ studentId: id })
      .populate('invoiceId', 'invoiceNo')
      .populate('transactionId', 'transactionNo')
      .sort({ year: -1, month: -1, paymentDate: -1 });

    // Get all payment transactions
    const transactions = await PaymentTransaction.find({ studentId: id })
      .populate('invoiceId', 'invoiceNo')
      .sort({ paymentDate: -1 });

    res.json({
      student,
      invoices,
      monthlyPayments,
      transactions,
      summary: {
        totalFee: student.feeInfo?.totalFee || 0,
        paidFee: student.feeInfo?.paidFee || 0,
        pendingFee: student.feeInfo?.pendingFee || 0,
        totalMonthlyPayments: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalTransactions: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

