const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken, authorize } = require('../middleware/auth');
const User = require('../models/User');
const {
  // Stats
  getAdminStats,
  // Student CRUD
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  // Faculty CRUD
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  bulkCreateFaculty,
  // Subject CRUD
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects,
  // Department CRUD
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  bulkCreateDepartments,
} = require('../controllers/adminController');

// Apply verifyToken and authorize('admin') to all routes in this router
router.use(verifyToken);
router.use(authorize('admin'));

// ==================== STATS ====================
router.get('/stats', getAdminStats);

// ==================== STUDENT ROUTES ====================
router.post('/students/bulk', bulkCreateStudents);

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
router.post('/faculty/bulk', bulkCreateFaculty);

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
router.post('/subjects/bulk', bulkCreateSubjects);

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
    body('subjectType').optional().isIn(['theory', 'lab', 'integrated']).withMessage('Invalid subject type'),
    body('examConfig').optional().isObject().withMessage('examConfig must be an object'),
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
    body('subjectType').optional().isIn(['theory', 'lab', 'integrated']).withMessage('Invalid subject type'),
    body('examConfig').optional().isObject().withMessage('examConfig must be an object'),
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
router.post('/departments/bulk', bulkCreateDepartments);

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

// ==================== GRADING SCHEME CONFIGURATION ====================

const GradingScheme = require('../models/GradingScheme');

/**
 * @route   GET /api/v1/admin/grading-scheme
 * @desc    Get the active grading scheme
 * @access  Private (Admin only)
 */
router.get('/grading-scheme', async (req, res) => {
  try {
    let scheme = await GradingScheme.findOne({ isActive: true });
    if (!scheme) {
      scheme = await GradingScheme.create({
        schemeName: 'VTU 2015 Scheme',
        academicYear: '2024-25',
        isActive: true,
        passMarkPercentage: 40,
        gradeTable: [
          { minPercentage: 90, maxPercentage: 100, grade: 'O', gradePoint: 10, description: 'Outstanding' },
          { minPercentage: 80, maxPercentage: 89.99, grade: 'A+', gradePoint: 9, description: 'Excellent' },
          { minPercentage: 70, maxPercentage: 79.99, grade: 'A', gradePoint: 8, description: 'Very Good' },
          { minPercentage: 60, maxPercentage: 69.99, grade: 'B+', gradePoint: 7, description: 'Good' },
          { minPercentage: 55, maxPercentage: 59.99, grade: 'B', gradePoint: 6, description: 'Above Average' },
          { minPercentage: 50, maxPercentage: 54.99, grade: 'C', gradePoint: 5, description: 'Average' },
          { minPercentage: 40, maxPercentage: 49.99, grade: 'P', gradePoint: 4, description: 'Pass' },
          { minPercentage: 0, maxPercentage: 39.99, grade: 'F', gradePoint: 0, description: 'Fail' }
        ]
      });
    }
    res.json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch grading scheme', error: error.message });
  }
});

/**
 * @route   GET /api/v1/admin/grading-schemes/all
 * @desc    Get ALL grading schemes (history + active)
 * @access  Private (Admin only)
 */
router.get('/grading-schemes/all', async (req, res) => {
  try {
    const schemes = await GradingScheme.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch schemes', error: error.message });
  }
});

/**
 * @route   POST /api/v1/admin/grading-schemes
 * @desc    Create a brand-new grading scheme (does NOT overwrite active)
 * @access  Private (Admin only)
 */
