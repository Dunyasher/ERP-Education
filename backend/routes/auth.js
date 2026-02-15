const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (or Admin only in production)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'teacher', 'student'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, profile } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: role || 'student',
      profile
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        srNo: user.srNo
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get email from validated request (normalized) or fallback to lowercase
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
    const password = req.body.password;

    console.log(`🔍 Login attempt - Email: "${email}", Password length: ${password ? password.length : 0}`);

    if (!email || !password) {
      console.log(`❌ Missing email or password`);
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user - search with lowercase email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`❌ Login failed: User not found for email: "${email}"`);
      // Check if any users exist with similar email
      const similarUsers = await User.find({ email: { $regex: email.split('@')[0], $options: 'i' } }).select('email');
      if (similarUsers.length > 0) {
        console.log(`   Similar emails found: ${similarUsers.map(u => u.email).join(', ')}`);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`✅ User found: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Login failed: User account is inactive for email: "${email}"`);
      return res.status(401).json({ message: 'Account is inactive. Please contact administrator.' });
    }

    // Check password
    console.log(`🔐 Comparing password...`);
    const isMatch = await user.comparePassword(password);
    console.log(`🔐 Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Login failed: Password mismatch for email: "${email}"`);
      // Try direct bcrypt compare for debugging
      const bcrypt = require('bcryptjs');
      const directCompare = await bcrypt.compare(password, user.password);
      console.log(`   Direct bcrypt compare: ${directCompare}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`✅ Login successful for: ${user.email} (${user.role})`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        srNo: user.srNo,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

