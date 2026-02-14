const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/pages
// @desc    Get all pages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { pageType, isPublished } = req.query;
    const query = {};
    
    if (pageType) query.pageType = pageType;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    const pages = await Page.find(query).sort({ order: 1 });
    res.json(pages);
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pages/:slug
// @desc    Get page by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pages
// @desc    Create page
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = await Page.create(req.body);
    res.status(201).json(page);
  } catch (error) {
    console.error('Create page error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page with this slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/pages/:id
// @desc    Update page
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/pages/:id
// @desc    Delete page
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    await Page.findByIdAndDelete(req.params.id);
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