router.post('/grading-schemes', async (req, res) => {
  try {
    const { schemeName, academicYear, gradeTable, passMarkPercentage, setActive } = req.body;
    if (!schemeName || !academicYear) {
      return res.status(400).json({ success: false, message: 'schemeName and academicYear are required' });
    }
    if (setActive) {
      await GradingScheme.updateMany({}, { isActive: false });
    }
    const scheme = await GradingScheme.create({
      schemeName,
      academicYear,
      gradeTable: gradeTable || [],
      passMarkPercentage: passMarkPercentage || 40,
      isActive: setActive ? true : false,
      updatedAt: new Date(),
    });
    res.status(201).json({ success: true, message: 'Scheme created successfully', data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create scheme', error: error.message });
  }
});

/**
 * @route   PUT /api/v1/admin/grading-scheme
 * @desc    Update the currently active grading scheme
 * @access  Private (Admin only)
 */
router.put('/grading-scheme', async (req, res) => {
  try {
    const { schemeName, academicYear, gradeTable, passMarkPercentage } = req.body;
    let scheme = await GradingScheme.findOne({ isActive: true });
    if (!scheme) {
      scheme = new GradingScheme({ isActive: true });
    }
    if (schemeName) scheme.schemeName = schemeName;
    if (academicYear) scheme.academicYear = academicYear;
    if (passMarkPercentage !== undefined) scheme.passMarkPercentage = passMarkPercentage;
    if (gradeTable && Array.isArray(gradeTable)) scheme.gradeTable = gradeTable;
    scheme.updatedAt = new Date();
    await scheme.save();
    res.json({ success: true, message: 'Grading scheme updated successfully', data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update grading scheme', error: error.message });
  }
});

/**
 * @route   PUT /api/v1/admin/grading-schemes/:id/activate
 * @desc    Set a specific scheme as the active one
 * @access  Private (Admin only)
 */
router.put('/grading-schemes/:id/activate', async (req, res) => {
  try {
    await GradingScheme.updateMany({}, { isActive: false });
    const scheme = await GradingScheme.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedAt: new Date() },
      { new: true }
    );
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, message: `"${scheme.schemeName}" is now the active scheme`, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate scheme', error: error.message });
  }
});

/**
 * @route   PUT /api/v1/admin/grading-schemes/:id
 * @desc    Update a specific scheme by ID
 * @access  Private (Admin only)
 */
router.put('/grading-schemes/:id', async (req, res) => {
  try {
    const { schemeName, academicYear, gradeTable, passMarkPercentage } = req.body;
    const scheme = await GradingScheme.findByIdAndUpdate(
      req.params.id,
      { schemeName, academicYear, gradeTable, passMarkPercentage, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, message: 'Scheme updated', data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update scheme', error: error.message });
  }
});

/**
 * @route   DELETE /api/v1/admin/grading-schemes/:id
 * @desc    Delete a grading scheme (cannot delete the active one)
 * @access  Private (Admin only)
 */
router.delete('/grading-schemes/:id', async (req, res) => {
  try {
    const scheme = await GradingScheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    if (scheme.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot delete the active scheme. Activate another scheme first.' });
    }
    await GradingScheme.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Scheme deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete scheme', error: error.message });
  }
});

/**
 * @route   PATCH /api/v1/admin/users/:userId/reset-password
 * @desc    Admin resets a user's password
 * @access  Private (Admin only)
 */
router.patch('/users/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    // Validate admin is not resetting their own password
    if (userId === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Use the change-password endpoint to update your own password' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      isFirstLogin: true, // Forces user to change on next login
      updatedAt: new Date()
    });

    // Send notification to user (if notification system exists)
    const { sendNotification } = require('../services/notificationService');
    try {
      await sendNotification({
        userId: user._id,
        type: 'general',
        title: 'Password Reset',
        message: 'Your password has been reset by Admin. Please log in and change your password.',
        priority: 'high'
      });
    } catch (notifError) {
      console.log('Could not send notification:', notifError.message);
    }

    res.json({ 
      success: true, 
      message: 'Password reset successfully. User will be prompted to change it on next login.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users by role
 * @access  Private (Admin only)
 */
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ name: 1 });

    res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

// ==================== HALL ROUTES ====================

const Hall = require('../models/Hall');

/**
 * @route   GET /api/v1/admin/halls
 * @desc    Get all halls
 * @access  Private (Admin only)
 */
router.get('/halls', async (req, res) => {
  try {
    const halls = await Hall.find({}).sort({ building: 1, hallName: 1 });
    res.json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch halls', error: error.message });
  }
});

/**
 * @route   POST /api/v1/admin/halls
 * @desc    Create a new hall
 * @access  Private (Admin only)
 */
router.post('/halls', async (req, res) => {
  try {
    const { hallName, building, capacity, floor, facilities } = req.body;
    
    if (!hallName || !capacity) {
      return res.status(400).json({ success: false, message: 'Hall name and capacity are required' });
    }

    const existingHall = await Hall.findOne({ hallName });
    if (existingHall) {
      return res.status(400).json({ success: false, message: 'A hall with this name already exists' });
    }

    const hall = await Hall.create({
      hallName,
      building: building || 'Main',
      capacity,
      floor,
      facilities: facilities || []
    });

    res.status(201).json({ success: true, message: 'Hall created successfully', data: hall });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create hall', error: error.message });
  }
});

/**
 * @route   PUT /api/v1/admin/halls/:id
 * @desc    Update a hall
 * @access  Private (Admin only)
 */
router.put('/halls/:id', async (req, res) => {
  try {
    const { hallName, building, capacity, floor, facilities } = req.body;
    
    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      { hallName, building, capacity, floor, facilities },
      { new: true, runValidators: true }
    );

    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    res.json({ success: true, message: 'Hall updated successfully', data: hall });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update hall', error: error.message });
  }
});

/**
 * @route   DELETE /api/v1/admin/halls/:id
 * @desc    Delete a hall
 * @access  Private (Admin only)
 */
router.delete('/halls/:id', async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);
    
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    res.json({ success: true, message: 'Hall deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete hall', error: error.message });
  }
});

module.exports = router;
