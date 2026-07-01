/**
 * ExamCell Controller
 * Handles exam management, hall management, and AI agent orchestration
 */

const axios = require('axios');
const Exam = require('../models/Exam');
const Hall = require('../models/Hall');
const HallAllocation = require('../models/HallAllocation');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const AgentRun = require('../models/AgentRun');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ============================================
// EXAM CRUD OPERATIONS
// ============================================

/**
 * Create a new exam
 */
exports.createExam = async (req, res) => {
  try {
    const { subjectId, examDate, startTime, endTime, semester, examType } = req.body;

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const exam = await Exam.create({
      subjectId,
      examDate,
      startTime,
      endTime,
      semester,
      examType,
      status: 'draft',
    });

    await exam.populate('subjectId');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }
};

/**
 * Get all exams with optional filters
 */
exports.getAllExams = async (req, res) => {
  try {
    const { status, semester, examType } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;

    const exams = await Exam.find(filter)
      .populate('subjectId')
      .sort({ examDate: 1, startTime: 1 });

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

/**
 * Update an exam
 */
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updates = req.body;

    const exam = await Exam.findByIdAndUpdate(examId, updates, { new: true, runValidators: true })
      .populate('subjectId');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam,
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
  }
};

/**
 * Delete an exam
 */
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Clean up related data
    await HallAllocation.deleteMany({ examId });
    await InvigilatorAssignment.deleteMany({ examId });

    res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }
};

// ============================================
// HALL CRUD OPERATIONS
// ============================================

/**
 * Create a new hall
 */
exports.createHall = async (req, res) => {
  try {
    const { hallName, capacity, building, floor, facilities } = req.body;

    const hall = await Hall.create({
      hallName,
      capacity,
      building,
      floor,
      facilities,
    });

    res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      data: hall,
    });
  } catch (error) {
    console.error('Error creating hall:', error);
    res.status(500).json({ success: false, message: 'Failed to create hall', error: error.message });
  }
};

/**
 * Get all halls
 */
exports.getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.find().sort({ hallName: 1 });

    res.json({
      success: true,
      count: halls.length,
      data: halls,
    });
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch halls', error: error.message });
  }
};

/**
 * Update a hall
 */
exports.updateHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const updates = req.body;

    const hall = await Hall.findByIdAndUpdate(hallId, updates, { new: true, runValidators: true });

    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    res.json({
      success: true,
      message: 'Hall updated successfully',
      data: hall,
    });
  } catch (error) {
    console.error('Error updating hall:', error);
    res.status(500).json({ success: false, message: 'Failed to update hall', error: error.message });
  }
};

// ============================================
// AI AGENT ORCHESTRATION
// ============================================

/**
 * Run the complete AI pipeline
 * Calls Python AI service to schedule exams, allocate halls, and assign invigilators
 */
