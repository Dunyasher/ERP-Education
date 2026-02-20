const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const College = require('../models/College');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { addCollegeFilter, buildCollegeQuery } = require('../middleware/collegeFilter');

// @route   GET /api/colleges
// @desc    Get all colleges (Super Admin only)
// @access  Private (Super Admin)
router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
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

// @route   GET /api/colleges/:id
// @desc    Get college by ID (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id).select('-password');
    
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    
    res.json(college);
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/colleges
// @desc    Create new college/institute (Super Admin only)
// @access  Private (Super Admin)
router.post('/', authenticate, authorize('super_admin'), [
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

// @route   PUT /api/colleges/:id
// @desc    Update college (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', authenticate, authorize('super_admin'), [
  body('name').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('instituteType').optional().isIn(['school', 'college', 'academy', 'short_course'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, instituteType, contactInfo, registrationInfo, settings, subscription, isActive } = req.body;

    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== college.email) {
      const emailExists = await College.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      college.email = email;
    }

    if (name) college.name = name;
    if (phone) college.contactInfo.phone = phone;
    if (instituteType) college.instituteType = instituteType;
    if (contactInfo) college.contactInfo = { ...college.contactInfo, ...contactInfo };
    if (registrationInfo) college.registrationInfo = { ...college.registrationInfo, ...registrationInfo };
    if (settings) college.settings = { ...college.settings, ...settings };
    if (subscription) college.subscription = { ...college.subscription, ...subscription };
    if (typeof isActive === 'boolean') college.isActive = isActive;

    await college.save();

    res.json({
      message: 'College updated successfully',
      college: {
        id: college._id,
        name: college.name,
        email: college.email,
        instituteType: college.instituteType,
        isActive: college.isActive
      }
    });
  } catch (error) {
    console.error('Update college error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/colleges/:id/assign-admin
// @desc    Assign admin to college with permissions (Super Admin only)
// @access  Private (Super Admin)
router.post('/:id/assign-admin', authenticate, authorize('super_admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profile.firstName').optional().trim(),
  body('profile.lastName').optional().trim(),
  body('profile.phone').optional().trim(),
  body('permissions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, profile, permissions } = req.body;
    const collegeId = req.params.id;

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

// @route   GET /api/colleges/:id/admins
// @desc    Get all admins for a college (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id/admins', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const collegeId = req.params.id;
    
    const admins = await User.find({ 
      collegeId, 
      role: 'admin' 
    })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/colleges/:id/admins/:adminId/permissions
// @desc    Update admin permissions (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/admins/:adminId/permissions', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    const maadmin = await User.findOne({ 
      _id: adminId, 
      collegeId: req.params.id, 
      role: 'admin' 
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found in this college' });
    }

    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();

    res.json({
      message: 'Permissions updated successfully',
      user: {
        id: admin._id,
        email: admin.email,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/colleges/:id/payment-config
// @desc    Configure payment system for college (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/payment-config', authenticate, authorize('super_admin'), [
  body('paymentMethods').optional().isArray(),
  body('currency').optional().isString(),
  body('taxRate').optional().isNumeric(),
  body('feeStructure').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const college = await College.findById(req.params.id);
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

// @route   GET /api/colleges/:id/payment-config
// @desc    Get payment configuration for college (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id/payment-config', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id).select('settings.paymentConfig');
    
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    
    res.json({
      paymentConfig: college.settings?.paymentConfig || {},
      currency: college.settings?.currency || 'USD'
    });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/colleges/:id/stats
// @desc    Get college statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id/stats', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const collegeId = req.params.id;
    
    const [studentsCount, teachersCount, coursesCount, adminsCount] = await Promise.all([
      require('../models/Student').countDocuments({ collegeId }),
      require('../models/Teacher').countDocuments({ collegeId }),
      require('../models/Course').countDocuments({ collegeId }),
      User.countDocuments({ collegeId, role: 'admin' })
    ]);
    
    res.json({
      collegeId,
      students: studentsCount,
      teachers: teachersCount,
      courses: coursesCount,
      admins: adminsCount
    });
  } catch (error) {
    console.error('Get college stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/colleges/all-admins
// @desc    Get all admins across all colleges with details (Super Admin only)
// @desc    Shows: total count, admin names, phone numbers, and passwords
// @access  Private (Super Admin)
router.get('/all-admins', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    // Get all admins (not super_admin) with tempPassword included
    const admins = await User.find({ 
      role: 'admin'
    })
      .populate('collegeId', 'name email instituteType contactInfo')
      .select('+tempPassword email role profile collegeId isActive createdAt lastLogin permissions')
      .sort({ createdAt: -1 });
    
    // Get statistics
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(a => a.isActive).length;
    const inactiveAdmins = totalAdmins - activeAdmins;
    
    // Format admin data with college information
    const adminsData = admins.map(admin => ({
      id: admin._id,
      email: admin.email,
      name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim() || 'N/A',
      phone: admin.profile?.phone || admin.collegeId?.contactInfo?.phone || 'N/A',
      password: admin.tempPassword || 'Not set', // Show stored password or indicate not set
      college: {
        id: admin.collegeId?._id,
        name: admin.collegeId?.name || 'N/A',
        email: admin.collegeId?.email || 'N/A',
        instituteType: admin.collegeId?.instituteType || 'N/A'
      },
      isActive: admin.isActive,
      permissions: admin.permissions || {},
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }));
    
    res.json({
      summary: {
        totalAdmins: totalAdmins,
        activeAdmins: activeAdmins,
        inactiveAdmins: inactiveAdmins
      },
      admins: adminsData
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/colleges/admins/:adminId/reset-password
// @desc    Reset admin password (Super Admin only)
// @desc    Allows super admin to set a new password for any admin
// @access  Private (Super Admin)
router.put('/admins/:adminId/reset-password', authenticate, authorize('super_admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminId } = req.params;
    const { newPassword } = req.body;

    const admin = await User.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Reset password (will be hashed automatically by pre-save hook)
    admin.password = newPassword;
    admin.tempPassword = newPassword; // Store for super admin viewing
    await admin.save();

    res.json({
      message: 'Password reset successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim(),
        newPassword: newPassword // Return the new password so super admin can see it
      }
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/colleges/admins/:adminId/details
// @desc    Get detailed admin information including college details (Super Admin only)
// @access  Private (Super Admin)
router.get('/admins/:adminId/details', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = await User.findById(adminId)
      .populate('collegeId')
      .select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Get college statistics for this admin's college
    const collegeId = admin.collegeId?._id;
    let collegeStats = null;
    
    if (collegeId) {
      const [studentsCount, teachersCount, coursesCount] = await Promise.all([
        require('../models/Student').countDocuments({ collegeId }),
        require('../models/Teacher').countDocuments({ collegeId }),
        require('../models/Course').countDocuments({ collegeId })
      ]);
      
      collegeStats = {
        students: studentsCount,
        teachers: teachersCount,
        courses: coursesCount
      };
    }

    res.json({
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim(),
        phone: admin.profile?.phone || 'N/A',
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.permissions || {},
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
        srNo: admin.srNo
      },
      college: admin.collegeId ? {
        id: admin.collegeId._id,
        name: admin.collegeId.name,
        email: admin.collegeId.email,
        instituteType: admin.collegeId.instituteType,
        contactInfo: admin.collegeId.contactInfo,
        isActive: admin.collegeId.isActive
      } : null,
      collegeStats: collegeStats
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

