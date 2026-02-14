const express = require('express');
const router = express.Router();
const StaffCategory = require('../models/StaffCategory');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/staff-categories
// @desc    Get all staff categories
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { instituteType, includeInactive } = req.query;
    const query = {};
    
    // Only filter by isActive if includeInactive is not set
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    
    if (instituteType) {
      query.instituteType = instituteType;
    }
    
    const categories = await StaffCategory.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get staff categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff-categories/:id
// @desc    Get single staff category
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const category = await StaffCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Staff category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Get staff category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff-categories
// @desc    Create staff category
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, instituteType, description } = req.body;
    
    if (!name || !instituteType) {
      return res.status(400).json({ message: 'Name and institute type are required' });
    }
    
    // Check if category with same name and institute type already exists (case-insensitive)
    const existing = await StaffCategory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
      instituteType 
    });
    if (existing) {
      return res.status(400).json({ message: `Category "${name.trim()}" already exists for ${instituteType}` });
    }
    
    const category = await StaffCategory.create({
      name: name.trim(),
      instituteType,
      description: description || ''
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create staff category error:', error);
    console.error('Error details:', error.message, error.stack);
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

// @route   PUT /api/staff-categories/:id
// @desc    Update staff category
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, instituteType, description, isActive } = req.body;
    
    const category = await StaffCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Staff category not found' });
    }
    
    // Check if updating name/instituteType would create a duplicate
    if (name || instituteType) {
      const checkName = name || category.name;
      const checkInstituteType = instituteType || category.instituteType;
      const existing = await StaffCategory.findOne({ 
        name: checkName.trim(), 
        instituteType: checkInstituteType,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Category with this name already exists for this institute type' });
      }
    }
    
    if (name) category.name = name.trim();
    if (instituteType) category.instituteType = instituteType;
    if (description !== undefined) category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;
    
    await category.save();
    
    res.json(category);
  } catch (error) {
    console.error('Update staff category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/staff-categories/:id
// @desc    Delete staff category
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const category = await StaffCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Staff category not found' });
    }
    
    await category.deleteOne();
    
    res.json({ message: 'Staff category deleted successfully' });
  } catch (error) {
    console.error('Delete staff category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

