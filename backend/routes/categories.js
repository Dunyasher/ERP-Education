const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticate, authorize } = require('../middleware/auth');

// Test endpoint - must be before /:id route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Categories route is working!', 
    timestamp: new Date().toISOString(),
    route: '/api/categories/test'
  });
});

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { instituteType, categoryType } = req.query;
    
    // Build query - use simple structure to avoid MongoDB issues
    const query = {};
    
    // Filter by isActive - get all active categories or those without the field
    // Use a simpler approach: just get all, filter in memory if needed
    // But for now, let's use MongoDB's $or
    query.$or = [
      { isActive: true },
      { isActive: { $exists: false } }
    ];
    
    // Add filters if provided
    if (instituteType) {
      query.instituteType = instituteType;
    }
    
    if (categoryType) {
      query.categoryType = categoryType;
    }
    
    // Execute query
    const categories = await Category.find(query).sort({ createdAt: -1 });
    
    // Return results
    return res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid query parameters' });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, instituteType, categoryType, description } = req.body;
    
    if (!name || !instituteType) {
      return res.status(400).json({ message: 'Name and institute type are required' });
    }
    
    // Set default categoryType if not provided
    const finalCategoryType = categoryType || 'course';
    
    // Check if category with same name, categoryType, and instituteType already exists (case-insensitive)
    const existing = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
      categoryType: finalCategoryType,
      instituteType,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: `Category "${name.trim()}" already exists for ${finalCategoryType} in ${instituteType}` 
      });
    }
    
    const category = await Category.create({
      name: name.trim(),
      instituteType,
      categoryType: finalCategoryType,
      description: description || ''
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${errors}` });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

