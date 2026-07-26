/**
 * Notification Routes
 * Handle in-app notifications for all user roles
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Notification = require('../models/Notification');

/**
 * GET /api/v1/notifications
 * Get all notifications for logged-in user
 * Query params: ?unreadOnly=true&limit=20
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { unreadOnly, limit = 20 } = req.query;

    const filter = { recipientId: req.user.userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: notifications.length,
      data: {
        notifications,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get count of unread notifications for logged-in user
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark one notification as read
 */
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user.userId, // Only allow marking own notifications
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for logged-in user
 */
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: req.user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
});

module.exports = router;
