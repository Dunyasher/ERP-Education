const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Category = require('../models/Category');
const College = require('../models/College');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { notifyEmailChanged, notifyPasswordChanged } = require('../utils/notifications');

// @route   GET /api/settings/profile
// @desc    Get current user profile with college information and password
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('+tempPassword')
      .populate('collegeId', 'name email instituteType contactInfo');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response with college information
    const profileData = {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      college: user.collegeId ? {
        id: user.collegeId._id,
        name: user.collegeId.name,
        email: user.collegeId.email,
        instituteType: user.collegeId.instituteType,
        contactInfo: user.collegeId.contactInfo
      } : null,
      password: user.tempPassword || 'Not set', // Include password for admin viewing
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json(profileData);
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
    const oldEmail = user.email;
    if (email && email.trim() && email !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = normalizedEmail;
      
      // Notify admins about email change
      if (oldEmail !== normalizedEmail) {
        notifyEmailChanged(user, oldEmail, normalizedEmail, req.user.id)
          .catch(err => console.error('Error sending email change notification:', err));
      }
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

    // Notify admins about password change
    notifyPasswordChanged(user, req.user.id, false)
      .catch(err => console.error('Error sending password change notification:', err));

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

    // Notify admins about password change by admin
    notifyPasswordChanged(user, req.user.id, true)
      .catch(err => console.error('Error sending password change notification:', err));

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

    const { email, password, role, firstName, lastName, phone, collegeId, permissions } = req.body;

    // Determine collegeId - use provided or from user's college (for non-super-admin)
    let targetCollegeId = collegeId;
    if (!targetCollegeId && req.user.role !== 'super_admin') {
      targetCollegeId = req.user.collegeId;
    }
    
    // Super admin must provide collegeId for non-super-admin users
    if (!targetCollegeId && role !== 'super_admin' && req.user.role === 'super_admin') {
      return res.status(400).json({ message: 'collegeId is required when creating users' });
    }

    // Check if user exists in this college (or globally for super_admin)
    const query = { email: email.toLowerCase().trim() };
    if (targetCollegeId) {
      query.collegeId = targetCollegeId;
    }
    const userExists = await User.findOne(query);
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' + (targetCollegeId ? ' in this college' : '') });
    }

    // Create user
    const userData = {
      email: email.toLowerCase().trim(),
      password: password || 'password123',
      role: role,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || ''
      }
    };
    
    // Add collegeId if not super_admin
    if (role !== 'super_admin' && targetCollegeId) {
      userData.collegeId = targetCollegeId;
    }
    
    // Add permissions if provided
    if (permissions) {
      userData.permissions = permissions;
    }
    
    const user = await User.create(userData);

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
// @desc    Get all users (Admin only - filtered by college for non-super-admin)
// @access  Private (Admin)
router.get('/users', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const query = {};
    
    // Non-super-admin users can only see users from their college
    if (req.user.role !== 'super_admin' && req.user.collegeId) {
      query.collegeId = req.user.collegeId;
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('collegeId', 'name email')
      .sort({ createdAt: -1 });
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
    const oldEmail = user.email;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
      
      // Notify admins about email change
      if (oldEmail !== email) {
        notifyEmailChanged(user, oldEmail, email, req.user.id)
          .catch(err => console.error('Error sending email change notification:', err));
      }
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

// ==================== COLLEGE MANAGEMENT (Super Admin Only) ====================

// @route   POST /api/settings/colleges
// @desc    Create new college/institute (Super Admin only)
// @access  Private (Super Admin)
router.post('/colleges', authenticate, authorize('super_admin'), [
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

    const { 
      name, 
      email, 
      password, 
      phone, 
      instituteType, 
      contactInfo, 
      registrationInfo,
      settings,
      subscription
    } = req.body;

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
      instituteType,
      contactInfo: {
        phone,
        ...contactInfo
      },
      registrationInfo,
      settings: {
        ...settings,
        logo: settings?.logo,
        theme: settings?.theme || {
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e'
        },
        currency: settings?.currency || 'USD',
        timezone: settings?.timezone || 'UTC'
      },
      subscription: {
        plan: subscription?.plan || 'free',
        startDate: subscription?.startDate || new Date(),
        endDate: subscription?.endDate,
        isActive: subscription?.isActive !== undefined ? subscription.isActive : true
      }
    });

    res.status(201).json({
      message: 'College created successfully',
      college: {
        id: college._id,
        name: college.name,
        email: college.email,
        instituteType: college.instituteType,
        isActive: college.isActive
      }
    });
  } catch (error) {
    console.error('Create college error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'College with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/colleges
// @desc    Get all colleges (Super Admin only)
// @access  Private (Super Admin)
router.get('/colleges', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { isActive, instituteType } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (instituteType) {
      query.instituteType = instituteType;
    }
    
    const colleges = await College.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(colleges);
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/settings/colleges/:collegeId/assign-admin
// @desc    Assign admin to college with permissions (Super Admin only)
// @access  Private (Super Admin)
router.post('/colleges/:collegeId/assign-admin', authenticate, authorize('super_admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profile.firstName').optional().trim(),
  body('profile.lastName').optional().trim(),
  body('profile.phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, profile, permissions } = req.body;
    const collegeId = req.params.collegeId;

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check if user already exists in this college
    const existingUser = await User.findOne({ email, collegeId });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists in this college' });
    }

    // Default permissions for admin
    const defaultPermissions = {
      manageStudents: true,
      manageTeachers: true,
      manageCourses: true,
      manageFees: true,
      manageAttendance: true,
      viewReports: true,
      manageSettings: false, // Only super admin can manage college settings
      manageUsers: true
    };

    // Create admin user
    const adminUser = await User.create({
      email: email.toLowerCase().trim(),
      password,
      tempPassword: password, // Store original password for super admin viewing
      role: 'admin',
      collegeId: collegeId,
      profile: {
        firstName: profile?.firstName || 'Admin',
        lastName: profile?.lastName || college.name,
        phone: profile?.phone || college.contactInfo?.phone
      },
      permissions: permissions || defaultPermissions
    });

    res.status(201).json({
      message: 'Admin assigned successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        collegeId: adminUser.collegeId,
        permissions: adminUser.permissions || defaultPermissions,
        profile: adminUser.profile
      }
    });
  } catch (error) {
    console.error('Assign admin error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/colleges/:collegeId/payment-config
// @desc    Configure payment system for college (Super Admin only)
// @access  Private (Super Admin)
router.put('/colleges/:collegeId/payment-config', authenticate, authorize('super_admin'), [
  body('paymentMethods').optional().isArray(),
  body('currency').optional().isString(),
  body('taxRate').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const college = await College.findById(req.params.collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const { paymentMethods, currency, taxRate, feeStructure, paymentGateway } = req.body;

    // Initialize paymentConfig if it doesn't exist
    if (!college.settings) {
      college.settings = {};
    }
    if (!college.settings.paymentConfig) {
      college.settings.paymentConfig = {};
    }

    // Update payment configuration
    if (paymentMethods) {
      college.settings.paymentConfig.paymentMethods = paymentMethods;
    }
    if (currency) {
      college.settings.currency = currency;
      college.settings.paymentConfig.currency = currency;
    }
    if (taxRate !== undefined) {
      college.settings.paymentConfig.taxRate = taxRate;
    }
    if (feeStructure) {
      college.settings.paymentConfig.feeStructure = feeStructure;
    }
    if (paymentGateway) {
      college.settings.paymentConfig.paymentGateway = paymentGateway;
    }

    await college.save();

    res.json({
      message: 'Payment configuration updated successfully',
      paymentConfig: college.settings.paymentConfig
    });
  } catch (error) {
    console.error('Update payment config error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

