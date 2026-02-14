const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Counter = require('../models/Counter');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyStudentCreated, notifyStudentDeleted } = require('../utils/notifications');
const { getCurrentSerialNumber } = require('../utils/autoSerialNumber');

// @route   GET /api/students/next-serial
// @desc    Get next serial number preview (for BITEL form - format: A + number)
// @access  Private (Admin)
router.get('/next-serial', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // Get current student count
    const studentCount = await Student.countDocuments();
    
    // Calculate next number (BITEL format: A + number, starting from 1)
    const nextNumber = studentCount + 1;
    
    // Format as "A" + number (e.g., "A2596")
    const nextSerial = `A${nextNumber}`;
    
    res.json({ nextSerial, nextNumber });
  } catch (error) {
    console.error('Get next serial error:', error);
    // Fallback: use timestamp
    const fallbackNumber = Date.now().toString().slice(-4);
    res.json({ nextSerial: `A${fallbackNumber}`, nextNumber: parseInt(fallbackNumber) });
  }
});

// @route   GET /api/students
// @desc    Get all students
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { instituteType, status, courseId } = req.query;
    const query = {};
    
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

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(req.params.id)
      .populate('userId', 'email profile')
      .populate('academicInfo.courseId', 'name')
      .populate('feeInfo.feeStructureId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
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
    
    // Check if email already exists before creating
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      clearTimeout(timeout);
      return res.status(400).json({ 
        message: 'User with this email already exists',
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
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Students can only update their own profile
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || student._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
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
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(req.params.id)
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

