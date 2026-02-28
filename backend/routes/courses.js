const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public (with optional authentication for college filtering)
router.get('/', async (req, res) => {
  try {
    // Try to authenticate if token is provided (optional)
    let userCollegeId = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const user = await User.findById(decoded.id)
          .select('-password')
          .populate('collegeId', 'name email isActive');
        
        if (user && user.isActive && user.collegeId) {
          userCollegeId = user.collegeId._id || user.collegeId;
          console.log('🔍 Authenticated user - filtering by collegeId:', userCollegeId);
        }
      } catch (authError) {
        // If authentication fails, continue without filtering (for backward compatibility)
        console.log('⚠️ Authentication failed, continuing without college filter');
      }
    }
    
    const { instituteType, categoryId, status, collegeId } = req.query;
    const query = {};
    
    // CRITICAL: Automatically filter by authenticated user's collegeId if available
    // This ensures users only see courses from their college
    if (userCollegeId) {
      query.collegeId = userCollegeId;
      console.log('🔍 Filtering courses by authenticated user collegeId:', userCollegeId);
    } else if (collegeId) {
      // Fallback to query parameter if provided
      query.collegeId = collegeId;
      console.log('🔍 Filtering courses by query collegeId:', collegeId);
    } else {
      // If no collegeId filter, show all courses (for backward compatibility)
      console.log('⚠️ No collegeId filter - returning all courses');
    }
    
    if (instituteType) query.instituteType = instituteType;
    if (categoryId) query.categoryId = categoryId;
    if (status) query.status = status;
    
    console.log('📋 Course query:', JSON.stringify(query, null, 2));
    
    const courses = await Course.find(query)
      .populate('categoryId', 'name instituteType')
      .populate('instructorId', 'personalInfo.fullName srNo')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Fetched ${courses.length} courses`);
    if (courses.length > 0) {
      console.log('📋 Course names:', courses.map(c => c.name));
      console.log('📋 Course IDs:', courses.map(c => c._id));
      console.log('📋 Course collegeIds:', courses.map(c => c.collegeId?.toString() || 'N/A'));
    }
    
    res.json(courses);
  } catch (error) {
    console.error('❌ Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('instructorId', 'personalInfo.fullName');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create course
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // Automatically set collegeId from authenticated user if not provided
    const finalCollegeId = req.body.collegeId || req.collegeId || req.user?.collegeId?._id || req.user?.collegeId;
    console.log('🔍 Setting course collegeId:', {
      fromBody: req.body.collegeId,
      fromReq: req.collegeId,
      fromUser: req.user?.collegeId?._id || req.user?.collegeId,
      final: finalCollegeId
    });
    
    // Validate that collegeId exists
    if (!finalCollegeId) {
      console.error('❌ No collegeId found for user:', req.user?.email, req.user?.role);
      return res.status(400).json({ 
        message: 'College ID is required. Please ensure you are associated with a college.',
        errors: ['collegeId is required but was not found for the authenticated user']
      });
    }
    
    const courseData = {
      ...req.body,
      collegeId: finalCollegeId
    };

    const course = await Course.create(courseData);
    console.log('✅ Course created in database:', {
      _id: course._id,
      name: course.name,
      srNo: course.srNo,
      categoryId: course.categoryId,
      instituteType: course.instituteType,
      collegeId: course.collegeId?.toString() || course.collegeId
    });
    
    const populatedCourse = await Course.findById(course._id)
      .populate('categoryId', 'name instituteType')
      .populate('instructorId', 'personalInfo.fullName');
    
    console.log('✅ Populated course to return:', {
      _id: populatedCourse._id,
      name: populatedCourse.name,
      srNo: populatedCourse.srNo,
      category: populatedCourse.categoryId?.name || 'N/A',
      instituteType: populatedCourse.instituteType,
      collegeId: populatedCourse.collegeId?.toString() || populatedCourse.collegeId
    });
    
    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course already exists' });
    }
    // Return more detailed error message
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => {
        return `${e.path}: ${e.message}`;
      });
      console.error('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin, Teacher)
router.put('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name')
      .populate('instructorId', 'personalInfo.fullName');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

