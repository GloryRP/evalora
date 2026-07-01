/**
 * ExamCell Routes
 * Protected routes for exam cell personnel
 */

const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const examcellController = require('../controllers/examcellController');

// Apply authentication and authorization middleware to all routes
router.use(verifyToken);
router.use(authorize('examcell'));

// ============================================
// EXAM ROUTES
// ============================================

// Create a new exam
router.post('/exams', examcellController.createExam);

// Get all exams (with optional filters: ?status=scheduled&semester=5)
router.get('/exams', examcellController.getAllExams);

// Update an exam
router.put('/exams/:examId', examcellController.updateExam);

// Delete an exam
router.delete('/exams/:examId', examcellController.deleteExam);

// ============================================
// HALL ROUTES
// ============================================

// Create a new hall
router.post('/halls', examcellController.createHall);

// Get all halls
router.get('/halls', examcellController.getAllHalls);

// Update a hall
router.put('/halls/:hallId', examcellController.updateHall);

// ============================================
// AI AGENT ROUTES
// ============================================

// Run the complete AI pipeline (schedule + allocate + assign)
router.post('/agents/run-pipeline', examcellController.runFullPipeline);

// Run a single agent (for re-running one step)
router.post('/agents/run-single', examcellController.runSingleAgent);

// Get agent run logs
router.get('/agents/runs', examcellController.getAgentRuns);

// ============================================
// VIEW/QUERY ROUTES
// ============================================

// Get exam timetable (scheduled exams)
router.get('/timetable', examcellController.getTimetable);

// Get hall allocations (student-hall-seat mapping)
router.get('/hall-allocations', examcellController.getHallAllocations);

// Get invigilator assignments
router.get('/invigilator-assignments', examcellController.getInvigilatorAssignments);

module.exports = router;
