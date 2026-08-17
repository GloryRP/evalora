/**
 * Question Paper Submission Routes
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const qpSubmissionController = require('../controllers/qpSubmissionController');

// ━━━ EXAM CELL ROUTES ━━━
router.post(
  '/auto-assign',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.autoAssign
);

router.get(
  '/overview',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.getOverview
);

router.get(
  '/subject/:subjectId',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.getBySubject
);

router.patch(
  '/:id/review',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.review
);

router.post(
  '/select',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.selectFinal
);

router.post(
  '/send-reminder',
  verifyToken,
  authorize('examcell'),
  qpSubmissionController.sendReminder
);

// ━━━ FACULTY ROUTES ━━━
router.get(
  '/my-assignments',
  verifyToken,
  authorize('faculty'),
  qpSubmissionController.getMyAssignments
);

router.get(
  '/my-assignments/:id',
  verifyToken,
  authorize('faculty'),
  qpSubmissionController.getMyAssignment
);

router.patch(
  '/:id/save-draft',
  verifyToken,
  authorize('faculty'),
  qpSubmissionController.saveDraft
);

router.patch(
  '/:id/submit',
  verifyToken,
  authorize('faculty'),
  qpSubmissionController.submit
);

router.patch(
  '/:id/revise',
  verifyToken,
  authorize('faculty'),
  qpSubmissionController.revise
);

// ━━━ SHARED ROUTES (Both Exam Cell and Faculty) ━━━
router.get(
  '/:id',
  verifyToken,
  authorize('examcell', 'faculty'),
  qpSubmissionController.getOne
);

module.exports = router;
