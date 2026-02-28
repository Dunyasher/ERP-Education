const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { instituteType, status, includeInactive } = req.query;
    const query = {};
    
    // Apply collegeId filter from authenticated user if available
    // For super_admin, don't filter by collegeId to show all teachers
    const userRole = req.user?.role;
    if (userRole === 'super_admin') {
      // Super admin can see all teachers
      console.log('👑 Super admin access - showing all teachers from all colleges');
    } else if (req.user && req.user.collegeId) {
      // Handle both populated object and ObjectId
      const userCollegeId = req.user.collegeId._id || req.user.collegeId || req.collegeId;
      if (userCollegeId) {
        // Ensure it's a valid ObjectId for query
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(userCollegeId)) {
          query.collegeId = new mongoose.Types.ObjectId(userCollegeId);
          console.log(`🔒 Filtering teachers by authenticated user's collegeId: ${query.collegeId.toString()}`);
        } else {
          console.error('❌ Invalid collegeId format:', userCollegeId);
        }
      }
    }
    
    if (instituteType) query['employment.instituteType'] = instituteType;
    
    // By default, only show active teachers unless explicitly requested
    if (status) {
      query['employment.status'] = status;
    } else if (includeInactive !== 'true') {
      // Default: only show active teachers
      query['employment.status'] = { $ne: 'inactive' };
    }
    
    console.log('📋 Teacher query:', JSON.stringify(query, null, 2));
    
    // Debug: Check all teachers in database (without filter) to see what collegeIds exist
    const allTeachers = await Teacher.find({}).select('collegeId personalInfo.fullName').limit(5);
    console.log('🔍 Sample teachers in DB (first 5):');
    allTeachers.forEach(t => {
      console.log(`  - Name: ${t.personalInfo?.fullName || 'N/A'}, collegeId: ${t.collegeId?.toString() || 'N/A'}, type: ${typeof t.collegeId}`);
    });
    
    const teachers = await Teacher.find(query)
      .populate('userId', 'email profile uniqueId')
      .populate('staffCategoryId', 'name description')
      .populate({
        path: 'employment.courses',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Fetched ${teachers.length} teachers with query`);
    if (teachers.length > 0) {
      console.log('📋 Teacher names:', teachers.map(t => t.personalInfo?.fullName || 'N/A'));
      console.log('📋 Teacher collegeIds:', teachers.map(t => t.collegeId?.toString() || 'N/A'));
    } else {
      console.log('⚠️ No teachers found with query:', JSON.stringify(query, null, 2));
      const userCollegeId = req.user?.collegeId?._id || req.user?.collegeId || req.collegeId;
      console.log('📋 User collegeId for query:', userCollegeId);
      console.log('📋 User collegeId type:', typeof userCollegeId);
      console.log('📋 User collegeId string:', String(userCollegeId));
      
      // Try to find teachers without collegeId filter to see if any exist
      const teachersWithoutFilter = await Teacher.find({ 'employment.status': { $ne: 'inactive' } }).limit(3);
      console.log('🔍 Teachers without collegeId filter (first 3):', teachersWithoutFilter.length);
      teachersWithoutFilter.forEach(t => {
        console.log(`  - Name: ${t.personalInfo?.fullName || 'N/A'}, collegeId: ${t.collegeId?.toString() || 'N/A'}`);
      });
    }
    
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get single teacher
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'email profile uniqueId')
      .populate('staffCategoryId', 'name description')
      .populate('employment.courses', 'name');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  // Add timeout to prevent hanging requests
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ message: 'Request timeout - operation took too long' });
    }
  }, 25000); // 25 second timeout

  try {
    console.log('📥 POST /api/teachers - Request received');
    console.log('📥 Request body keys:', Object.keys(req.body || {}));
    console.log('📥 User info:', { email: req.user?.email, role: req.user?.role, collegeId: req.user?.collegeId });
    
    // Validate request body exists
    if (!req.body) {
      clearTimeout(timeout);
      console.error('❌ No request body provided');
      return res.status(400).json({ message: 'Request body is required' });
    }

    const { email, password, personalInfo, contactInfo, qualification, employment, salary, staffCategoryId } = req.body;
    
    console.log('📥 Extracted data:', {
      email: email ? 'provided' : 'missing',
      personalInfo: personalInfo ? 'provided' : 'missing',
      contactInfo: contactInfo ? 'provided' : 'missing',
      employment: employment ? 'provided' : 'missing'
    });
    
    // Validate required fields
    if (!email || !email.trim()) {
      console.error('❌ Email is missing or empty');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!personalInfo || !personalInfo.fullName || !personalInfo.fullName.trim()) {
      console.error('❌ Full name is missing or empty');
      return res.status(400).json({ message: 'Teacher full name is required' });
    }
    
    if (!contactInfo || !contactInfo.phone || !contactInfo.phone.trim()) {
      console.error('❌ Phone number is missing or empty');
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    if (!employment || !employment.instituteType) {
      console.error('❌ Institute type is missing');
      return res.status(400).json({ message: 'Institute type is required' });
    }
    
    // Ensure dateOfBirth is a Date object if provided
    let dateOfBirthDate;
    if (personalInfo.dateOfBirth) {
      if (typeof personalInfo.dateOfBirth === 'string') {
        dateOfBirthDate = new Date(personalInfo.dateOfBirth);
      } else {
        dateOfBirthDate = personalInfo.dateOfBirth;
      }
    }
    
    // Validate and clean employment.courses if provided
    let validCourses = [];
    if (employment.courses && Array.isArray(employment.courses)) {
      validCourses = employment.courses.filter(courseId => {
        return courseId && courseId !== '' && mongoose.Types.ObjectId.isValid(courseId);
      });
    }
    
    // Check if email already exists before creating
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      clearTimeout(timeout);
      return res.status(400).json({ 
        message: 'User with this email already exists',
        email: email,
        suggestion: 'Please use a different email address or check if this teacher already exists in the system'
      });
    }
    
    // Create user account
    let user;
    try {
      // Validate password if provided, otherwise use default
      const userPassword = password && password.trim() ? password.trim() : 'password123';
      if (password && password.trim() && password.trim().length < 6) {
        clearTimeout(timeout);
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      // Get collegeId before creating user (required for non-super_admin)
      const userCollegeId = req.user?.collegeId?._id || req.user?.collegeId || req.collegeId;
      if (!userCollegeId) {
        clearTimeout(timeout);
        console.error('❌ No collegeId found for creating user');
        return res.status(400).json({ message: 'College ID is required. Please ensure you are logged in.' });
      }
      
      // Ensure collegeId is a valid ObjectId
      const mongoose = require('mongoose');
      let finalUserCollegeId = userCollegeId;
      if (mongoose.Types.ObjectId.isValid(userCollegeId)) {
        finalUserCollegeId = new mongoose.Types.ObjectId(userCollegeId);
      } else {
        clearTimeout(timeout);
        return res.status(400).json({ message: 'Invalid College ID format' });
      }
      
      console.log('📋 Creating user with email:', email.toLowerCase().trim());
      console.log('📋 User collegeId:', finalUserCollegeId.toString());
      user = await User.create({
        email: email.toLowerCase().trim(),
        password: userPassword,
        role: 'teacher',
        collegeId: finalUserCollegeId, // Required for teacher role
        profile: {
          firstName: personalInfo.fullName.split(' ')[0] || personalInfo.fullName,
          lastName: personalInfo.fullName.split(' ').slice(1).join(' ') || '',
          phone: contactInfo.phone.trim(),
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
      if (userError.name === 'ValidationError') {
        clearTimeout(timeout);
        const errors = Object.values(userError.errors).map(err => err.message);
        console.error('❌ User validation errors:', errors);
        console.error('❌ User validation error details:', userError.errors);
        return res.status(400).json({ 
          message: 'User validation failed', 
          errors: errors,
          details: Object.keys(userError.errors).map(key => ({
            field: key,
            message: userError.errors[key].message
          }))
        });
      }
      throw userError;
    }
    
    // Prepare teacher data - clean and validate
    // Set collegeId from authenticated user
    // Handle both populated object and ObjectId (must match GET route logic)
    const collegeId = req.user?.collegeId?._id || req.user?.collegeId || req.collegeId;
    if (!collegeId) {
      clearTimeout(timeout);
      console.error('❌ No collegeId found for user:', req.user?.email);
      console.error('❌ User collegeId:', req.user?.collegeId);
      console.error('❌ Req collegeId:', req.collegeId);
      return res.status(400).json({ message: 'College ID is required. Please ensure you are logged in.' });
    }
    
    // Ensure collegeId is a valid ObjectId (must match GET route logic)
    const mongoose = require('mongoose');
    let finalCollegeId = collegeId;
    if (mongoose.Types.ObjectId.isValid(collegeId)) {
      finalCollegeId = new mongoose.Types.ObjectId(collegeId);
      console.log('📋 Creating teacher with collegeId:', finalCollegeId.toString());
      console.log('📋 User collegeId type:', typeof req.user?.collegeId);
    } else {
      console.error('❌ Invalid ObjectId format:', collegeId);
      clearTimeout(timeout);
      return res.status(400).json({ message: 'Invalid College ID format' });
    }
    
    const teacherData = {
      userId: user._id,
      collegeId: finalCollegeId,
      ...(staffCategoryId && mongoose.Types.ObjectId.isValid(staffCategoryId) && { staffCategoryId }),
      personalInfo: {
        fullName: personalInfo.fullName.trim(),
        ...(dateOfBirthDate && { dateOfBirth: dateOfBirthDate }),
        ...(personalInfo.gender && { gender: personalInfo.gender }),
        ...(personalInfo.photo && personalInfo.photo.trim() && { photo: personalInfo.photo.trim() }),
        ...(personalInfo.bloodGroup && personalInfo.bloodGroup.trim() && { bloodGroup: personalInfo.bloodGroup.trim() })
      },
      contactInfo: {
        phone: contactInfo.phone.trim(),
        ...(contactInfo.email && contactInfo.email.trim() && { email: contactInfo.email.trim() }),
        ...(contactInfo.address && {
          address: {}
        })
      }
    };
    
    // Add address fields if provided
    if (contactInfo.address) {
      Object.keys(contactInfo.address).forEach(key => {
        if (contactInfo.address[key] && contactInfo.address[key].trim && contactInfo.address[key].trim()) {
          teacherData.contactInfo.address[key] = contactInfo.address[key].trim();
        }
      });
      // Remove address if empty
      if (Object.keys(teacherData.contactInfo.address).length === 0) {
        delete teacherData.contactInfo.address;
      }
    }
    
    // Add qualification if provided
    if (qualification && typeof qualification === 'object') {
      teacherData.qualification = {};
      Object.keys(qualification).forEach(key => {
        if (qualification[key] !== null && qualification[key] !== undefined && qualification[key] !== '') {
          if (typeof qualification[key] === 'string' && qualification[key].trim) {
            const trimmed = qualification[key].trim();
            if (trimmed) {
              // Handle numeric fields
              if (key === 'yearOfPassing' || key === 'experience') {
                teacherData.qualification[key] = parseInt(trimmed) || 0;
              } else {
                teacherData.qualification[key] = trimmed;
              }
            }
          } else if (typeof qualification[key] === 'number') {
            teacherData.qualification[key] = qualification[key];
          }
        }
      });
    }
    
    // Add employment info
    teacherData.employment = {
      instituteType: employment.instituteType,
      joinDate: employment.joinDate ? new Date(employment.joinDate) : new Date(),
      status: employment.status || 'active',
      ...(validCourses.length > 0 && { courses: validCourses }),
      ...(employment.subjects && Array.isArray(employment.subjects) && employment.subjects.length > 0 && {
        subjects: employment.subjects.filter(s => s && s.trim()).map(s => s.trim())
      })
    };
    
    // Add salary if provided
    if (salary && typeof salary === 'object') {
      teacherData.salary = {};
      if (salary.basicSalary !== null && salary.basicSalary !== undefined && salary.basicSalary !== '') {
        teacherData.salary.basicSalary = parseFloat(salary.basicSalary) || 0;
      } else {
        teacherData.salary.basicSalary = 0;
      }
      if (salary.allowances !== null && salary.allowances !== undefined && salary.allowances !== '') {
        teacherData.salary.allowances = parseFloat(salary.allowances) || 0;
      } else {
        teacherData.salary.allowances = 0;
      }
      if (salary.bankAccount && salary.bankAccount.trim && salary.bankAccount.trim()) {
        teacherData.salary.bankAccount = salary.bankAccount.trim();
      }
      if (salary.bankName && salary.bankName.trim && salary.bankName.trim()) {
        teacherData.salary.bankName = salary.bankName.trim();
      }
      if (salary.ifscCode && salary.ifscCode.trim && salary.ifscCode.trim()) {
        teacherData.salary.ifscCode = salary.ifscCode.trim();
      }
    } else {
      // Initialize salary with default values
      teacherData.salary = {
        basicSalary: 0,
        allowances: 0,
        totalSalary: 0
      };
    }
    
    // Create teacher record
    let teacher;
    try {
      console.log('Creating teacher with data:', JSON.stringify(teacherData, null, 2));
      teacher = await Teacher.create(teacherData);
    } catch (teacherError) {
      console.error('Error creating teacher:', teacherError);
      console.error('Teacher error details:', {
        message: teacherError.message,
        code: teacherError.code,
        name: teacherError.name,
        errors: teacherError.errors,
        keyPattern: teacherError.keyPattern,
        stack: teacherError.stack
      });
      
      // If teacher creation fails, try to delete the user we just created
      try {
        await User.findByIdAndDelete(user._id);
        console.log('✅ Cleaned up user after teacher creation failure');
      } catch (deleteError) {
        console.error('Error deleting user after teacher creation failure:', deleteError);
      }
      
      if (teacherError.code === 11000) {
        const field = Object.keys(teacherError.keyPattern || {})[0] || 'field';
        return res.status(400).json({ 
          message: `Teacher with this ${field} already exists`,
          field: field
        });
      }
      
      if (teacherError.name === 'ValidationError') {
        const errors = Object.values(teacherError.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Teacher validation failed', 
          errors: errors 
        });
      }
      
      throw teacherError;
    }
    
    // Populate teacher data
    let populatedTeacher;
    try {
      populatedTeacher = await Teacher.findById(teacher._id)
        .populate('userId', 'email profile uniqueId')
        .populate('staffCategoryId', 'name description')
        .populate({
          path: 'employment.courses',
          select: 'name',
          strictPopulate: false
        });
    } catch (populateError) {
      console.error('Error populating teacher:', populateError);
      populatedTeacher = teacher;
    }
    
    // Log new entry
    console.log(`✅ New Teacher Added: ${populatedTeacher.personalInfo?.fullName || 'N/A'} (${populatedTeacher.srNo || 'N/A'}) - Email: ${email} - Created by: ${req.user?.email || 'System'}`);
    
    // Clear timeout on success
    clearTimeout(timeout);
    
    res.status(201).json(populatedTeacher);
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeout);
    
    console.error('Create teacher error:', error);
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
      message: 'Server error while creating teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Teachers can only update their own profile
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (teacher._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('userId', 'email profile uniqueId')
      .populate('staffCategoryId', 'name description');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid teacher ID format' });
    }

    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'email');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const teacherName = teacher.personalInfo?.fullName || 'N/A';
    const teacherEmail = teacher.userId?.email || teacher.contactInfo?.email || 'N/A';
    const teacherSrNo = teacher.srNo || 'N/A';
    const userId = teacher.userId?._id || teacher.userId;
    
    // Delete the teacher record
    await Teacher.findByIdAndDelete(req.params.id);
    
    // Optionally delete the associated user account
    // Only delete if user exists and is a teacher role
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user && user.role === 'teacher') {
          await User.findByIdAndDelete(userId);
          console.log(`✅ Deleted associated user account: ${teacherEmail}`);
        }
      } catch (userError) {
        console.error('Error deleting associated user (non-critical):', userError);
        // Don't fail the entire operation if user deletion fails
      }
    }
    
    // Log deletion
    console.log(`⚠️ TEACHER DELETED: ${teacherName} (${teacherSrNo}) - Email: ${teacherEmail} - Deleted by: ${req.user.email || 'System'}`);
    
    res.json({ 
      message: 'Teacher deleted successfully',
      deletedTeacher: {
        name: teacherName,
        email: teacherEmail,
        srNo: teacherSrNo,
        deletedBy: req.user.email || 'System',
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

module.exports = router;

