const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Category = require('../models/Category');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   GET /api/settings/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('email').optional().isEmail().normalizeEmail(),
  body('profile.firstName').optional().trim(),
  body('profile.lastName').optional().trim(),
  body('profile.phone').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, profile } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email.trim() && email !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = normalizedEmail;
    }

    // Update profile - handle null/undefined profile
    if (profile) {
      // Initialize profile if it doesn't exist
      if (!user.profile) {
        user.profile = {};
      }
      
      // Update only provided fields, remove empty strings
      if (profile.firstName !== undefined) {
        user.profile.firstName = profile.firstName && profile.firstName.trim() ? profile.firstName.trim() : undefined;
      }
      if (profile.lastName !== undefined) {
        user.profile.lastName = profile.lastName && profile.lastName.trim() ? profile.lastName.trim() : undefined;
      }
      if (profile.phone !== undefined) {
        user.profile.phone = profile.phone && profile.phone.trim() ? profile.phone.trim() : undefined;
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/password
// @desc    Change user password
// @access  Private
router.put('/password', authenticate, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg || err.message || 'Validation error');
      return res.status(400).json({ 
        message: errorMessages[0] || 'Validation failed',
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !currentPassword.trim()) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    try {
      const isMatch = await user.comparePassword(currentPassword.trim());
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    } catch (compareError) {
      console.error('Error comparing password:', compareError);
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(newPassword.trim());
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Update password - mark as modified to trigger pre-save hook
    user.password = newPassword.trim();
    user.markModified('password'); // Explicitly mark password as modified
    
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    console.error('Error stack:', error.stack);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: validationErrors[0] || 'Validation error',
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// @route   PUT /api/settings/password/:userId
// @desc    Change password for any user (Admin only)
// @access  Private (Admin)
router.put('/password/:userId', authenticate, authorize('admin', 'super_admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg || err.message || 'Validation error');
      return res.status(400).json({ 
        message: errorMessages[0] || 'Validation failed',
        errors: errors.array() 
      });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password - mark as modified to trigger pre-save hook
    user.password = newPassword.trim();
    user.markModified('password'); // Explicitly mark password as modified
    
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    console.error('Error stack:', error.stack);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: validationErrors[0] || 'Validation error',
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// @route   POST /api/settings/users
// @desc    Create new user (Admin only)
// @access  Private (Admin)
router.post('/users', authenticate, authorize('admin', 'super_admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'teacher', 'student', 'accountant', 'super_admin', 'security', 'sweeper']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, firstName, lastName, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password || 'password123',
      role: role,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || ''
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        srNo: user.srNo,
        uniqueId: user.uniqueId,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/users/:userId
// @desc    Update any user (Admin only)
// @access  Private (Admin)
router.put('/users/:userId', authenticate, authorize('admin', 'super_admin'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'teacher', 'student', 'super_admin']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { email, role, profile, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (role) user.role = role;
    if (profile) user.profile = { ...user.profile, ...profile };
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/settings/users/:userId
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/users/:userId', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/stats
// @desc    Get system statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const [studentsCount, teachersCount, coursesCount, categoriesCount, usersCount] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
      Category.countDocuments(),
      User.countDocuments()
    ]);

    res.json({
      students: studentsCount,
      teachers: teachersCount,
      courses: coursesCount,
      categories: categoriesCount,
      users: usersCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

