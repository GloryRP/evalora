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

// Academic Year Management Routes (PUBLIC - no auth)
router.get('/current', institutionController.getCurrent);
router.get('/academic-years', institutionController.getAcademicYears);

// Academic Year Management Routes (ADMIN only)
router.post('/academic-years', verifyToken, authorize('admin'), institutionController.addAcademicYear);
router.put('/academic-years/current', verifyToken, authorize('admin'), institutionController.updateCurrent);

module.exports = router;
