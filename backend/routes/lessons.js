const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/lessons
// @desc    Get all lessons
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = {};
    
    if (courseId) query.courseId = courseId;
    
    const lessons = await Lesson.find(query)
      .populate('courseId', 'name')
      .sort({ order: 1, createdAt: 1 });
    
    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('courseId', 'name');
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/lessons
// @desc    Create lesson
// @access  Private (Admin, Teacher)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.create(req.body);
    
    const populatedLesson = await Lesson.findById(lesson._id)
      .populate('courseId', 'name');
    
    res.status(201).json(populatedLesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private (Admin, Teacher)
router.put('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('courseId', 'name');
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson
// @access  Private (Admin, Teacher)
router.delete('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

