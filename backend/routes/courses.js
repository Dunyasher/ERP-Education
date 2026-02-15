const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { instituteType, categoryId, status } = req.query;
    const query = {};
    
    if (instituteType) query.instituteType = instituteType;
    if (categoryId) query.categoryId = categoryId;
    if (status) query.status = status;
    
    const courses = await Course.find(query)
      .populate('categoryId', 'name instituteType')
      .populate('instructorId', 'personalInfo.fullName srNo')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
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
    const course = await Course.create(req.body);
    
    const populatedCourse = await Course.findById(course._id)
      .populate('categoryId', 'name')
      .populate('instructorId', 'personalInfo.fullName');
    
    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course already exists' });
    }
    res.status(500).json({ message: 'Server error' });
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

