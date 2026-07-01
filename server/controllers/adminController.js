const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Department = require('../models/Department');

// ==================== STUDENT CRUD ====================

/**
 * createStudent - Creates a new student and their User account
 * POST /api/v1/admin/students
 * Body: { usn, name, department, semester, email, phone, password }
 */
const createStudent = async (req, res) => {
  try {
    const { usn, name, department, semester, email, phone, password } = req.body;

    // Check if user with this USN already exists
    const existingUser = await User.findOne({ username: usn.toUpperCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this USN already exists.',
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record for authentication
    const user = await User.create({
      username: usn.toUpperCase(),
      passwordHash,
      role: 'student',
      name,
      department,
    });

    // Create Student profile record
    const student = await Student.create({
      usn: usn.toUpperCase(),
      name,
      department,
      semester,
      email,
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: student,
    });
  } catch (error) {
    console.error('Create student error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A student with this USN already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the student.',
      error: error.message,
    });
  }
};

/**
 * getStudents - Returns list of all students with optional filters
 * GET /api/v1/admin/students?department=CSE&semester=5
 */
const getStudents = async (req, res) => {
  try {
    const { department, semester } = req.query;

    // Build filter object based on query params
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);

    const students = await Student.find(filter).sort({ usn: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching students.',
    });
  }
};

/**
 * updateStudent - Updates a student's information
 * PUT /api/v1/admin/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, semester, email, phone } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { name, department, semester, email, phone },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // Also update the User record if name or department changed
    await User.findOneAndUpdate(
      { username: student.usn },
      { name, department }
    );

    res.json({
      success: true,
      message: 'Student updated successfully.',
      data: student,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the student.',
    });
  }
};

/**
 * deleteStudent - Deletes a student and their User account
 * DELETE /api/v1/admin/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // Delete the User account
    await User.findOneAndDelete({ username: student.usn });

    // Delete the Student profile
    await Student.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Student deleted successfully.',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the student.',
    });
  }
};

// ==================== FACULTY CRUD ====================

/**
 * createFaculty - Creates a new faculty member and their User account
 * POST /api/v1/admin/faculty
 */
const createFaculty = async (req, res) => {
  try {
    const { employeeId, name, department, designation, subjectsAssigned, email, phone, password } = req.body;

    // Check if user with this Employee ID already exists
    const existingUser = await User.findOne({ username: employeeId.toUpperCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this Employee ID already exists.',
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record
    const user = await User.create({
      username: employeeId.toUpperCase(),
      passwordHash,
      role: 'faculty',
      name,
      department,
    });

    // Create Faculty profile record
    const faculty = await Faculty.create({
      employeeId: employeeId.toUpperCase(),
      name,
      department,
      designation,
      subjectsAssigned: subjectsAssigned || [],
      email,
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully.',
      data: faculty,
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A faculty member with this Employee ID already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the faculty member.',
      error: error.message,
    });
  }
};

/**
 * getFaculty - Returns list of all faculty members with optional filters
 * GET /api/v1/admin/faculty?department=CSE
 */
const getFaculty = async (req, res) => {
  try {
    const { department } = req.query;

    const filter = {};
    if (department) filter.department = department;

    const faculty = await Faculty.find(filter)
      .populate('subjectsAssigned', 'subjectCode subjectName')
      .sort({ employeeId: 1 });

    res.json({
      success: true,
      count: faculty.length,
      data: faculty,
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching faculty members.',
    });
  }
};

/**
 * updateFaculty - Updates a faculty member's information
 * PUT /api/v1/admin/faculty/:id
 */
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, designation, subjectsAssigned, email, phone } = req.body;

    const faculty = await Faculty.findByIdAndUpdate(
      id,
      { name, department, designation, subjectsAssigned, email, phone },
      { new: true, runValidators: true }
    ).populate('subjectsAssigned', 'subjectCode subjectName');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.',
      });
    }

    // Update User record
    await User.findOneAndUpdate(
      { username: faculty.employeeId },
      { name, department }
    );

    res.json({
      success: true,
      message: 'Faculty member updated successfully.',
      data: faculty,
    });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the faculty member.',
    });
  }
};

/**
 * deleteFaculty - Deletes a faculty member and their User account
 * DELETE /api/v1/admin/faculty/:id
 */
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.',
      });
    }

    // Delete User account
    await User.findOneAndDelete({ username: faculty.employeeId });

    // Delete Faculty profile
    await Faculty.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Faculty member deleted successfully.',
    });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the faculty member.',
    });
  }
};

// ==================== SUBJECT CRUD ====================

/**
 * createSubject - Creates a new subject
 * POST /api/v1/admin/subjects
 */
const createSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, department, semester, credits } = req.body;

    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      department,
      semester,
      credits,
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      data: subject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A subject with this code already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the subject.',
      error: error.message,
    });
  }
};

/**
 * getSubjects - Returns list of all subjects with optional filters
 * GET /api/v1/admin/subjects?department=CSE&semester=5
 */
const getSubjects = async (req, res) => {
  try {
    const { department, semester } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);

    const subjects = await Subject.find(filter).sort({ subjectCode: 1 });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching subjects.',
    });
  }
};

/**
 * updateSubject - Updates a subject's information
 * PUT /api/v1/admin/subjects/:id
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, department, semester, credits } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      { subjectName, department, semester, credits },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    res.json({
      success: true,
      message: 'Subject updated successfully.',
      data: subject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the subject.',
    });
  }
};

/**
 * deleteSubject - Deletes a subject
 * DELETE /api/v1/admin/subjects/:id
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    res.json({
      success: true,
      message: 'Subject deleted successfully.',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the subject.',
    });
  }
};

// ==================== DEPARTMENT CRUD ====================

/**
 * createDepartment - Creates a new department
 * POST /api/v1/admin/departments
 */
const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentCode, hodId } = req.body;

    const department = await Department.create({
      departmentName,
      departmentCode: departmentCode.toUpperCase(),
      hodId: hodId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error) {
    console.error('Create department error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name or code already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the department.',
      error: error.message,
    });
  }
};

/**
 * getDepartments - Returns list of all departments
 * GET /api/v1/admin/departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hodId', 'name username role')
      .sort({ departmentCode: 1 });

    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching departments.',
    });
  }
};

/**
 * updateDepartment - Updates a department's information
 * PUT /api/v1/admin/departments/:id
 */
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName, hodId } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { departmentName, hodId },
      { new: true, runValidators: true }
    ).populate('hodId', 'name username role');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully.',
      data: department,
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the department.',
    });
  }
};

/**
 * deleteDepartment - Deletes a department
 * DELETE /api/v1/admin/departments/:id
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the department.',
    });
  }
};

module.exports = {
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
};
