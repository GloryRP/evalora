/**
 * QP Submission Routes
 * Fully automated multi-submission workflow:
 * Exam Cell auto-assigns → Faculty submit → Exam Cell reviews → selects final → archives others
 */

const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/qpSubmissionController');

// ─── FACULTY ROUTES (specific paths first to avoid :id conflicts) ──────────────

// GET /api/v1/qp-submissions/my-assignments
router.get('/my-assignments', verifyToken, authorize('faculty'), ctrl.getMyAssignments);

// GET /api/v1/qp-submissions/my-assignments/:id
router.get('/my-assignments/:id', verifyToken, authorize('faculty'), ctrl.getMyAssignment);

// PATCH /api/v1/qp-submissions/:id/save-draft
router.patch('/:id/save-draft', verifyToken, authorize('faculty'), ctrl.saveDraft);

// PATCH /api/v1/qp-submissions/:id/submit
router.patch('/:id/submit', verifyToken, authorize('faculty'), ctrl.submit);

// PATCH /api/v1/qp-submissions/:id/revise
router.patch('/:id/revise', verifyToken, authorize('faculty'), ctrl.revise);

// ─── EXAM CELL ROUTES ─────────────────────────────────────────────────────────

// POST /api/v1/qp-submissions/auto-assign  (must come before GET /)
router.post('/auto-assign', verifyToken, authorize('examcell'), ctrl.autoAssign);

// POST /api/v1/qp-submissions/select
router.post('/select', verifyToken, authorize('examcell'), ctrl.selectFinal);

// POST /api/v1/qp-submissions/send-reminder
router.post('/send-reminder', verifyToken, authorize('examcell'), ctrl.sendReminder);

// GET /api/v1/qp-submissions/subjects-preview
router.get('/subjects-preview', verifyToken, authorize('examcell'), ctrl.getSubjectsPreview);

// GET /api/v1/qp-submissions/overview
router.get('/overview', verifyToken, authorize('examcell'), ctrl.getOverview);

// GET /api/v1/qp-submissions/subject/:subjectId
router.get('/subject/:subjectId', verifyToken, authorize('examcell'), ctrl.getBySubject);

// GET /api/v1/qp-submissions  (all submissions — legacy)
router.get('/', verifyToken, authorize('examcell'), ctrl.getOverview);

// GET /api/v1/qp-submissions/:id
router.get('/:id', verifyToken, authorize('examcell'), ctrl.getOne);

// PATCH /api/v1/qp-submissions/:id/review
router.patch('/:id/review', verifyToken, authorize('examcell'), ctrl.review);

module.exports = router;
