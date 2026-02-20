const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const College = require('../models/College');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Expense = require('../models/Expense');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// 🏢 DASHBOARD & OVERVIEW
// ============================================

// @route   GET /api/super-admin/dashboard
// @desc    Get super admin dashboard overview with all metrics
// @access  Private (Super Admin)
router.get('/dashboard', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    // Get all colleges
    const colleges = await College.find({}).select('-password');
    
    // Calculate statistics
    const totalColleges = colleges.length;
    const activeColleges = colleges.filter(c => c.isActive && c.subscription?.isActive).length;
    const trialColleges = colleges.filter(c => c.subscription?.plan === 'free').length;
    const expiredColleges = colleges.filter(c => {
      if (!c.subscription?.endDate || c.subscription.plan === 'free') return false;
      return new Date(c.subscription.endDate) < new Date();
    }).length;
    const blockedColleges = colleges.filter(c => !c.isActive).length;

    // Get all admins
    const admins = await User.find({ role: 'admin' });
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(a => a.isActive).length;
    const blockedAdmins = totalAdmins - activeAdmins;

    // Get system-wide statistics
    const [totalStudents, totalTeachers, totalCourses, totalExpenses] = await Promise.all([
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      Course.countDocuments({}),
      Expense.countDocuments({})
    ]);

    // Calculate revenue (placeholder - integrate with payment gateway)
    const revenueData = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    };

    // Get colleges by subscription plan
    const collegesByPlan = {
      free: colleges.filter(c => c.subscription?.plan === 'free').length,
      basic: colleges.filter(c => c.subscription?.plan === 'basic').length,
      premium: colleges.filter(c => c.subscription?.plan === 'premium').length,
      enterprise: colleges.filter(c => c.subscription?.plan === 'enterprise').length
    };

    // Get expiring subscriptions (within 7 days)
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringColleges = colleges.filter(c => {
      if (!c.subscription?.endDate || c.subscription.plan === 'free') return false;
      const endDate = new Date(c.subscription.endDate);
      return endDate >= today && endDate <= sevenDaysFromNow;
    }).map(c => ({
      id: c._id,
      name: c.name,
      plan: c.subscription.plan,
      endDate: c.subscription.endDate,
      daysRemaining: Math.ceil((new Date(c.subscription.endDate) - today) / (1000 * 60 * 60 * 24))
    }));

    // Recent activity (last 5 colleges created)
    const recentColleges = colleges
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(c => ({
        id: c._id,
        name: c.name,
        type: c.instituteType,
        createdAt: c.createdAt
      }));

    res.json({
      overview: {
        totalColleges,
        activeColleges,
        trialColleges,
        expiredColleges,
        blockedColleges
      },
      admins: {
        total: totalAdmins,
        active: activeAdmins,
        blocked: blockedAdmins
      },
      systemStats: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalExpenses
      },
      revenue: revenueData,
      subscriptions: {
        byPlan: collegesByPlan,
        expiring: expiringColleges,
        expiringCount: expiringColleges.length
      },
      alerts: {
        expiringSubscriptions: expiringColleges.length,
        blockedColleges: blockedColleges,
        blockedAdmins: blockedAdmins
      },
      recentActivity: {
        newColleges: recentColleges
      }
    });
  } catch (error) {
    console.error('Super admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// 🏢 INSTITUTE MANAGEMENT
// ============================================

// @route   GET /api/super-admin/institutes
// @desc    Get all institutes with detailed information
// @access  Private (Super Admin)
router.get('/institutes', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status, plan, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status === 'active') {
      query.isActive = true;
      query['subscription.isActive'] = true;
    } else if (status === 'blocked') {
      query.isActive = false;
    } else if (status === 'expired') {
      query['subscription.endDate'] = { $lt: new Date() };
      query['subscription.plan'] = { $ne: 'free' };
    } else if (status === 'trial') {
      query['subscription.plan'] = 'free';
    }

    if (plan) {
      query['subscription.plan'] = plan;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const colleges = await College.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await College.countDocuments(query);

    // Get statistics for each college
    const collegesWithStats = await Promise.all(
      colleges.map(async (college) => {
        const [studentsCount, teachersCount, coursesCount] = await Promise.all([
          Student.countDocuments({ collegeId: college._id }),
          Teacher.countDocuments({ collegeId: college._id }),
          Course.countDocuments({ collegeId: college._id })
        ]);

        // Get admin for this college
        const admin = await User.findOne({ collegeId: college._id, role: 'admin' })
          .select('+tempPassword email profile phone isActive')
          .populate('collegeId', 'name');

        return {
          id: college._id,
          srNo: college.srNo,
          name: college.name,
          email: college.email,
          instituteType: college.instituteType,
          contactInfo: college.contactInfo,
          subscription: {
            plan: college.subscription?.plan || 'free',
            startDate: college.subscription?.startDate,
            endDate: college.subscription?.endDate,
            isActive: college.subscription?.isActive !== false,
            status: getSubscriptionStatus(college.subscription)
          },
          isActive: college.isActive,
          admin: admin ? {
            id: admin._id,
            email: admin.email,
            name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim() || 'N/A',
            phone: admin.profile?.phone || college.contactInfo?.phone || 'N/A',
            password: admin.tempPassword || 'Not set',
            isActive: admin.isActive
          } : null,
          statistics: {
            students: studentsCount,
            teachers: teachersCount,
            courses: coursesCount
          },
          createdAt: college.createdAt,
          lastLogin: college.lastLogin
        };
      })
    );

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      institutes: collegesWithStats
    });
  } catch (error) {
    console.error('Get institutes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/super-admin/institutes/:id
// @desc    Get single institute details
// @access  Private (Super Admin)
router.get('/institutes/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id).select('-password');
    
    if (!college) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Get statistics
    const [studentsCount, teachersCount, coursesCount] = await Promise.all([
      Student.countDocuments({ collegeId: college._id }),
      Teacher.countDocuments({ collegeId: college._id }),
      Course.countDocuments({ collegeId: college._id })
    ]);

    // Get admin
    const admin = await User.findOne({ collegeId: college._id, role: 'admin' })
      .select('+tempPassword email profile phone isActive');

    res.json({
      institute: {
        id: college._id,
        srNo: college.srNo,
        name: college.name,
        email: college.email,
        instituteType: college.instituteType,
        contactInfo: college.contactInfo,
        registrationInfo: college.registrationInfo,
        settings: college.settings,
        subscription: {
          plan: college.subscription?.plan || 'free',
          startDate: college.subscription?.startDate,
          endDate: college.subscription?.endDate,
          isActive: college.subscription?.isActive !== false,
          status: getSubscriptionStatus(college.subscription)
        },
        isActive: college.isActive,
        createdAt: college.createdAt,
        lastLogin: college.lastLogin
      },
      admin: admin ? {
        id: admin._id,
        email: admin.email,
        name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim(),
        phone: admin.profile?.phone || 'N/A',
        password: admin.tempPassword || 'Not set',
        isActive: admin.isActive,
        permissions: admin.permissions
      } : null,
      statistics: {
        students: studentsCount,
        teachers: teachersCount,
        courses: coursesCount
      }
    });
  } catch (error) {
    console.error('Get institute details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/super-admin/institutes
// @desc    Create new institute
// @access  Private (Super Admin)
router.post('/institutes', authenticate, authorize('super_admin'), [
  body('name').notEmpty().trim().withMessage('Institute name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('instituteType').isIn(['school', 'college', 'academy', 'short_course']).withMessage('Invalid institute type'),
  body('contactInfo.phone').optional().trim(),
  body('subscription.plan').optional().isIn(['free', 'basic', 'premium', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, instituteType, contactInfo, subscription, adminEmail, adminPassword } = req.body;

    // Check if college exists
    const collegeExists = await College.findOne({ email: email.toLowerCase().trim() });
    if (collegeExists) {
      return res.status(400).json({ message: 'College with this email already exists' });
    }

    // Create college
    const college = await College.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      instituteType: instituteType,
      contactInfo: contactInfo || {},
      subscription: {
        plan: subscription?.plan || 'free',
        startDate: subscription?.startDate ? new Date(subscription.startDate) : new Date(),
        endDate: subscription?.endDate ? new Date(subscription.endDate) : null,
        isActive: subscription?.isActive !== false
      },
      isActive: true
    });

    // Create admin user if provided
    let adminUser = null;
    if (adminEmail && adminPassword) {
      const adminEmailFinal = adminEmail.toLowerCase().trim();
      const adminExists = await User.findOne({ email: adminEmailFinal, collegeId: college._id });
      
      if (!adminExists) {
        adminUser = await User.create({
          email: adminEmailFinal,
          password: adminPassword,
          tempPassword: adminPassword,
          role: 'admin',
          collegeId: college._id,
          profile: {
            firstName: 'Admin',
            lastName: college.name
          },
          isActive: true,
          permissions: {
            manageStudents: true,
            manageTeachers: true,
            manageCourses: true,
            manageFees: true,
            manageAttendance: true,
            viewReports: true,
            manageUsers: true,
            manageSettings: false
          }
        });
      }
    }

    res.status(201).json({
      message: 'Institute created successfully',
      institute: {
        id: college._id,
        name: college.name,
        email: college.email,
        subscription: college.subscription
      },
      admin: adminUser ? {
        id: adminUser._id,
        email: adminUser.email,
        password: adminPassword
      } : null
    });
  } catch (error) {
    console.error('Create institute error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Institute with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/super-admin/institutes/:id
// @desc    Update institute
// @access  Private (Super Admin)
router.put('/institutes/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, instituteType, contactInfo, registrationInfo, settings } = req.body;
    
    const college = await College.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(instituteType && { instituteType }),
        ...(contactInfo && { contactInfo }),
        ...(registrationInfo && { registrationInfo }),
        ...(settings && { settings })
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!college) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.json({
      message: 'Institute updated successfully',
      institute: college
    });
  } catch (error) {
    console.error('Update institute error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/super-admin/institutes/:id/subscription
// @desc    Update institute subscription
// @access  Private (Super Admin)
router.put('/institutes/:id/subscription', authenticate, authorize('super_admin'), [
  body('plan').isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid plan'),
  body('startDate').optional().isISO8601().toDate(),
  body('endDate').optional().isISO8601().toDate(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { plan, startDate, endDate, isActive } = req.body;

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Update subscription
    if (plan) college.subscription.plan = plan;
    if (startDate) college.subscription.startDate = new Date(startDate);
    if (endDate) college.subscription.endDate = new Date(endDate);
    if (typeof isActive === 'boolean') college.subscription.isActive = isActive;

    await college.save();

    res.json({
      message: 'Subscription updated successfully',
      institute: {
        id: college._id,
        name: college.name,
        subscription: college.subscription
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/super-admin/institutes/:id/status
// @desc    Block/unblock institute
// @access  Private (Super Admin)
router.put('/institutes/:id/status', authenticate, authorize('super_admin'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const college = await College.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!college) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.json({
      message: `Institute ${isActive ? 'activated' : 'blocked'} successfully`,
      institute: {
        id: college._id,
        name: college.name,
        isActive: college.isActive
      }
    });
  } catch (error) {
    console.error('Update institute status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// 👥 ADMIN MANAGEMENT
// ============================================

// @route   GET /api/super-admin/admins
// @desc    Get all admins across all colleges
// @access  Private (Super Admin)
router.get('/admins', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { role: 'admin' };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'blocked') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const admins = await User.find(query)
      .select('+tempPassword email role profile collegeId isActive createdAt lastLogin permissions')
      .populate('collegeId', 'name email instituteType contactInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    const adminsData = admins.map(admin => ({
      id: admin._id,
      email: admin.email,
      name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim() || 'N/A',
      phone: admin.profile?.phone || admin.collegeId?.contactInfo?.phone || 'N/A',
      password: admin.tempPassword || 'Not set',
      college: admin.collegeId ? {
        id: admin.collegeId._id,
        name: admin.collegeId.name,
        email: admin.collegeId.email,
        instituteType: admin.collegeId.instituteType
      } : null,
      isActive: admin.isActive,
      permissions: admin.permissions || {},
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }));

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      admins: adminsData
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/super-admin/admins/:id/block
// @desc    Block/unblock an admin
// @access  Private (Super Admin)
router.put('/admins/:id/block', authenticate, authorize('super_admin'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const admin = await User.findById(id)
      .populate('collegeId', 'name email');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    admin.isActive = isActive;
    await admin.save();

    res.json({
      message: `Admin ${isActive ? 'unblocked' : 'blocked'} successfully`,
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim(),
        college: admin.collegeId ? {
          id: admin.collegeId._id,
          name: admin.collegeId.name,
          email: admin.collegeId.email
        } : null,
        isActive: admin.isActive,
        status: admin.isActive ? 'Active' : 'Blocked'
      }
    });
  } catch (error) {
    console.error('Block/unblock admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// 💳 SUBSCRIPTION & PAYMENT MANAGEMENT
// ============================================

// @route   GET /api/super-admin/payments
// @desc    Get all payment transactions (revenue tracking)
// @access  Private (Super Admin)
router.get('/payments', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { startDate, endDate, status, instituteId } = req.query;
    
    // Placeholder for payment integration
    // Integrate with Stripe, PayPal, or your payment gateway
    const payments = [];

    // Calculate revenue statistics
    const revenueStats = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
      byPlan: {
        free: 0,
        basic: 0,
        premium: 0,
        enterprise: 0
      }
    };

    res.json({
      payments,
      statistics: revenueStats,
      total: payments.length
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// 📊 ANALYTICS
// ============================================

// @route   GET /api/super-admin/analytics
// @desc    Get system-wide analytics
// @access  Private (Super Admin)
router.get('/analytics', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Growth metrics
    const colleges = await College.find({});
    const now = new Date();
    const newCollegesThisMonth = colleges.filter(c => {
      const created = new Date(c.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    // Usage statistics
    const [totalStudents, totalTeachers, totalCourses, totalExpenses] = await Promise.all([
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      Course.countDocuments({}),
      Expense.countDocuments({})
    ]);

    res.json({
      growth: {
        newCollegesThisMonth,
        totalColleges: colleges.length
      },
      usage: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalExpenses
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to determine subscription status
function getSubscriptionStatus(subscription) {
  if (!subscription || !subscription.endDate) {
    return subscription?.plan === 'free' ? 'trial' : 'active';
  }

  const endDate = new Date(subscription.endDate);
  const today = new Date();
  
  if (endDate < today) {
    return 'expired';
  } else if (endDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    return 'expiring';
  } else {
    return 'active';
  }
}

module.exports = router;

