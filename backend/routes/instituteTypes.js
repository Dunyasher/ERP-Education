const express = require('express');
const router = express.Router();
const InstituteType = require('../models/InstituteType');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/institute-types
// @desc    Get all institute types
// @access  Private (Admin, Super Admin)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = {};
    
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    
    const instituteTypes = await InstituteType.find(query)
      .sort({ order: 1, name: 1 });
    
    res.json(instituteTypes);
  } catch (error) {
    console.error('Get institute types error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/institute-types/:id
// @desc    Get single institute type
// @access  Private (Admin, Super Admin)
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const instituteType = await InstituteType.findById(req.params.id);
    
    if (!instituteType) {
      return res.status(404).json({ message: 'Institute type not found' });
    }
    
    res.json(instituteType);
  } catch (error) {
    console.error('Get institute type error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/institute-types
// @desc    Create new institute type
// @access  Private (Admin, Super Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, description, icon, color, order } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Institute type name is required' });
    }
    
    // Check if institute type with same name or value already exists
    const existingByName = await InstituteType.findOne({ 
      name: name.trim(),
      isActive: true 
    });
    
    if (existingByName) {
      return res.status(400).json({ message: 'Institute type with this name already exists' });
    }
    
    const value = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const existingByValue = await InstituteType.findOne({ 
      value: value,
      isActive: true 
    });
    
    if (existingByValue) {
      return res.status(400).json({ message: 'Institute type with this value already exists' });
    }
    
    const instituteType = await InstituteType.create({
      name: name.trim(),
      value: value,
      description: description?.trim() || '',
      icon: icon || 'school',
      color: color || '#1976d2',
      order: order || 0,
      isActive: true
    });
    
    res.status(201).json(instituteType);
  } catch (error) {
    console.error('Create institute type error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Institute type already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/institute-types/:id
// @desc    Update institute type
// @access  Private (Admin, Super Admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, description, icon, color, order, isActive } = req.body;
    
    const instituteType = await InstituteType.findById(req.params.id);
    
    if (!instituteType) {
      return res.status(404).json({ message: 'Institute type not found' });
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== instituteType.name) {
      const existing = await InstituteType.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id },
        isActive: true 
      });
      
      if (existing) {
        return res.status(400).json({ message: 'Institute type with this name already exists' });
      }
      
      instituteType.name = name.trim();
      // Update value if name changes
      instituteType.value = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    
    if (description !== undefined) instituteType.description = description?.trim() || '';
    if (icon !== undefined) instituteType.icon = icon;
    if (color !== undefined) instituteType.color = color;
    if (order !== undefined) instituteType.order = order;
    if (isActive !== undefined) instituteType.isActive = isActive;
    
    await instituteType.save();
    
    res.json(instituteType);
  } catch (error) {
    console.error('Update institute type error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Institute type already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/institute-types/:id
// @desc    Delete institute type (soft delete)
// @access  Private (Admin, Super Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const instituteType = await InstituteType.findById(req.params.id);
    
    if (!instituteType) {
      return res.status(404).json({ message: 'Institute type not found' });
    }
    
    // Soft delete - set isActive to false
    instituteType.isActive = false;
    await instituteType.save();
    
    res.json({ message: 'Institute type deleted successfully' });
  } catch (error) {
    console.error('Delete institute type error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

