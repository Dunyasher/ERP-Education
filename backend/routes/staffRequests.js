const express = require('express');
const router = express.Router();
const StaffRequest = require('../models/StaffRequest');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendNotificationToAdmins } = require('../utils/notifications');

// @route   POST /api/staff-requests
// @desc    Create a new staff request
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { role, requestedDetails } = req.body;

    if (!role || !['teacher', 'accountant', 'sweeper', 'security'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }

    const request = new StaffRequest({
      requestedBy: req.user.id,
      requestedByName: req.user.profile?.firstName 
        ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
        : req.user.email,
      requestedByEmail: req.user.email,
      role,
      requestedDetails: requestedDetails || {}
    });

    await request.save();

    // Send notification to super_admin (director)
    try {
      const directors = await User.find({ role: 'super_admin' });
      for (const director of directors) {
        await sendNotificationToAdmins({
          type: 'other',
          priority: 'high',
          title: `New Staff Request: ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          message: `${req.user.email} has requested to add a new ${role}. Please review and approve.`,
          recipientId: director._id,
          metadata: {
            requestId: request._id.toString(),
            requestedBy: req.user.email,
            role: role
          }
        });
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ 
      message: 'Staff request submitted successfully. Director will be notified.',
      request 
    });
  } catch (error) {
    console.error('Create staff request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/staff-requests
// @desc    Get all staff requests (super_admin only)
// @access  Private (Super Admin)
router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await StaffRequest.find(query)
      .populate('requestedBy', 'email profile')
      .populate('approvedBy', 'email profile')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get staff requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/staff-requests/:id/approve
// @desc    Approve a staff request and create the user account
// @access  Private (Super Admin)
router.put('/:id/approve', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const request = await StaffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    const { email, password, name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user account
    const nameParts = (name || '').split(' ');
    const newUser = new User({
      email: email.toLowerCase(),
      password: password || 'password123',
      role: request.role,
      profile: {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: phone || request.requestedDetails?.phone || ''
      }
    });

    await newUser.save();

    // Update request status
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedByName = req.user.profile?.firstName 
      ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
      : req.user.email;
    request.approvedAt = new Date();
    await request.save();

    res.json({ 
      message: 'Staff request approved and account created successfully',
      user: newUser,
      request 
    });
  } catch (error) {
    console.error('Approve staff request error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/staff-requests/:id/reject
// @desc    Reject a staff request
// @access  Private (Super Admin)
router.put('/:id/reject', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const request = await StaffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    const { rejectionReason } = req.body;

    request.status = 'rejected';
    request.approvedBy = req.user.id;
    request.approvedByName = req.user.profile?.firstName 
      ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
      : req.user.email;
    request.approvedAt = new Date();
    request.rejectionReason = rejectionReason || 'No reason provided';
    await request.save();

    res.json({ message: 'Staff request rejected', request });
  } catch (error) {
    console.error('Reject staff request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

