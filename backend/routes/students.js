const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Counter = require('../models/Counter');
const { Invoice } = require('../models/Fee');
let PaymentTransaction;
try {
  PaymentTransaction = require('../models/PaymentTransaction');
} catch (err) {
  console.warn('PaymentTransaction model not found, continuing without it');
  PaymentTransaction = null;
}
const { authenticate, authorize } = require('../middleware/auth');
const { addCollegeFilter, requireCollegeId, buildCollegeQuery } = require('../middleware/collegeFilter');
const { notifyStudentCreated, notifyStudentDeleted } = require('../utils/notifications');
const { getCurrentSerialNumber } = require('../utils/autoSerialNumber');

// @route   GET /api/students
// @desc    Get all students (filtered by college)
// @access  Private
router.get('/', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { instituteType, status, courseId } = req.query;
    const query = buildCollegeQuery(req);
    
    if (instituteType) query['academicInfo.instituteType'] = instituteType;
    if (status) query['academicInfo.status'] = status;
    if (courseId) query['academicInfo.courseId'] = courseId;
    
    const students = await Student.find(query)
      .populate('userId', 'email profile')
      .populate({
        path: 'academicInfo.courseId',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/next-serial
// @desc    Get next serial number for student admission
// @access  Private
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get('/next-serial', authenticate, async (req, res) => {
  try {
    // Get the next serial number using the Counter model
    const counter = await Counter.findOne({ prefix: 'STU' });
    
    let nextNumber = 1;
    if (counter) {
      nextNumber = counter.count + 1;
    } else {
      // If no counter exists, create one starting at 1
      await Counter.create({ prefix: 'STU', count: 0 });
    }
    
    // Format: STU-0001
    const nextSerial = `STU-${String(nextNumber).padStart(4, '0')}`;
    
    res.json({
      nextSerial: nextSerial,
      nextNumber: nextNumber,
      prefix: 'STU'
    });
  } catch (error) {
    console.error('Error fetching next serial:', error);
    // Return a fallback value
    res.json({
      nextSerial: 'STU-0001',
      nextNumber: 1,
      prefix: 'STU'
    });
  }
});

// @route   GET /api/students/:id/history
// @desc    Get student complete history including payment installments
// @access  Private
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get('/:id/history', authenticate, addCollegeFilter, async (req, res) => {
  try {
    console.log('=== ✅ HISTORY ROUTE HIT ===');
    console.log('Request params:', req.params);
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request originalUrl:', req.originalUrl);
    console.log('History route hit for student ID:', req.params.id);
    console.log('Authenticated user:', req.user?.email || 'N/A');
    
    // Build query with college filter
    const query = buildCollegeQuery(req);
    
    // Try to find student by ObjectId first, then fallback to srNo
    let student = null;
    
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // Try finding by ObjectId with college filter
      query._id = req.params.id;
      student = await Student.findOne(query)
        .populate('userId', 'email profile')
        .populate({
          path: 'academicInfo.courseId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .populate('feeInfo.feeStructureId');
    }
    
    // If not found by ObjectId, try finding by serial number with college filter
    if (!student) {
      console.log('Student not found by ObjectId, trying to find by srNo:', req.params.id);
      const srNoQuery = buildCollegeQuery(req, { srNo: req.params.id });
      student = await Student.findOne(srNoQuery)
        .populate('userId', 'email profile')
        .populate({
          path: 'academicInfo.courseId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .populate('feeInfo.feeStructureId');
    }
    
    // If still not found, try by admissionNo
    if (!student) {
      console.log('Student not found by srNo, trying to find by admissionNo:', req.params.id);
      student = await Student.findOne({ admissionNo: req.params.id })
        .populate('userId', 'email profile')
        .populate({
          path: 'academicInfo.courseId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .populate('feeInfo.feeStructureId');
    }
    
    if (!student) {
      console.error('❌ Student not found with ID, SR No, or Admission No:', req.params.id);
      console.error('   Attempted searches:');
      console.error('   - ObjectId:', mongoose.Types.ObjectId.isValid(req.params.id) ? 'Valid format' : 'Invalid format');
      console.error('   - Serial Number:', req.params.id);
      console.error('   - Admission Number:', req.params.id);
      
      // Try one more time with a case-insensitive search
      try {
        student = await Student.findOne({ 
          $or: [
            { srNo: { $regex: new RegExp(`^${req.params.id}$`, 'i') } },
            { admissionNo: { $regex: new RegExp(`^${req.params.id}$`, 'i') } }
          ]
        })
        .populate('userId', 'email profile')
        .populate({
          path: 'academicInfo.courseId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .populate('feeInfo.feeStructureId');
        
        if (student) {
          console.log('✅ Student found with case-insensitive search:', student.srNo || student._id);
        }
      } catch (caseError) {
        console.error('Error in case-insensitive search:', caseError);
      }
      
      if (!student) {
        return res.status(404).json({ 
          message: 'Student not found. Please check if the student exists.',
          student: null,
          paymentHistory: [],
          paymentInstallments: [],
          monthlyBreakdown: [],
          summary: {
            totalFee: 0,
            totalPaid: 0,
            pendingFee: 0,
            totalInvoices: 0,
            totalTransactions: 0,
            paidInvoices: 0,
            partialInvoices: 0,
            pendingInvoices: 0
          }
        });
      }
    }
    
    console.log('✅ Student found:', student.srNo || student._id, '| Name:', student.personalInfo?.fullName || 'N/A');

    // Get all invoices for this student (use student._id, not req.params.id) with college filter
    let invoices = [];
    try {
      const invoiceQuery = { studentId: student._id };
      if (req.collegeId) {
        invoiceQuery.collegeId = req.collegeId;
      }
      invoices = await Invoice.find(invoiceQuery)
        .populate('feeStructureId')
        .sort({ createdAt: -1 });
    } catch (invoiceError) {
      console.error('Error fetching invoices:', invoiceError);
      invoices = [];
    }

    // Get all payment transactions for this student (individual installments)
    let paymentTransactions = [];
    if (PaymentTransaction) {
      try {
        paymentTransactions = await PaymentTransaction.find({ studentId: student._id })
          .populate('invoiceId', 'invoiceNo')
          .sort({ paymentDate: -1, createdAt: -1 });
      } catch (txnError) {
        console.error('Error fetching payment transactions:', txnError);
        // Continue without transactions if there's an error
        paymentTransactions = [];
      }
    }

    // Calculate payment summary
    const totalFee = student.feeInfo?.totalFee || 0;
    const totalPaid = student.feeInfo?.paidFee || 0;
    const pendingFee = student.feeInfo?.pendingFee || (totalFee - totalPaid);

    // Prepare payment history from invoices with transaction details
    const paymentHistory = (invoices || []).map(invoice => {
      // Get all transactions for this invoice
      const invoiceTransactions = (paymentTransactions || []).filter(
        txn => {
          const txnInvoiceId = txn.invoiceId?._id?.toString() || txn.invoiceId?.toString();
          return txnInvoiceId === invoice._id.toString();
        }
      );

      return {
        invoiceNo: invoice.invoiceNo || 'N/A',
        invoiceDate: invoice.invoiceDate || invoice.createdAt,
        totalAmount: invoice.totalAmount || 0,
        paidAmount: invoice.paidAmount || 0,
        pendingAmount: invoice.pendingAmount || (invoice.totalAmount || 0) - (invoice.paidAmount || 0),
        status: invoice.status || 'pending',
        collectedByName: invoice.collectedByName || student.academicInfo?.admittedByName || 'N/A',
        items: invoice.items || [],
        discount: invoice.discount || 0,
        notes: invoice.notes || '',
        paymentMethod: invoice.paymentMethod || 'N/A',
        paymentDate: invoice.paymentDate || invoice.invoiceDate || invoice.createdAt,
        feeStructureId: invoice.feeStructureId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        transactions: invoiceTransactions.map(txn => ({
          transactionNo: txn.transactionNo || 'N/A',
          amount: txn.amount || 0,
          paymentMethod: txn.paymentMethod || 'N/A',
          paymentDate: txn.paymentDate || txn.createdAt,
          collectedByName: txn.collectedByName || 'N/A',
          notes: txn.notes || '',
          receiptNo: txn.receiptNo || '',
          createdAt: txn.createdAt
        }))
      };
    });

    // Prepare all payment installments (flattened from transactions)
    const allPaymentInstallments = (paymentTransactions || []).map(txn => ({
      transactionNo: txn.transactionNo || 'N/A',
      invoiceNo: txn.invoiceId?.invoiceNo || txn.invoiceId || 'N/A',
      amount: txn.amount || 0,
      paymentMethod: txn.paymentMethod || 'N/A',
      paymentDate: txn.paymentDate || txn.createdAt,
      collectedByName: txn.collectedByName || 'N/A',
      notes: txn.notes || '',
      receiptNo: txn.receiptNo || '',
      createdAt: txn.createdAt
    }));

    // Group payments by month
    const monthlyPayments = {};
    allPaymentInstallments.forEach(txn => {
      const paymentDate = txn.paymentDate ? new Date(txn.paymentDate) : new Date(txn.createdAt);
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = paymentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthlyPayments[monthKey]) {
        monthlyPayments[monthKey] = {
          month: monthName,
          monthKey: monthKey,
          year: paymentDate.getFullYear(),
          monthNumber: paymentDate.getMonth() + 1,
          totalAmount: 0,
          transactions: []
        };
      }
      
      monthlyPayments[monthKey].totalAmount += txn.amount || 0;
      monthlyPayments[monthKey].transactions.push(txn);
    });

    // Convert to array and sort by date (newest first)
    const monthlyBreakdown = Object.values(monthlyPayments).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });

    const responseData = {
      student,
      paymentHistory,
      paymentInstallments: allPaymentInstallments,
      monthlyBreakdown: monthlyBreakdown,
      summary: {
        totalFee,
        totalPaid,
        pendingFee,
        totalInvoices: (invoices || []).length,
        totalTransactions: (paymentTransactions || []).length,
        paidInvoices: (invoices || []).filter(inv => inv.status === 'paid').length,
        partialInvoices: (invoices || []).filter(inv => inv.status === 'partial').length,
        pendingInvoices: (invoices || []).filter(inv => inv.status === 'pending').length
      }
    };
    
    console.log('=== ✅ SENDING SUCCESSFUL RESPONSE ===');
    console.log('Student:', student?.srNo || student?._id);
    console.log('Student Name:', student?.personalInfo?.fullName || 'N/A');
    console.log('Invoices:', paymentHistory.length);
    console.log('Transactions:', allPaymentInstallments.length);
    console.log('Monthly Breakdown:', monthlyBreakdown.length, 'months');
    console.log('Total Fee:', totalFee, '| Paid:', totalPaid, '| Pending:', pendingFee);
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Get student history error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request params:', req.params);
    console.error('Request ID:', req.params.id);
    
    // Try to return at least the student if we can find it, even if other data fails
    try {
      let fallbackStudent = null;
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        fallbackStudent = await Student.findById(req.params.id)
          .populate('userId', 'email profile')
          .populate({
            path: 'academicInfo.courseId',
            select: 'name categoryId',
            populate: {
              path: 'categoryId',
              select: 'name'
            }
          })
          .populate('feeInfo.feeStructureId');
      }
      
      if (!fallbackStudent) {
        fallbackStudent = await Student.findOne({ srNo: req.params.id })
          .populate('userId', 'email profile')
          .populate({
            path: 'academicInfo.courseId',
            select: 'name categoryId',
            populate: {
              path: 'categoryId',
              select: 'name'
            }
          })
          .populate('feeInfo.feeStructureId');
      }
      
      if (fallbackStudent) {
        console.log('⚠️ Returning fallback student data due to error');
        const fallbackTotalFee = fallbackStudent.feeInfo?.totalFee || 0;
        const fallbackTotalPaid = fallbackStudent.feeInfo?.paidFee || 0;
        const fallbackPendingFee = fallbackStudent.feeInfo?.pendingFee || (fallbackTotalFee - fallbackTotalPaid);
        
        return res.json({
          student: fallbackStudent,
          paymentHistory: [],
          paymentInstallments: [],
          monthlyBreakdown: [],
          summary: {
            totalFee: fallbackTotalFee,
            totalPaid: fallbackTotalPaid,
            pendingFee: fallbackPendingFee,
            totalInvoices: 0,
            totalTransactions: 0,
            paidInvoices: 0,
            partialInvoices: 0,
            pendingInvoices: 0
          },
          error: error.message,
          warning: 'Some data could not be loaded, but student information is available'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback student fetch also failed:', fallbackError);
    }
    
    res.status(500).json({ 
      message: 'Server error while fetching student history', 
      error: error.message,
      student: null,
      paymentHistory: [],
      paymentInstallments: [],
      monthlyBreakdown: [],
      summary: {
        totalFee: 0,
        totalPaid: 0,
        pendingFee: 0,
        totalInvoices: 0,
        totalTransactions: 0,
        paidInvoices: 0,
        partialInvoices: 0,
        pendingInvoices: 0
      }
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', authenticate, addCollegeFilter, async (req, res) => {
  try {
    console.log('🔍 Fetching student:', req.params.id);
    console.log('   User collegeId:', req.collegeId || 'null');
    console.log('   User role:', req.user?.role);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Build query - try to find student by ID first, then check college access
    let query = { _id: req.params.id };
    
    const student = await Student.findOne(query)
      .populate('userId', 'email profile')
      .populate('academicInfo.courseId', 'name')
      .populate('feeInfo.feeStructureId');
    
    if (!student) {
      console.log('❌ Student not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Student found:', student.personalInfo?.fullName || 'N/A');
    console.log('   Student collegeId:', student.collegeId || 'null');
    
    // Check college access
    // If user has collegeId, student must have same collegeId (or no collegeId for backward compatibility)
    // If user doesn't have collegeId, allow access to students without collegeId
    if (req.collegeId) {
      // User has collegeId - check if student matches
      if (student.collegeId && student.collegeId.toString() !== req.collegeId.toString()) {
        console.log('❌ College mismatch - Access denied');
        return res.status(403).json({ message: 'Access denied' });
      }
      // Allow access if student has no collegeId (backward compatibility)
    } else {
      // User doesn't have collegeId - only allow access to students without collegeId
      if (student.collegeId) {
        console.log('❌ User has no collegeId but student has collegeId - Access denied');
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    console.log('✅ Access granted, returning student data');
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin, Accountant)
router.post('/', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
  // Add timeout to prevent hanging requests
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ message: 'Request timeout - operation took too long' });
    }
  }, 25000); // 25 second timeout

  try {
    // Validate request body exists
    if (!req.body) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Request body is required' });
    }

    const { email, password, personalInfo, contactInfo, parentInfo, academicInfo, feeInfo, classId, admittedBy } = req.body;
    
    // Validate required fields
    if (!email) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!personalInfo || !personalInfo.fullName) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Student full name is required' });
    }
    
    if (!personalInfo.dateOfBirth) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Date of birth is required' });
    }
    
    if (!personalInfo.gender) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Gender is required' });
    }
    
    if (!academicInfo || !academicInfo.instituteType) {
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Institute type is required' });
    }
    
    // Handle classId -> courseId conversion (if classId is provided)
    if (classId && academicInfo) {
      // If classId is provided but not a valid ObjectId, ignore it
      if (mongoose.Types.ObjectId.isValid(classId)) {
        academicInfo.courseId = classId;
      } else if (classId !== 'dit' && classId !== '') {
        // Only warn if it's not empty or 'dit'
        console.warn(`Invalid classId provided: ${classId}, ignoring...`);
      }
    }
    
    // Validate and clean courseId if provided
    if (academicInfo.courseId) {
      // If courseId is empty string, set to undefined
      if (academicInfo.courseId === '' || academicInfo.courseId === null) {
        academicInfo.courseId = undefined;
      } else if (!mongoose.Types.ObjectId.isValid(academicInfo.courseId)) {
        clearTimeout(timeout);
        return res.status(400).json({ message: 'Invalid course ID format' });
      }
    }
    
    // Ensure dateOfBirth is a Date object before creating user
    let dateOfBirthDate;
    if (personalInfo.dateOfBirth) {
      if (typeof personalInfo.dateOfBirth === 'string') {
        dateOfBirthDate = new Date(personalInfo.dateOfBirth);
      } else {
        dateOfBirthDate = personalInfo.dateOfBirth;
      }
    }
    
    // Get collegeId from authenticated user
    // Allow admins/accountants without collegeId for backward compatibility
    const collegeId = req.collegeId || req.body.collegeId || null;
    
    // Only require collegeId for super_admin if explicitly provided
    // For regular admins/accountants, allow null collegeId (backward compatibility)
    
    // Check if email already exists in this college (or globally if no collegeId)
    const emailQuery = { email: email.toLowerCase().trim() };
    if (collegeId) {
      emailQuery.collegeId = collegeId;
    } else {
      // For backward compatibility, check if email exists without collegeId
      emailQuery.$or = [
        { collegeId: { $exists: false } },
        { collegeId: null }
      ];
    }
    const existingUser = await User.findOne(emailQuery);
    if (existingUser) {
      clearTimeout(timeout);
      return res.status(400).json({ 
        message: 'User with this email already exists in this college',
        email: email,
        suggestion: 'Please use a different email address or check if this student already exists in the system'
      });
    }
    
    // Create user account
    let user;
    try {
      user = await User.create({
        email: email.toLowerCase().trim(),
        password: password || 'password123', // Default password, should be changed
        role: 'student',
        collegeId: collegeId,
        profile: {
          firstName: personalInfo.fullName.split(' ')[0] || personalInfo.fullName,
          lastName: personalInfo.fullName.split(' ').slice(1).join(' ') || '',
          phone: contactInfo?.phone || '',
          dateOfBirth: dateOfBirthDate,
          gender: personalInfo.gender
        }
      });
    } catch (userError) {
      console.error('Error creating user:', userError);
      if (userError.code === 11000) {
        clearTimeout(timeout);
        return res.status(400).json({ 
          message: 'User with this email already exists',
          email: email,
          suggestion: 'Please use a different email address'
        });
      }
      throw userError; // Re-throw to be caught by outer catch
    }
    
    // Prepare student data - ensure all required fields are present and clean
    const studentData = {
      userId: user._id,
      collegeId: collegeId,
      personalInfo: {
        fullName: personalInfo.fullName.trim(),
        dateOfBirth: dateOfBirthDate,
        gender: personalInfo.gender
      }
    };
    
    // Add optional personal info fields only if they have values
    if (personalInfo.photo && personalInfo.photo.trim()) {
      studentData.personalInfo.photo = personalInfo.photo.trim();
    }
    if (personalInfo.bloodGroup && personalInfo.bloodGroup.trim()) {
      studentData.personalInfo.bloodGroup = personalInfo.bloodGroup.trim();
    }
    if (personalInfo.nationality && personalInfo.nationality.trim()) {
      studentData.personalInfo.nationality = personalInfo.nationality.trim();
    }
    
    // Contact info - clean empty strings
    studentData.contactInfo = {};
    if (contactInfo) {
      if (contactInfo.phone && contactInfo.phone.trim()) {
        studentData.contactInfo.phone = contactInfo.phone.trim();
      }
      if (contactInfo.email && contactInfo.email.trim()) {
        studentData.contactInfo.email = contactInfo.email.trim();
      }
      if (contactInfo.address) {
        studentData.contactInfo.address = {};
        Object.keys(contactInfo.address).forEach(key => {
          if (contactInfo.address[key] && contactInfo.address[key].trim()) {
            studentData.contactInfo.address[key] = contactInfo.address[key].trim();
          }
        });
      }
    }
    
    // Parent info - clean empty strings
    studentData.parentInfo = {};
    if (parentInfo) {
      Object.keys(parentInfo).forEach(key => {
        if (parentInfo[key] && parentInfo[key].trim && parentInfo[key].trim()) {
          studentData.parentInfo[key] = parentInfo[key].trim();
        } else if (parentInfo[key] && !parentInfo[key].trim) {
          studentData.parentInfo[key] = parentInfo[key];
        }
      });
    }
    
    // Academic info
    studentData.academicInfo = {
      instituteType: academicInfo.instituteType,
      admissionDate: academicInfo.admissionDate ? new Date(academicInfo.admissionDate) : new Date(),
      status: academicInfo.status || 'active'
    };
    
    // Only add courseId if it's a valid ObjectId
    if (academicInfo.courseId && 
        academicInfo.courseId !== '' && 
        mongoose.Types.ObjectId.isValid(academicInfo.courseId)) {
      studentData.academicInfo.courseId = academicInfo.courseId;
    }
    
    // Only add session if it has a value
    if (academicInfo.session && academicInfo.session.trim()) {
      studentData.academicInfo.session = academicInfo.session.trim();
    }
    
    // Track who admitted the student (teacher or accountant)
    // Use admittedBy from request, or default to current user
    const admittedById = admittedBy || (req.user && req.user.id ? req.user.id : null);
    if (admittedById && mongoose.Types.ObjectId.isValid(admittedById)) {
      studentData.academicInfo.admittedBy = admittedById;
      // Fetch and store the name for quick reference
      try {
        const admittedByUser = await User.findById(admittedById);
        if (admittedByUser) {
          // If it's a teacher, get name from Teacher model
          const teacher = await Teacher.findOne({ userId: admittedById });
          if (teacher && teacher.personalInfo?.fullName) {
            studentData.academicInfo.admittedByName = teacher.personalInfo.fullName;
          } else {
            // Build name from user profile
            const firstName = admittedByUser.profile?.firstName || '';
            const lastName = admittedByUser.profile?.lastName || '';
            const fullName = (firstName + ' ' + lastName).trim();
            studentData.academicInfo.admittedByName = fullName || admittedByUser.email || 'Unknown';
          }
        } else {
          studentData.academicInfo.admittedByName = 'Unknown';
        }
      } catch (nameError) {
        console.error('Error fetching admitted by name:', nameError);
        studentData.academicInfo.admittedByName = 'Unknown';
      }
    }
    
    // Fee info
    studentData.feeInfo = {
      totalFee: feeInfo?.totalFee ? parseFloat(feeInfo.totalFee) : 0,
      paidFee: feeInfo?.paidFee ? parseFloat(feeInfo.paidFee) : 0,
      pendingFee: 0
    };
    
    // Only add feeStructureId if it's a valid ObjectId
    if (feeInfo?.feeStructureId && 
        feeInfo.feeStructureId !== '' && 
        mongoose.Types.ObjectId.isValid(feeInfo.feeStructureId)) {
      studentData.feeInfo.feeStructureId = feeInfo.feeStructureId;
    }
    
    // Create student record
    let student;
    try {
      student = await Student.create(studentData);
    } catch (studentError) {
      console.error('Error creating student:', studentError);
      // If student creation fails, try to delete the user we just created
      try {
        await User.findByIdAndDelete(user._id);
      } catch (deleteError) {
        console.error('Error deleting user after student creation failure:', deleteError);
      }
      throw studentError; // Re-throw to be caught by outer catch
    }
    
    // Calculate pending fee
    try {
      student.calculatePendingFee();
      await student.save();
    } catch (calcError) {
      console.error('Error calculating pending fee:', calcError);
      // Continue even if calculation fails
    }
    
    // Populate student data
    let populatedStudent;
    try {
      populatedStudent = await Student.findById(student._id)
        .populate('userId', 'email')
        .populate({
          path: 'academicInfo.courseId',
          select: 'name',
          strictPopulate: false
        });
    } catch (populateError) {
      console.error('Error populating student:', populateError);
      // Return student without population if populate fails
      populatedStudent = student;
    }
    
    // Create notification for new student admission (non-blocking)
    // Don't let notification errors block the response
    try {
      await notifyStudentCreated(populatedStudent, req.user.id);
    } catch (notifErr) {
      console.error('Failed to create notification (non-critical):', notifErr.message);
      // Continue - notification failure shouldn't prevent student creation
    }
    
    // Log new entry
    console.log(`✅ New Student Admitted: ${populatedStudent.personalInfo?.fullName || 'N/A'} (${populatedStudent.srNo || 'N/A'}) - Email: ${email} - Created by: ${req.user?.email || 'System'}`);
    
    // Clear timeout on success
    clearTimeout(timeout);
    
    // Return response with proper structure (maintain backward compatibility)
    res.status(201).json(populatedStudent);
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeout);
    
    console.error('Create student error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors,
        details: error.message 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ 
        message: `A record with this ${field} already exists`,
        field: field
      });
    }
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoServerError' || error.message?.includes('Mongo')) {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Server error while creating student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private
router.put('/:id', authenticate, addCollegeFilter, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Build query with college filter
    const query = buildCollegeQuery(req, { _id: req.params.id });

    // Students can only update their own profile
    if (req.user.role === 'student') {
      query.userId = req.user.id;
      const student = await Student.findOne(query);
      if (!student) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Verify student belongs to user's college before updating
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (req.collegeId && existingStudent.collegeId.toString() !== req.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Handle classId -> courseId conversion
    if (req.body.classId) {
      if (mongoose.Types.ObjectId.isValid(req.body.classId)) {
        if (!req.body.academicInfo) req.body.academicInfo = {};
        req.body.academicInfo.courseId = req.body.classId;
      }
      delete req.body.classId;
    }
    
    // Ensure dateOfBirth is Date if provided
    if (req.body.personalInfo?.dateOfBirth && typeof req.body.personalInfo.dateOfBirth === 'string') {
      req.body.personalInfo.dateOfBirth = new Date(req.body.personalInfo.dateOfBirth);
    }
    
    // Validate courseId if provided
    if (req.body.academicInfo?.courseId && !mongoose.Types.ObjectId.isValid(req.body.academicInfo.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }
    
    // Don't allow changing collegeId
    delete req.body.collegeId;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    student.calculatePendingFee();
    await student.save();
    
    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors,
        details: error.message 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), addCollegeFilter, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const query = buildCollegeQuery(req, { _id: req.params.id });
    const student = await Student.findOne(query)
      .populate('userId', 'email')
      .populate('academicInfo.courseId', 'name');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const reason = req.body.reason || req.query.reason || '';
    const studentName = student.personalInfo?.fullName || 'N/A';
    const studentEmail = student.userId?.email || student.contactInfo?.email || 'N/A';
    const studentSrNo = student.srNo || 'N/A';
    
    // Soft delete - update status first
    student.academicInfo.status = 'inactive';
    await student.save();
    
    // Create CRITICAL notification after deletion (non-blocking)
    notifyStudentDeleted(student, req.user.id, reason).catch(err => {
      console.error('Failed to create deletion notification (non-critical):', err.message);
    });
    
    // Log deletion
    console.log(`⚠️ STUDENT DELETED: ${studentName} (${studentSrNo}) - Email: ${studentEmail} - Deleted by: ${req.user.email} - Reason: ${reason || 'Not provided'}`);
    
    res.json({ 
      message: 'Student deleted successfully',
      deletedStudent: {
        name: studentName,
        email: studentEmail,
        srNo: studentSrNo,
        deletedBy: req.user.email,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