exports.runFullPipeline = async (req, res) => {
  try {
    const { subjectIds, constraints = {} } = req.body;

    // Fetch required data from database
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
    const students = await Student.find().lean();
    const faculty = await Faculty.find().lean();
    const halls = await Hall.find().lean();

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects selected' });
    }

    // Create AgentRun record
    const agentRun = await AgentRun.create({
      agentType: 'orchestrator',
      status: 'running',
      inputData: {
        subjectIds,
        constraints,
        counts: {
          subjects: subjects.length,
          students: students.length,
          faculty: faculty.length,
          halls: halls.length,
        },
      },
      triggeredBy: req.user.username,
    });

    try {
      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/agents/run-pipeline`, {
        subjects,
        students,
        faculty,
        halls,
        constraints,
      }, {
        timeout: 60000, // 60 second timeout
      });

      const result = response.data.result;

      // Save scheduled exams
      const examDocs = [];
      for (const exam of result.scheduled_exams) {
        const examDoc = await Exam.create({
          subjectId: exam.subjectId,
          examDate: exam.examDate,
          startTime: exam.startTime,
          endTime: exam.endTime,
          semester: exam.semester,
          examType: exam.examType || 'regular',
          status: 'scheduled',
        });
        examDocs.push(examDoc);
      }

      // Save hall allocations
      for (const allocation of result.hall_allocations) {
        await HallAllocation.create({
          examId: allocation.examId,
          hallId: allocation.hallId,
          studentId: allocation.studentId,
          seatNumber: allocation.seatNumber,
        });
      }

      // Save invigilator assignments
      for (const assignment of result.invigilator_assignments) {
        await InvigilatorAssignment.create({
          examId: assignment.examId,
          hallId: assignment.hallId,
          facultyId: assignment.facultyId,
          role: assignment.role,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
        });
      }

      // Update AgentRun with success
      agentRun.status = 'completed';
      agentRun.outputData = result;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      res.json({
        success: true,
        message: 'Pipeline completed successfully',
        data: {
          agentRunId: agentRun._id,
          examsCreated: examDocs.length,
          allocationsCreated: result.hall_allocations.length,
          assignmentsCreated: result.invigilator_assignments.length,
          result,
        },
      });

    } catch (aiError) {
      // Update AgentRun with failure
      agentRun.status = 'failed';
      agentRun.errorMessage = aiError.message;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      throw aiError;
    }

  } catch (error) {
    console.error('Error running pipeline:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run pipeline', 
      error: error.message,
      details: error.response?.data || null,
    });
  }
};

/**
 * Run a single agent (re-run one step)
 */
exports.runSingleAgent = async (req, res) => {
  try {
    const { agentType, inputData, constraints = {} } = req.body;

    const validAgents = ['scheduling', 'hall_allocation', 'invigilator'];
    if (!validAgents.includes(agentType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid agent type. Must be one of: scheduling, hall_allocation, invigilator' 
      });
    }

    // Create AgentRun record
    const agentRun = await AgentRun.create({
      agentType,
      status: 'running',
      inputData,
      triggeredBy: req.user.username,
    });

    try {
      let endpoint = '';
      let payload = {};

      // Prepare endpoint and payload based on agent type
      switch (agentType) {
        case 'scheduling':
          endpoint = '/agents/schedule';
          const subjects = await Subject.find({ _id: { $in: inputData.subjectIds } }).lean();
          payload = { subjects, constraints };
          break;

        case 'hall_allocation':
          const exams = await Exam.find({ _id: { $in: inputData.examIds } }).lean();
          const students = await Student.find().lean();
          const halls = await Hall.find().lean();
          endpoint = '/agents/allocate-halls';
          payload = { exams, students, halls, constraints };
          break;

        case 'invigilator':
          const examsForInv = await Exam.find({ _id: { $in: inputData.examIds } }).lean();
          const faculty = await Faculty.find().lean();
          endpoint = '/agents/assign-invigilators';
          payload = { exams: examsForInv, faculty, constraints };
          break;
      }

      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, payload, {
        timeout: 30000,
      });

      const result = response.data.result;

      // Update AgentRun with success
      agentRun.status = 'completed';
      agentRun.outputData = result;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      res.json({
        success: true,
        message: `${agentType} agent completed successfully`,
        data: {
          agentRunId: agentRun._id,
          result,
        },
      });

    } catch (aiError) {
      // Update AgentRun with failure
      agentRun.status = 'failed';
      agentRun.errorMessage = aiError.message;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      throw aiError;
    }

  } catch (error) {
    console.error('Error running single agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run agent', 
      error: error.message,
      details: error.response?.data || null,
    });
  }
};

// ============================================
// VIEW/QUERY OPERATIONS
// ============================================

/**
 * Get all agent run logs
 */
exports.getAgentRuns = async (req, res) => {
  try {
    const { agentType, status } = req.query;
    
    const filter = {};
    if (agentType) filter.agentType = agentType;
    if (status) filter.status = status;

    const runs = await AgentRun.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: runs.length,
      data: runs,
    });
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agent runs', error: error.message });
  }
};

/**
 * Get exam timetable
 */
exports.getTimetable = async (req, res) => {
  try {
    const { semester, status = 'scheduled' } = req.query;

    const filter = { status };
    if (semester) filter.semester = parseInt(semester);

    const exams = await Exam.find(filter)
      .populate('subjectId')
      .sort({ examDate: 1, startTime: 1 });

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }
};

/**
 * Get hall allocations
 */
exports.getHallAllocations = async (req, res) => {
  try {
    const { examId, hallId } = req.query;

    const filter = {};
    if (examId) filter.examId = examId;
    if (hallId) filter.hallId = hallId;

    const allocations = await HallAllocation.find(filter)
      .populate('examId')
      .populate('hallId')
      .populate('studentId')
      .sort({ hallId: 1, seatNumber: 1 });

    res.json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    console.error('Error fetching hall allocations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hall allocations', error: error.message });
  }
};

/**
 * Get invigilator assignments
 */
exports.getInvigilatorAssignments = async (req, res) => {
  try {
    const { examId, facultyId } = req.query;

    const filter = {};
    if (examId) filter.examId = examId;
    if (facultyId) filter.facultyId = facultyId;

    const assignments = await InvigilatorAssignment.find(filter)
      .populate('examId')
      .populate('hallId')
      .populate('facultyId')
      .sort({ examId: 1, hallId: 1 });

    res.json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error('Error fetching invigilator assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invigilator assignments', error: error.message });
  }
};
