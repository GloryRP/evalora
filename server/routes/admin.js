const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const {
  // Student CRUD
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  // Faculty CRUD
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  // Subject CRUD
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  // Department CRUD
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/adminController');

// Apply verifyToken and authorize('admin') to all routes in this router
router.use(verifyToken);
router.use(authorize('admin'));

// ==================== STUDENT ROUTES ====================

/**
 * @route   POST /api/v1/admin/students
 * @desc    Create a new student
 * @access  Private (Admin only)
 */
router.post(
  '/students',
  [
    body('usn').trim().notEmpty().withMessage('USN is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  ],
  createStudent
);

/**
 * @route   GET /api/v1/admin/students
 * @desc    Get all students (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/students', getStudents);

/**
 * @route   PUT /api/v1/admin/students/:id
 * @desc    Update a student
 * @access  Private (Admin only)
 */
router.put(
  '/students/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  ],
  updateStudent
);

/**
 * @route   DELETE /api/v1/admin/students/:id
 * @desc    Delete a student
 * @access  Private (Admin only)
 */
router.delete('/students/:id', deleteStudent);

// ==================== FACULTY ROUTES ====================

/**
 * @route   POST /api/v1/admin/faculty
 * @desc    Create a new faculty member
 * @access  Private (Admin only)
 */
router.post(
  '/faculty',
  [
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  ],
  createFaculty
);

/**
 * @route   GET /api/v1/admin/faculty
 * @desc    Get all faculty members (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/faculty', getFaculty);

/**
 * @route   PUT /api/v1/admin/faculty/:id
 * @desc    Update a faculty member
 * @access  Private (Admin only)
 */
router.put(
  '/faculty/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  ],
  updateFaculty
);

/**
 * @route   DELETE /api/v1/admin/faculty/:id
 * @desc    Delete a faculty member
 * @access  Private (Admin only)
 */
router.delete('/faculty/:id', deleteFaculty);

// ==================== SUBJECT ROUTES ====================

/**
 * @route   POST /api/v1/admin/subjects
 * @desc    Create a new subject
 * @access  Private (Admin only)
 */
router.post(
  '/subjects',
  [
    body('subjectCode').trim().notEmpty().withMessage('Subject code is required'),
    body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  ],
  createSubject
);

/**
 * @route   GET /api/v1/admin/subjects
 * @desc    Get all subjects (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/subjects', getSubjects);

/**
 * @route   PUT /api/v1/admin/subjects/:id
 * @desc    Update a subject
 * @access  Private (Admin only)
 */
router.put(
  '/subjects/:id',
  [
    body('subjectName').optional().trim().notEmpty().withMessage('Subject name cannot be empty'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('credits').optional().isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  ],
  updateSubject
);

/**
 * @route   DELETE /api/v1/admin/subjects/:id
 * @desc    Delete a subject
 * @access  Private (Admin only)
 */
router.delete('/subjects/:id', deleteSubject);

// ==================== DEPARTMENT ROUTES ====================

/**
 * @route   POST /api/v1/admin/departments
 * @desc    Create a new department
 * @access  Private (Admin only)
 */
router.post(
  '/departments',
  [
    body('departmentName').trim().notEmpty().withMessage('Department name is required'),
    body('departmentCode').trim().notEmpty().withMessage('Department code is required'),
  ],
  createDepartment
);

/**
 * @route   GET /api/v1/admin/departments
 * @desc    Get all departments
 * @access  Private (Admin only)
 */
router.get('/departments', getDepartments);

/**
 * @route   PUT /api/v1/admin/departments/:id
 * @desc    Update a department
 * @access  Private (Admin only)
 */
router.put(
  '/departments/:id',
  [
    body('departmentName').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
  ],
  updateDepartment
);

/**
 * @route   DELETE /api/v1/admin/departments/:id
 * @desc    Delete a department
 * @access  Private (Admin only)
 */
router.delete('/departments/:id', deleteDepartment);

module.exports = router;
