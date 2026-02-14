const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/audit
// @desc    Get all audit logs (Admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      role,
      userId,
      targetType,
      startDate,
      endDate,
      requiresApproval,
      isApproved
    } = req.query;

    const query = {};

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by role
    if (role) {
      query['performedBy.role'] = role;
    }

    // Filter by user
    if (userId) {
      query['performedBy.userId'] = userId;
    }

    // Filter by target type
    if (targetType) {
      query.targetType = targetType;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Filter by approval status
    if (requiresApproval !== undefined) {
      query.requiresApproval = requiresApproval === 'true';
    }

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(query)
      .populate('performedBy.userId', 'email role profile')
      .populate('approvedBy.userId', 'email role profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/audit/teacher/:teacherId
// @desc    Get audit logs for a specific teacher (Admin only)
// @access  Private (Admin)
router.get('/teacher/:teacherId', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find({ 'performedBy.userId': teacherId })
      .populate('performedBy.userId', 'email role profile')
      .populate('approvedBy.userId', 'email role profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AuditLog.countDocuments({ 'performedBy.userId': teacherId });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching teacher audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/audit/pending-approvals
// @desc    Get all pending approvals (Admin only)
// @access  Private (Admin)
router.get('/pending-approvals', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find({
      requiresApproval: true,
      isApproved: false
    })
      .populate('performedBy.userId', 'email role profile')
      .sort({ createdAt: -1 });

    res.json({ logs, count: logs.length });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/audit/:logId/approve
// @desc    Approve a pending action (Admin only)
// @access  Private (Admin)
router.put('/:logId/approve', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await AuditLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    if (!log.requiresApproval) {
      return res.status(400).json({ message: 'This action does not require approval' });
    }

    if (log.isApproved) {
      return res.status(400).json({ message: 'This action is already approved' });
    }

    log.isApproved = true;
    log.approvedBy = {
      userId: req.user._id,
      email: req.user.email,
      name: req.user.profile?.firstName 
        ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
        : req.user.email,
      approvedAt: new Date()
    };

    await log.save();

    res.json({ message: 'Action approved successfully', log });
  } catch (error) {
    console.error('Error approving action:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/audit/stats
// @desc    Get audit statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = {
      total: await AuditLog.countDocuments(dateQuery),
      byAction: await AuditLog.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      byRole: await AuditLog.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$performedBy.role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      pendingApprovals: await AuditLog.countDocuments({
        ...dateQuery,
        requiresApproval: true,
        isApproved: false
      }),
      today: await AuditLog.countDocuments({
        ...dateQuery,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

