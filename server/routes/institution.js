/**
 * Institution Configuration Routes
 * Admin endpoints for managing institution settings
 */

const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { verifyToken, authorize } = require('../middleware/auth');

// Get institution config
router.get('/config', institutionController.getConfig);

// Update institution config (admin or examcell only)
router.put('/config', verifyToken, authorize('admin', 'examcell'), institutionController.updateConfig);

// Get timetable-specific config
router.get('/timetable-config', institutionController.getTimetableConfig);

module.exports = router;
