const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/blog
// @desc    Get all blog posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, tag, isPublished } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    const posts = await Blog.find(query)
      .populate('authorId', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/blog/:slug
// @desc    Get blog post by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('authorId', 'profile.firstName profile.lastName');
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json(post);
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/blog
// @desc    Create blog post
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const post = await Blog.create({
      ...req.body,
      authorId: req.user.id
    });
    
    const populatedPost = await Blog.findById(post._id)
      .populate('authorId', 'profile.firstName profile.lastName');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/blog/:id
// @desc    Update blog post
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('authorId', 'profile.firstName profile.lastName');
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/blog/:id
// @desc    Delete blog post
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

