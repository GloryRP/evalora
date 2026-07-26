const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, authorize } = require('../middleware/auth');

// ============================================
// STUDENT PORTAL RESULTS ROUTES
// ============================================

router.get('/my-results', verifyToken, authorize('student'), resultController.getMyResults);
router.get('/my-results/:semester', verifyToken, authorize('student'), resultController.getMyResultForSemester);

// ============================================
// EXAM CELL RESULTS ROUTES
// ============================================

router.post('/compute', verifyToken, authorize('examcell'), resultController.computeResults);
router.get('/', verifyToken, authorize('examcell'), resultController.getResults);
router.post('/publish', verifyToken, authorize('examcell'), resultController.publishResults);
router.post('/publish/:resultId', verifyToken, authorize('examcell'), resultController.publishSingleResult);
router.get('/:studentId', verifyToken, authorize('examcell'), resultController.getStudentResults);

module.exports = router;
