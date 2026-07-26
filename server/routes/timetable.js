/**
 * Timetable Routes
 * Endpoints for generating timetable PDFs and previews
 */

const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, authorize } = require('../middleware/auth');

// Generate timetable PDF (protected - exam cell and admin)
router.get(
  '/pdf',
  verifyToken,
  authorize('admin', 'examcell'),
  timetableController.generateTimetablePDF
);

// Preview timetable (protected)
router.get(
  '/preview',
  verifyToken,
  authorize('admin', 'examcell'),
  timetableController.previewTimetable
);

module.exports = router;
