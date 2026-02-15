const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly, type, limit } = req.query;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const query = {
      $or: [
        { recipientId: req.user.id },
        { recipientRole: req.user.role || 'all' },
        { recipientRole: 'all' }
      ]
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    const limitNum = limit ? Math.min(parseInt(limit), 500) : 100; // Max 500

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    res.json(notifications || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/notifications/unread/count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const count = await Notification.countDocuments({
      $or: [
        { recipientId: req.user.id },
        { recipientRole: req.user.role || 'all' },
        { recipientRole: 'all' }
      ],
      isRead: false
    }).catch(() => 0); // Return 0 if count fails

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.json({ count: 0 }); // Return 0 instead of error
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const result = await Notification.updateMany(
      {
        $or: [
          { recipientId: req.user.id },
          { recipientRole: req.user.role || 'all' },
          { recipientRole: 'all' }
        ],
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount || 0
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

