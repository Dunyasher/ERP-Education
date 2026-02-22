const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const College = require('../models/College');
const generateToken = require('../utils/generateToken');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/auth/college/register
// @desc    Register a new college/institute
// @access  Public
router.post('/college/register', [
  body('name').trim().notEmpty().withMessage('College name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('instituteType').isIn(['school', 'college', 'academy', 'short_course'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, instituteType, contactInfo, registrationInfo } = req.body;

    // Check if college exists
    const collegeExists = await College.findOne({ email });
    if (collegeExists) {
      return res.status(400).json({ message: 'College with this email already exists' });
    }

    // Create college
    const college = await College.create({
      name,
      email,
      password,
      phone,
      instituteType,
      contactInfo: {
        phone,
        ...contactInfo
      },
      registrationInfo
    });

    // Create default admin user for the college
    const adminUser = await User.create({
      email: `${college.email.split('@')[0]}_admin@${college.email.split('@')[1]}`,
      password: password, // Same password as college
      role: 'admin',
      collegeId: college._id,
      profile: {
        firstName: 'Admin',
        lastName: college.name
      }
    });

    // Update college last login
    college.lastLogin = new Date();
    await college.save();

    // Generate token for admin user
    const token = generateToken(adminUser._id);

    res.status(201).json({
      token,
      college: {
        id: college._id,
        name: college.name,
        email: college.email,
        instituteType: college.instituteType
      },
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        collegeId: adminUser.collegeId
      }
    });
  } catch (error) {
    console.error('College register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/college/login
// @desc    Login college/institute
// @access  Public
router.post('/college/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find college
    const college = await College.findOne({ email });
    if (!college) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!college.isActive) {
      return res.status(403).json({ message: 'College account is inactive' });
    }

    // Check password
    const isMatch = await college.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    college.lastLogin = new Date();
    await college.save();

    // Find or create admin user for this college
    let adminUser = await User.findOne({ 
      collegeId: college._id, 
      role: 'admin' 
    });

    if (!adminUser) {
      adminUser = await User.create({
        email: `${college.email.split('@')[0]}_admin@${college.email.split('@')[1]}`,
        password: password,
        role: 'admin',
        collegeId: college._id,
        profile: {
          firstName: 'Admin',
          lastName: college.name
        }
      });
    }

    // Generate token
    const token = generateToken(adminUser._id);

    res.json({
      token,
      college: {
        id: college._id,
        name: college.name,
        email: college.email,
        instituteType: college.instituteType
      },
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        collegeId: adminUser.collegeId,
        profile: adminUser.profile
      }
    });
  } catch (error) {
    console.error('College login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user (within a college)
// @access  Public (or Admin only in production)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'teacher', 'student']),
  body('collegeId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, profile, collegeId } = req.body;

    // If collegeId is provided, verify it exists
    let targetCollegeId = collegeId;
    if (targetCollegeId) {
      const college = await College.findById(targetCollegeId);
      if (!college) {
        return res.status(400).json({ message: 'Invalid college ID' });
      }
    } else {
      return res.status(400).json({ message: 'collegeId is required' });
    }

    // Check if user exists in this college
    const userExists = await User.findOne({ email, collegeId: targetCollegeId });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists in this college' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: role || 'student',
      profile,
      collegeId: targetCollegeId
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        srNo: user.srNo,
        collegeId: user.collegeId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (college-specific)
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

    // Find user (email is unique per college)
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

    // Populate collegeId if it exists
    let college = null;
    if (user.collegeId) {
      try {
        college = await College.findById(user.collegeId).select('name email isActive');
        // Check if college is active
        if (college && !college.isActive) {
          return res.status(403).json({ message: 'College account is inactive. Please contact administrator.' });
        }
      } catch (collegeError) {
        console.error('Error populating college:', collegeError);
        // Continue even if college lookup fails (might be deleted)
      }
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Login failed: User account is inactive for email: "${email}"`);
      return res.status(403).json({ message: 'User account is inactive' });
    }

    // Check password
    console.log(`🔐 Comparing password...`);
    try {
      const isMatch = await user.comparePassword(password);
      console.log(`🔐 Password match result: ${isMatch}`);
      
      if (!isMatch) {
        console.log(`❌ Login failed: Password mismatch for email: "${email}"`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(500).json({ message: 'Error validating password' });
    }

    console.log(`✅ Login successful for: ${user.email} (${user.role})`);

    // Update last login
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (saveError) {
      console.error('Error saving last login:', saveError);
      // Continue even if save fails
    }

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        srNo: user.srNo,
        collegeId: college?._id || user.collegeId || null,
        collegeName: college?.name || null,
        profile: user.profile || {}
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('collegeId', 'name email instituteType settings');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

