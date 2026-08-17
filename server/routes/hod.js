/**
 * HOD Routes - Department-specific Head of Department operations
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const hodController = require('../controllers/hodController');

// Apply authentication and HOD authorization to all routes
router.use(verifyToken);
router.use(authorize('hod'));

/**
 * @route   GET /api/v1/hod/profile
 * @desc    Get HOD profile information
 * @access  Private (HOD only)
 */
router.get('/profile', hodController.getProfile);

/**
 * @route   GET /api/v1/hod/insights
 * @desc    Get department insights and performance data
 * @access  Private (HOD only)
 */
router.get('/insights', hodController.getInsights);

module.exports = router;