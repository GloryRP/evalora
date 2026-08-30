/**
 * ExamCell Routes
 * Protected routes for exam cell personnel
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, authorize } = require('../middleware/auth');
const examcellController = require('../controllers/examcellController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/answer-scripts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Apply authentication and authorization middleware to all routes
router.use(verifyToken);

// Route-level role authorization
router.use((req, res, next) => {
  if (req.path === '/halls' && req.method === 'GET') {
    return authorize('examcell', 'admin')(req, res, next);
  }
  if (req.path.startsWith('/halls')) {
    return authorize('admin')(req, res, next);
  }
  if (req.path.startsWith('/question-papers/exam/')) {
    return authorize('examcell', 'admin', 'faculty')(req, res, next);
  }
  return authorize('examcell', 'admin')(req, res, next);
});

// ============================================
// SUBJECTS ROUTES (for scheduling)
// ============================================

// Get all subjects (needed for exam scheduling)
router.get('/subjects', examcellController.getAllSubjects);

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

// Delete an entire exam series (by semester & examType)
router.delete('/exams/series/delete', examcellController.deleteExamSeries);

// ============================================
// HALL ROUTES
// ============================================

// Create a new hall
router.post('/halls', examcellController.createHall);

// Get all halls
router.get('/halls', examcellController.getAllHalls);

// Update a hall
router.put('/halls/:hallId', examcellController.updateHall);

// Delete a hall
router.delete('/halls/:hallId', examcellController.deleteHall);

// ============================================
// AI AGENT ROUTES
// ============================================

// Run the complete AI pipeline (schedule + allocate + assign)
router.post('/agents/run-pipeline', examcellController.runFullPipeline);

// Run a single agent (for re-running one step)
router.post('/agents/run-single', examcellController.runSingleAgent);

// Run seating allocation and invigilator assignment separately
router.post('/hall-allocations/generate', examcellController.runHallAllocationAgentSeparate);
router.post('/invigilator-assignments/generate', examcellController.runInvigilatorAgentSeparate);

// Get agent run logs
router.get('/agents/runs', examcellController.getAgentRuns);

// ============================================
// VIEW/QUERY ROUTES
// ============================================

// Get exam timetable (scheduled exams)
router.get('/timetable', examcellController.getTimetable);
router.post('/timetable/generate', examcellController.generateTimetable);
router.post('/timetable/confirm', examcellController.confirmTimetable);

// Get hall allocations (student-hall-seat mapping)
router.get('/hall-allocations', examcellController.getHallAllocations);

// Get invigilator assignments
router.get('/invigilator-assignments', examcellController.getInvigilatorAssignments);

// ============================================
// ANSWER SCRIPT & MARKS ROUTES
// ============================================

// Get students for dropdown
router.get('/students', examcellController.getStudents);

// Get faculty for dropdown
router.get('/faculty', examcellController.getFaculty);

const Department = require('../models/Department');
router.get('/departments', async (req, res) => {
  try {
    const depts = await Department.find({});
    res.json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
  }
});

// Upload answer script (single file)
router.post('/answer-scripts/upload', upload.single('file'), examcellController.uploadAnswerScript);

// Bulk upload answer scripts (subject-wise / list of USNs)
router.post('/answer-scripts/bulk-upload', examcellController.bulkUploadAnswerScripts);

// AI-Assisted Bulk upload answer scripts (subject-wise / scanned booklets files array)
router.post('/answer-scripts/bulk-upload-ai', upload.array('files'), examcellController.bulkUploadAnswerScriptsAI);

// Assign evaluator
router.post('/answer-scripts/assign-evaluator', examcellController.assignEvaluator);

// Manual evaluator assignment (NEW - FIX 5)
router.patch('/answer-scripts/manual-assign-evaluator', examcellController.manualAssignEvaluator);

// Bulk bundle distribution to faculty
router.post('/answer-scripts/bundle-distribute', examcellController.bundleDistributeAnswerScripts);

// Get evaluations for review
router.get('/answer-scripts/review', examcellController.getEvaluationsForReview);


// Publish results
router.post('/answer-scripts/publish', examcellController.publishResults);


// ============================================
// QP TEMPLATE ROUTES (global per exam type + exceptions)
// ============================================

const QPTemplate = require('../models/QPTemplate');
const Subject = require('../models/Subject');

// GET all QP templates (one per exam type)
router.get('/qp-templates', async (req, res) => {
  try {
    const templates = await QPTemplate.find().populate('exceptions.subjectId', 'subjectCode subjectName department credits');
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: err.message });
  }
});

// GET single QP template by examType
router.get('/qp-templates/:examType', async (req, res) => {
  try {
    const template = await QPTemplate.findOne({ examType: req.params.examType })
      .populate('exceptions.subjectId', 'subjectCode subjectName department credits');
    res.json({ success: true, data: template || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch template', error: err.message });
  }
});

// POST / PUT - Save or update a global template for an exam type
router.post('/qp-templates', async (req, res) => {
  try {
    const { examType, maxMarks, slots, questions, exceptions } = req.body;
    if (!examType) {
      return res.status(400).json({ success: false, message: 'examType is required' });
    }
    let template = await QPTemplate.findOne({ examType });
    if (template) {
      template.maxMarks = maxMarks;
      if (slots) template.slots = slots;
      if (questions) template.questions = questions;
      if (exceptions) template.exceptions = exceptions;
      await template.save();
    } else {
      template = await QPTemplate.create({ examType, maxMarks, slots: slots || [], questions: questions || [], exceptions: exceptions || [] });
    }
    const populated = await QPTemplate.findById(template._id)
      .populate('exceptions.subjectId', 'subjectCode subjectName department credits');
    res.json({ success: true, message: 'Template saved successfully', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save template', error: err.message });
  }
});


// ============================================
// QUESTION PAPERS ROUTES
// ============================================

router.get('/question-papers', examcellController.getAllQuestionPapers);
router.post('/question-papers', examcellController.createQuestionPaper);
router.get('/question-papers/exam/:examId', examcellController.getQuestionPaperByExam);
router.put('/question-papers/:paperId/approve', examcellController.approveQuestionPaper);

// ============================================
// EVALUATION AI AGENT ROUTES
// ============================================

router.post('/agents/run-evaluation', examcellController.runEvaluationAgent);

module.exports = router;
