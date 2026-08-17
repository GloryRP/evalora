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
const User = require('../models/User');
const AnswerScript = require('../models/AnswerScript');
const QuestionPaper = require('../models/QuestionPaper');
const QuestionPaperPattern = require('../models/QuestionPaperPattern');
const QPTemplate = require('../models/QPTemplate');
const { sendNotification } = require('../services/notificationService');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ============================================
// SUBJECTS (for exam scheduling)
// ============================================

/**
 * Get all subjects (for exam cell to select subjects for scheduling)
 */
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ semester: 1, subjectCode: 1 });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects', error: error.message });
  }
};

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

/**
 * Delete all exams and associated seating/invigilation records for a specific semester and exam type
 * DELETE /api/v1/examcell/exams/series
 */
exports.deleteExamSeries = async (req, res) => {
  try {
    const { semester, examType } = req.query;
    if (!semester || !examType) {
      return res.status(400).json({ success: false, message: 'semester and examType query parameters are required' });
    }

    const filter = { semester: parseInt(semester), examType };
    
    // Find all exams matching the filter to clean up allocations and assignments
    const examsToDelete = await Exam.find(filter).select('_id');
    const examIds = examsToDelete.map(e => e._id);
    
    await HallAllocation.deleteMany({ examId: { $in: examIds } });
    await InvigilatorAssignment.deleteMany({ examId: { $in: examIds } });
    const deleteResult = await Exam.deleteMany(filter);

    res.json({
      success: true,
      message: `Successfully deleted exam series for Semester ${semester} - ${examType}. Deleted ${deleteResult.deletedCount} exams and their seating/invigilation records.`,
      count: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting exam series:', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam series', error: error.message });
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

/**
 * Delete a hall
 */
exports.deleteHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const hall = await Hall.findByIdAndDelete(hallId);
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    // Clean up associated hall allocations and invigilator assignments
    await HallAllocation.deleteMany({ hallId });
    await InvigilatorAssignment.deleteMany({ hallId });

    res.json({
      success: true,
      message: 'Hall deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({ success: false, message: 'Failed to delete hall', error: error.message });
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
    const { semester, examCategory, component, startDate, constraints = {} } = req.body;

    // Fetch required data from database
    const subjects = await Subject.find({ semester: parseInt(semester) }).lean();
    const students = await Student.find().lean();
    const faculty = await Faculty.find().lean();
    const halls = await Hall.find().lean();
    
    // Retrieve all subjects to resolve subjectsAssigned ObjectIds to codes
    const allSubjectsList = await Subject.find().lean();
    const subjectIdToCodeMap = {};
    allSubjectsList.forEach(sub => {
      subjectIdToCodeMap[sub._id.toString()] = sub.subjectCode;
    });

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects selected' });
    }

    // Convert MongoDB ObjectIds to strings for Python service
    // Python expects _id field (not subjectId, studentId, etc.)
    const subjectsForPython = subjects.map(s => ({
      _id: s._id.toString(),  // Python expects "_id"
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      department: s.department,
      semester: s.semester,
      credits: s.credits || 4,
      subjectType: s.subjectType || 'theory',
      examConfig: s.examConfig || {
        theoryInternals: 2,
        theoryExternal: true,
        labInternals: 0,
        labExternal: false
      }
    }));

    const studentsForPython = students.map(s => ({
      _id: s._id.toString(),  // Python expects "_id"
      usn: s.usn,
      name: s.name,
      department: s.department,
      semester: s.semester,
    }));

    const facultyForPython = faculty.map(f => ({
      _id: f._id.toString(),  // Python expects "_id"
      employeeId: f.employeeId,
      name: f.name,
      department: f.department,
      designation: f.designation || 'Faculty',
      subjectsAssigned: (f.subjectsAssigned || []).map(id => subjectIdToCodeMap[id.toString()]).filter(Boolean),
    }));

    const hallsForPython = halls.map(h => ({
      _id: h._id.toString(),  // Python expects "_id"
      hallName: h.hallName,
      capacity: h.capacity,
    }));

    // Debug: Log first entries to verify ObjectId mapping
    if (subjectsForPython.length > 0) {
      console.log('DEBUG Node.js: First subject being sent to Python:', JSON.stringify(subjectsForPython[0], null, 2));
    }
    if (studentsForPython.length > 0) {
      console.log('DEBUG Node.js: First student being sent to Python:', JSON.stringify(studentsForPython[0], null, 2));
    }
    if (hallsForPython.length > 0) {
      console.log('DEBUG Node.js: First hall being sent to Python:', JSON.stringify(hallsForPython[0], null, 2));
    }
    if (facultyForPython.length > 0) {
      console.log('DEBUG Node.js: First faculty being sent to Python:', JSON.stringify(facultyForPython[0], null, 2));
    }

    // Create AgentRun record
    const agentRun = await AgentRun.create({
      agentType: 'orchestrator',
      status: 'running',
      inputData: {
        semester,
        examCategory,
        component,
        startDate,
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
        subjects: subjectsForPython,
        students: studentsForPython,
        faculty: facultyForPython,
        halls: hallsForPython,
        constraints: {
          ...constraints,
          startDate,
          examCategory,
          component
        },
      }, {
        timeout: 60000, // 60 second timeout
      });

      const result = response.data.result;
      
      // Debug: Log what Python returned
      console.log('\n=== PYTHON RESPONSE DEBUG ===');
      console.log('Scheduled exams count:', result.scheduled_exams?.length || 0);
      console.log('Hall allocations count:', result.hall_allocations?.length || 0);
      console.log('Invigilator assignments count:', result.invigilator_assignments?.length || 0);
      if (result.hall_allocations?.length > 0) {
        console.log('First allocation sample:', JSON.stringify(result.hall_allocations[0], null, 2));
      }
      if (result.invigilator_assignments?.length > 0) {
        console.log('First assignment sample:', JSON.stringify(result.invigilator_assignments[0], null, 2));
      }
      console.log('=============================\n');

      // Step 1: Save scheduled exams and build a mapping
      const examDocs = [];
      const subjectCodeToExamId = {}; // Map subjectCode → newly created exam _id
      
      for (const exam of result.scheduled_exams) {
        // Look up the real subject ObjectId from subjectCode
        const subject = await Subject.findOne({ subjectCode: exam.subjectCode });
        if (!subject) {
          console.log(`⚠️  Skipping exam: Subject ${exam.subjectCode} not found in database`);
          continue;
        }
        
        const examDoc = await Exam.create({
          subjectId: subject._id,
          examDate: exam.examDate,
          startTime: exam.startTime,
          endTime: exam.endTime,
          semester: exam.semester,
          examType: exam.examType || 'regular',
          status: 'scheduled',
        });
        
        examDocs.push(examDoc);
        // Build mapping: subjectCode → examId for use in allocations/assignments
        subjectCodeToExamId[exam.subjectCode] = examDoc._id;
        console.log(`✓ Created exam for ${exam.subjectCode} → Exam ID: ${examDoc._id}`);
      }

      // Step 2: Save hall allocations (resolve ALL IDs with mapping)
      console.log('\n=== RESOLVING HALL ALLOCATIONS ===');
      
      // Build maps for fast lookups (case-insensitive)
      const allHalls = await Hall.find().lean();
      const hallMap = {};
      allHalls.forEach(h => {
        if (h.hallName) hallMap[h.hallName.toUpperCase()] = h._id;
        hallMap[h._id.toString()] = h._id;
      });
      console.log(`Built hallMap with ${Object.keys(hallMap).length} entries`);
      
      const allStudents = await Student.find().lean();
      const studentMap = {};
      allStudents.forEach(s => {
        if (s.usn) studentMap[s.usn.toUpperCase()] = s._id;
        studentMap[s._id.toString()] = s._id;
      });
      console.log(`Built studentMap with ${Object.keys(studentMap).length} entries`);

      const allocationDocs = [];
      for (const allocation of result.hall_allocations) {
        // Resolve examId from subjectCode using our mapping
        let examId = allocation.examId;
        
        // Try direct match or pattern matching
        if (subjectCodeToExamId[allocation.examId]) {
          examId = subjectCodeToExamId[allocation.examId];
        } else if (allocation.subjectCode && subjectCodeToExamId[allocation.subjectCode]) {
          examId = subjectCodeToExamId[allocation.subjectCode];
        }
        
        // Resolve hallId: Try multiple approaches
        let hallId = null;
        
        // First: Check if Python returned real ObjectId
        if (allocation.hallId && /^[a-f0-9]{24}$/i.test(allocation.hallId)) {
          hallId = allocation.hallId;
        } else if (allocation.hallId && hallMap[allocation.hallId.toUpperCase()]) {
          // Second: Look up by hallId (could be hallName)
          hallId = hallMap[allocation.hallId.toUpperCase()];
        } else if (allocation.hallName && hallMap[allocation.hallName.toUpperCase()]) {
          // Third: Look up by hallName explicitly
          hallId = hallMap[allocation.hallName.toUpperCase()];
        }
        
        // Resolve studentId: Try multiple approaches
        let studentId = null;
        
        // First: Check if Python returned real ObjectId
        if (allocation.studentId && /^[a-f0-9]{24}$/i.test(allocation.studentId)) {
          studentId = allocation.studentId;
        } else if (allocation.studentId && studentMap[allocation.studentId.toUpperCase()]) {
          // Second: Look up by studentId (could be USN or username)
          studentId = studentMap[allocation.studentId.toUpperCase()];
        } else if (allocation.studentUSN && studentMap[allocation.studentUSN.toUpperCase()]) {
          // Third: Look up by USN explicitly
          studentId = studentMap[allocation.studentUSN.toUpperCase()];
        }
        
        // Validate all IDs are now proper ObjectIds
        if (!examId || !hallId || !studentId) {
          console.warn(`⚠️  Skipping allocation - Missing IDs:`, {
            examId: examId ? 'RESOLVED' : `FAILED (input: ${allocation.examId})`,
            hallId: hallId ? 'RESOLVED' : `FAILED (input: ${allocation.hallId})`,
            studentId: studentId ? 'RESOLVED' : `FAILED (input: ${allocation.studentId})`,
          });
          continue;
        }
        
        try {
          const doc = await HallAllocation.create({
            examId: examId,
            hallId: hallId,
            studentId: studentId,
            seatNumber: allocation.seatNumber,
            benchNumber: allocation.benchNumber,
            seatPosition: allocation.seatPosition,
          });
          allocationDocs.push(doc);
          console.log(`✓ Created allocation: seat ${allocation.seatNumber} (Bench ${allocation.benchNumber} ${allocation.seatPosition}) in hall ${hallId}`);
        } catch (err) {
          console.log(`⚠️  Failed to create allocation: ${err.message}`);
        }
      }
      console.log(`✓ Created ${allocationDocs.length} allocations out of ${result.hall_allocations.length}\n`);

      // Step 3: Save invigilator assignments (resolve ALL IDs with mapping)
      console.log('=== RESOLVING INVIGILATOR ASSIGNMENTS ===');
      
      // Reuse hallMap from Step 2 (already built)
      // Build facultyMap for fast lookups (case-insensitive)
      const allFaculty = await Faculty.find().lean();
      const facultyMap = {};
      allFaculty.forEach(f => {
        if (f.employeeId) facultyMap[f.employeeId.toUpperCase()] = f._id;
        facultyMap[f._id.toString()] = f._id;
        // Also map by name as fallback
        if (f.name) facultyMap[f.name.toUpperCase()] = f._id;
      });
      console.log(`Built facultyMap with ${Object.keys(facultyMap).length} entries`);

      const assignmentDocs = [];
      for (const assignment of result.invigilator_assignments) {
        // Resolve examId from subjectCode using our mapping
        let examId = assignment.examId;
        const matchingSubject = Object.keys(subjectCodeToExamId).find(code => 
          assignment.examId && (assignment.examId === code || assignment.examId.includes(code))
        );
        if (matchingSubject) {
          examId = subjectCodeToExamId[matchingSubject];
        }
        
        // Resolve hallId: Try multiple approaches
        let hallId = null;
        
        // First: Check if Python returned real ObjectId
        if (assignment.hallId && /^[a-f0-9]{24}$/i.test(assignment.hallId)) {
          hallId = assignment.hallId;
        } else if (assignment.hallId && hallMap[assignment.hallId.toUpperCase()]) {
          // Second: Look up by hallId (could be hallName)
          hallId = hallMap[assignment.hallId.toUpperCase()];
        } else if (assignment.hallName && hallMap[assignment.hallName.toUpperCase()]) {
          // Third: Look up by hallName explicitly
          hallId = hallMap[assignment.hallName.toUpperCase()];
        } else if (assignment.hallId === 'default_hall') {
          // Fallback: Use first available hall
          const firstHall = allHalls[0];
          if (firstHall) {
            hallId = firstHall._id;
          }
        }
        
        // Resolve facultyId: Try multiple approaches
        let facultyId = null;
        
        // First: Check if Python returned real ObjectId
        if (assignment.facultyId && /^[a-f0-9]{24}$/i.test(assignment.facultyId)) {
          facultyId = assignment.facultyId;
        } else if (assignment.facultyId && facultyMap[assignment.facultyId.toUpperCase()]) {
          // Second: Look up by facultyId (could be employeeId or name)
          facultyId = facultyMap[assignment.facultyId.toUpperCase()];
        } else if (assignment.facultyName && facultyMap[assignment.facultyName.toUpperCase()]) {
          // Third: Look up by faculty name explicitly
          facultyId = facultyMap[assignment.facultyName.toUpperCase()];
        } else if (assignment.employeeId && facultyMap[assignment.employeeId.toUpperCase()]) {
          // Fourth: Look up by employee ID explicitly
          facultyId = facultyMap[assignment.employeeId.toUpperCase()];
        }
        
        // Validate all IDs are now proper ObjectIds
        if (!examId || !hallId || !facultyId) {
          console.warn(`⚠️  Skipping assignment - Missing IDs:`, {
            examId: examId ? 'RESOLVED' : `FAILED (input: ${assignment.examId})`,
            hallId: hallId ? 'RESOLVED' : `FAILED (input: ${assignment.hallId})`,
            facultyId: facultyId ? 'RESOLVED' : `FAILED (input: ${assignment.facultyId})`,
          });
          continue;
        }
        
        try {
          const doc = await InvigilatorAssignment.create({
            examId: examId,
            hallId: hallId,
            facultyId: facultyId,
            role: assignment.role,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
          });
          assignmentDocs.push(doc);
          console.log(`✓ Created assignment: ${assignment.role} in hall ${hallId}`);
        } catch (err) {
          console.log(`⚠️  Failed to create assignment: ${err.message}`);
        }
      }
      console.log(`✓ Created ${assignmentDocs.length} assignments out of ${result.invigilator_assignments.length}\n`);

      // Update AgentRun with success
      agentRun.status = 'completed';
      agentRun.outputData = result;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      // Trigger post-pipeline notifications (async - don't wait)
      triggerPostPipelineNotifications(examDocs, allocationDocs, assignmentDocs)
        .catch(err => console.error('Notification error:', err));

      res.json({
        success: true,
        message: 'Pipeline completed successfully',
        data: {
          agentRunId: agentRun._id,
          examsCreated: examDocs.length,
          allocationsCreated: allocationDocs.length,
          assignmentsCreated: assignmentDocs.length,
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
          const hallAllocations = await HallAllocation.find({ examId: { $in: inputData.examIds } }).lean();
          const allSubs = await Subject.find().lean();
          const subIdToCode = {};
          allSubs.forEach(sub => { subIdToCode[sub._id.toString()] = sub.subjectCode; });
          
          const formattedFaculty = faculty.map(f => ({
            _id: f._id.toString(),
            employeeId: f.employeeId,
            name: f.name,
            department: f.department,
            designation: f.designation || 'Faculty',
            subjectsAssigned: (f.subjectsAssigned || []).map(id => subIdToCode[id.toString()]).filter(Boolean),
          }));
          
          endpoint = '/agents/assign-invigilators';
          payload = { 
            exams: examsForInv, 
            faculty: formattedFaculty, 
            hall_allocations: hallAllocations,
            constraints 
          };
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
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department semester'
        }
      })
      .populate('hallId', 'name hallName building capacity')
      .populate('studentId', 'usn name department')
      .sort({ hallId: 1, seatNumber: 1 });

    // Filter out allocations with broken references (null populated fields)
    const validAllocations = allocations.filter(alloc => {
      if (!alloc.examId || !alloc.hallId) {
        console.warn(`Skipping allocation ${alloc._id} with broken references:`, {
          examId: alloc.examId,
          hallId: alloc.hallId
        });
        return false;
      }
      return true;
    });

    res.json({
      success: true,
      count: validAllocations.length,
      skippedCount: allocations.length - validAllocations.length,
      data: validAllocations,
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
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName'
        }
      })
      .populate('hallId', 'hallName building')
      .populate('facultyId', 'name employeeId department designation')
      .sort({ 'examId.examDate': 1 });

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

// ============================================
// NOTIFICATION TRIGGERS
// ============================================

/**
 * Trigger post-pipeline notifications
 * Sends hall tickets to students and duty notifications to faculty
 * Called asynchronously after pipeline completes
 */
async function triggerPostPipelineNotifications(examDocs, allocationDocs, assignmentDocs) {
  console.log('\n=== TRIGGERING POST-PIPELINE NOTIFICATIONS ===');
  console.log(`Exams: ${examDocs.length}, Allocations: ${allocationDocs.length}, Assignments: ${assignmentDocs.length}`);

  try {
    // Step 1: Group allocations by student and semester
    const studentAllocations = {};
    
    for (const allocation of allocationDocs) {
      // Populate references to get full data
      await allocation.populate(['studentId', 'hallId', {
        path: 'examId',
        populate: { path: 'subjectId' }
      }]);

      if (!allocation.studentId || !allocation.examId || !allocation.hallId) {
        continue;
      }

      const studentId = allocation.studentId._id.toString();
      const semester = allocation.examId.semester;

      if (!studentAllocations[studentId]) {
        studentAllocations[studentId] = {
          student: allocation.studentId,
          semester,
          exams: [],
        };
      }

      studentAllocations[studentId].exams.push({
        subjectName: allocation.examId.subjectId?.subjectName || 'N/A',
        subjectCode: allocation.examId.subjectId?.subjectCode || 'N/A',
        examDate: allocation.examId.examDate,
        startTime: allocation.examId.startTime,
        endTime: allocation.examId.endTime,
        hallName: allocation.hallId.hallName,
        building: allocation.hallId.building,
        seatNumber: allocation.seatNumber,
      });
    }

    // Step 2: Send hall ticket notification to each student
    console.log(`\nSending hall tickets to ${Object.keys(studentAllocations).length} students...`);
    
    for (const [studentId, data] of Object.entries(studentAllocations)) {
      const { student, semester, exams } = data;

      // Get User record for recipientId and email (case-insensitive)
      const user = await User.findOne({ username: { $regex: new RegExp('^' + student.usn + '$', 'i') } });
      if (!user || !user.email) {
        console.warn(`⚠️  Skipping ${student.usn} - No user or email found`);
        continue;
      }

      console.log(`Sending hall ticket to ${student.usn}...`);

      await sendNotification({
        recipientId: user._id,
        recipientRole: 'student',
        type: 'hall_ticket',
        title: `Hall Ticket - Semester ${semester}`,
        message: `Your hall ticket for ${exams.length} exam(s) is ready`,
        email: user.email,
        recipientName: student.name,
        data: {
          studentName: student.name,
          usn: student.usn,
          department: student.department,
          semester,
          exams,
        },
      });

      console.log(`✓ Email sent to ${user.email}`);
    }

    // Step 3: Group assignments by faculty
    const facultyAssignments = {};
    
    for (const assignment of assignmentDocs) {
      // Populate references
      await assignment.populate(['facultyId', 'hallId', {
        path: 'examId',
        populate: { path: 'subjectId' }
      }]);

      if (!assignment.facultyId || !assignment.examId || !assignment.hallId) {
        continue;
      }

      const facultyId = assignment.facultyId._id.toString();

      if (!facultyAssignments[facultyId]) {
        facultyAssignments[facultyId] = {
          faculty: assignment.facultyId,
          duties: [],
        };
      }

      facultyAssignments[facultyId].duties.push({
        examDate: assignment.examId.examDate,
        startTime: assignment.startTime || assignment.examId.startTime,
        endTime: assignment.endTime || assignment.examId.endTime,
        subjectName: assignment.examId.subjectId?.subjectName || 'N/A',
        subjectCode: assignment.examId.subjectId?.subjectCode || 'N/A',
        hallName: assignment.hallId.hallName,
        building: assignment.hallId.building,
        semester: assignment.examId.semester,
        department: assignment.examId.subjectId?.department || 'N/A',
        role: assignment.role,
      });
    }

    // Step 4: Send invigilation duty notification to each faculty
    console.log(`\nSending duty notifications to ${Object.keys(facultyAssignments).length} faculty...`);
    
    for (const [facultyId, data] of Object.entries(facultyAssignments)) {
      const { faculty, duties } = data;

      // Get User record for recipientId and email (case-insensitive)
      const user = await User.findOne({ username: { $regex: new RegExp('^' + faculty.employeeId + '$', 'i') } });
      if (!user || !user.email) {
        console.warn(`⚠️  Skipping ${faculty.employeeId} - No user or email found`);
        continue;
      }

      console.log(`Sending duty to ${faculty.name}...`);

      await sendNotification({
        recipientId: user._id,
        recipientRole: 'faculty',
        type: 'invigilation_duty',
        title: 'Invigilation Duty Assigned',
        message: `You have been assigned ${duties.length} invigilation duty(ies)`,
        email: user.email,
        recipientName: faculty.name,
        data: {
          facultyName: faculty.name,
          employeeId: faculty.employeeId,
          department: faculty.department,
          duties,
        },
      });

      console.log(`✓ Email sent to ${user.email}`);
    }

    console.log('\n=== NOTIFICATIONS COMPLETE ===\n');
  } catch (error) {
    console.error('Error in triggerPostPipelineNotifications:', error);
    // Don't throw - this is async background task
  }
}

/**
 * Upload student answer script
 * POST /api/v1/examcell/answer-scripts/upload
 */
exports.uploadAnswerScript = async (req, res) => {
  try {
    const { studentUSN, examId, mockFileName } = req.body;
    let fileName = mockFileName || '';
    let filePath = '';

    if (req.file) {
      fileName = req.file.originalname;
      const { uploadToCloudinary } = require('../services/cloudinaryService');
      filePath = await uploadToCloudinary(req.file.path, 'answer-scripts');
    }

    if (!studentUSN || !examId) {
      return res.status(400).json({ success: false, message: 'studentUSN and examId are required' });
    }

    const student = await Student.findOne({ usn: studentUSN.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with USN ${studentUSN} not found` });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if AnswerScript entry already exists
    let answerScript = await AnswerScript.findOne({ studentId: student._id, examId: exam._id });
    
    if (answerScript) {
      // Update existing
      answerScript.fileName = fileName || answerScript.fileName;
      answerScript.filePath = filePath || answerScript.filePath;
      if (answerScript.status === 'published') {
        answerScript.status = 'uploaded';
      }
      await answerScript.save();
    } else {
      // Create new
      answerScript = await AnswerScript.create({
        studentId: student._id,
        examId: exam._id,
        subjectId: exam.subjectId,
        status: 'uploaded',
        fileName: fileName || `Script_${studentUSN}_${examId}.pdf`,
        filePath: filePath || `uploads/answer-scripts/mock_${studentUSN}.pdf`,
      });
    }

    res.json({
      success: true,
      message: 'Answer script uploaded successfully',
      data: answerScript,
    });
  } catch (error) {
    console.error('Error uploading answer script:', error);
    res.status(500).json({ success: false, message: 'Failed to upload answer script', error: error.message });
  }
};

/**
 * Assign evaluator (faculty) to an answer script
 * POST /api/v1/examcell/answer-scripts/assign-evaluator
 */
exports.assignEvaluator = async (req, res) => {
  try {
    const { scriptId, facultyEmployeeId } = req.body;

    if (!scriptId || !facultyEmployeeId) {
      return res.status(400).json({ success: false, message: 'scriptId and facultyEmployeeId are required' });
    }

    const faculty = await Faculty.findOne({ employeeId: facultyEmployeeId.toUpperCase() });
    if (!faculty) {
      return res.status(404).json({ success: false, message: `Faculty with ID ${facultyEmployeeId} not found` });
    }

    const answerScript = await AnswerScript.findById(scriptId);
    if (!answerScript) {
      return res.status(404).json({ success: false, message: 'Answer script not found' });
    }

    answerScript.evaluatorId = faculty._id;
    answerScript.status = 'assigned';
    await answerScript.save();

    res.json({
      success: true,
      message: `Answer script successfully assigned to ${faculty.name}`,
      data: answerScript,
    });
  } catch (error) {
    console.error('Error assigning evaluator:', error);
    res.status(500).json({ success: false, message: 'Failed to assign evaluator', error: error.message });
  }
};

/**
 * Manual Evaluator Assignment (NEW - FIX 5)
 * PATCH /api/v1/scripts/assign-evaluator
 * Assign a specific faculty to either all scripts for an exam or a specific student's script
 */
exports.manualAssignEvaluator = async (req, res) => {
  try {
    const { examId, facultyId, assignAll, usn } = req.body;

    if (!examId || !facultyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'examId and facultyId are required' 
      });
    }

    // Find faculty by employeeId
    const faculty = await Faculty.findOne({ employeeId: facultyId.toUpperCase() });
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: `Faculty with ID ${facultyId} not found` 
      });
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    let updatedCount = 0;

    if (assignAll) {
      // Assign all scripts for this exam
      const result = await AnswerScript.updateMany(
        { 
          examId: examId,
          status: { $in: ['uploaded', 'assigned'] }  // Only update pending/assigned scripts
        },
        { 
          $set: { 
            evaluatorId: faculty._id,
            status: 'assigned'
          }
        }
      );
      updatedCount = result.modifiedCount;
    } else {
      // Assign specific student's script
      if (!usn || !usn.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'USN is required when assignAll is false' 
        });
      }

      const student = await Student.findOne({ usn: usn.toUpperCase() });
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: `Student with USN ${usn} not found` 
        });
      }

      const script = await AnswerScript.findOneAndUpdate(
        { 
          examId: examId,
          studentId: student._id
        },
        { 
          $set: { 
            evaluatorId: faculty._id,
            status: 'assigned'
          }
        },
        { new: true }
      );

      if (!script) {
        return res.status(404).json({ 
          success: false, 
          message: `No answer script found for USN ${usn} in this exam` 
        });
      }

      updatedCount = 1;
    }

    res.json({
      success: true,
      message: `${updatedCount} script(s) assigned to ${faculty.name}`,
      count: updatedCount,
      data: {
        facultyName: faculty.name,
        facultyId: faculty.employeeId,
        scriptsAssigned: updatedCount
      }
    });
  } catch (error) {
    console.error('Error in manual evaluator assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign evaluator', 
      error: error.message 
    });
  }
};

/**
 * Bulk Upload Answer Scripts (Subject-wise / Exam-wise)
 * POST /api/v1/examcell/answer-scripts/bulk-upload
 */
exports.bulkUploadAnswerScripts = async (req, res) => {
  try {
    const { examId, studentUSNs } = req.body; // studentUSNs can be string (comma-separated) or array

    if (!examId || !studentUSNs) {
      return res.status(400).json({ success: false, message: 'examId and studentUSNs are required' });
    }

    const exam = await Exam.findById(examId).populate('subjectId');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const usnList = Array.isArray(studentUSNs)
      ? studentUSNs
      : studentUSNs.split(',').map(u => u.trim()).filter(Boolean);

    const uploadedScripts = [];
    const skippedUSNs = [];

    for (const rawUsn of usnList) {
      const usn = rawUsn.toUpperCase();
      const student = await Student.findOne({ usn });
      if (!student) {
        skippedUSNs.push(usn);
        continue;
      }

      let script = await AnswerScript.findOne({ studentId: student._id, examId: exam._id });
      if (!script) {
        script = await AnswerScript.create({
          studentId: student._id,
          examId: exam._id,
          subjectId: exam.subjectId._id,
          status: 'uploaded',
          fileName: `Script_${usn}_${exam.subjectId.subjectCode}.pdf`,
          filePath: `uploads/answer-scripts/bulk_${usn}_${exam.subjectId.subjectCode}.pdf`,
        });
      } else {
        script.status = 'uploaded';
        await script.save();
      }
      uploadedScripts.push(script);
    }

    res.json({
      success: true,
      message: `Successfully registered ${uploadedScripts.length} answer booklets.`,
      skipped: skippedUSNs,
      data: uploadedScripts,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk register scripts', error: error.message });
  }
};

/**
 * AI-Assisted Bulk Upload Answer Scripts (Extracts USNs using Python agent)
 * POST /api/v1/examcell/answer-scripts/bulk-upload-ai
 */
exports.bulkUploadAnswerScriptsAI = async (req, res) => {
  try {
    const { examId } = req.body;
    const files = req.files; // Array of files

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const exam = await Exam.findById(examId).populate('subjectId');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Identify eligible faculty members for this exam/subject
    const subjectDept = exam.subjectId.department;
    let eligibleFaculty = [];
    
    // Primary: Find teachers specifically assigned to teach this subject
    eligibleFaculty = await Faculty.find({ subjectsAssigned: exam.subjectId._id });

    // Fallback: If no faculty is explicitly assigned to this subject, match by department / exam type
    if (eligibleFaculty.length === 0) {
      const isCentralized = exam.examType === 'regular' || exam.examType === 'makeup' || exam.examType === 'Supplementary';
      if (!isCentralized) {
        eligibleFaculty = await Faculty.find({
          department: { $regex: new RegExp('^' + subjectDept + '$', 'i') }
        });
      } else {
        eligibleFaculty = await Faculty.find({
          department: { $regex: new RegExp('^' + subjectDept + '$', 'i') }
        });
        if (eligibleFaculty.length === 0) {
          eligibleFaculty = await Faculty.find({
            department: { $in: ['Computer Science', 'CSE', 'Electronics', 'ECE', 'Information Science', 'ISE'] }
          });
        }
      }
    }

    if (eligibleFaculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No eligible faculty found to evaluate ${exam.subjectId.subjectName} (${subjectDept}). Add faculty first.`
      });
    }

    const processedScripts = [];
    const failedFiles = [];
    let facultyIndex = 0;

    for (const file of files) {
      try {
        // Call Python Agent to extract USN from filename
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/agents/extract-usn`, {
          fileName: file.originalname
        });

        if (aiResponse.data?.success && aiResponse.data.usn) {
          const usn = aiResponse.data.usn;
          const student = await Student.findOne({ usn });

          if (!student) {
            failedFiles.push({ fileName: file.originalname, reason: `Student with USN ${usn} not found in database` });
            continue;
          }

          // Pick faculty round-robin
          const faculty = eligibleFaculty[facultyIndex];
          facultyIndex = (facultyIndex + 1) % eligibleFaculty.length;

          let script = await AnswerScript.findOne({ studentId: student._id, examId: exam._id });
          const { uploadToCloudinary } = require('../services/cloudinaryService');
          const cloudPath = await uploadToCloudinary(file.path, 'answer-scripts');

          if (!script) {
            script = await AnswerScript.create({
              studentId: student._id,
              examId: exam._id,
              subjectId: exam.subjectId._id,
              status: 'assigned',
              evaluatorId: faculty._id,
              fileName: file.originalname,
              filePath: cloudPath,
            });
          } else {
            script.fileName = file.originalname;
            script.filePath = cloudPath;
            script.status = 'assigned';
            script.evaluatorId = faculty._id;
            await script.save();
          }
          processedScripts.push({ usn, studentName: student.name, fileName: file.originalname, assignedTo: faculty.name });
        } else {
          failedFiles.push({ fileName: file.originalname, reason: 'AI could not detect a valid USN in this file name' });
        }
      } catch (err) {
        console.error(`Failed parsing file ${file.originalname}:`, err);
        failedFiles.push({ fileName: file.originalname, reason: `Extraction error: ${err.message}` });
      }
    }

    res.json({
      success: true,
      message: `AI scanned, matched USNs, and automatically distributed ${processedScripts.length} of ${files.length} booklets to faculties.`,
      processedCount: processedScripts.length,
      processed: processedScripts,
      failed: failedFiles
    });
  } catch (error) {
    console.error('Error in AI bulk upload:', error);
    res.status(500).json({ success: false, message: 'Failed to process AI bulk upload', error: error.message });
  }
};


/**
 * Bundle Distribute Answer Scripts (round-robin matching departments/centralized criteria)
 * POST /api/v1/examcell/answer-scripts/bundle-distribute
 */
exports.bundleDistributeAnswerScripts = async (req, res) => {
  try {
    const { examId, bundleSize } = req.body;
    const limitSize = parseInt(bundleSize) || 10;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const exam = await Exam.findById(examId).populate('subjectId');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // 1. Get all unassigned answer scripts for this exam
    const scripts = await AnswerScript.find({ examId: exam._id, evaluatorId: null });
    if (scripts.length === 0) {
      return res.json({ success: true, message: 'All answer scripts for this exam are already allocated.', distributedCount: 0 });
    }

    // 2. Identify eligible faculty members
    const subjectDept = exam.subjectId.department;
    let eligibleFaculty = [];

    // For CIE exams, strict department mapping. For SEE (regular/external), centralized option allows pool of CSE, ECE, EEE, ME etc.
    const isCentralized = exam.examType === 'regular' || exam.examType === 'makeup' || exam.examType === 'Supplementary';

    if (!isCentralized) {
      // Internal: Only department faculty
      eligibleFaculty = await Faculty.find({
        department: { $regex: new RegExp('^' + subjectDept + '$', 'i') }
      });
    } else {
      // Centralized / External: First search department faculty, then look at all faculty teaching matching engineering fields
      eligibleFaculty = await Faculty.find({
        department: { $regex: new RegExp('^' + subjectDept + '$', 'i') }
      });
      if (eligibleFaculty.length === 0) {
        // Fallback to all CS / IS / EC faculties if it's external centralized
        eligibleFaculty = await Faculty.find({
          department: { $in: ['Computer Science', 'CSE', 'Electronics', 'ECE', 'Information Science', 'ISE'] }
        });
      }
    }

    if (eligibleFaculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No eligible faculty found to evaluate ${exam.subjectId.subjectName} (${subjectDept}).`
      });
    }

    // 3. Round-Robin distribute in bundles of limitSize
    let facultyIndex = 0;
    let distributedCount = 0;
    const distributionSummary = [];

    for (let i = 0; i < scripts.length; i += limitSize) {
      const bundle = scripts.slice(i, i + limitSize);
      const faculty = eligibleFaculty[facultyIndex];

      for (const script of bundle) {
        script.evaluatorId = faculty._id;
        script.status = 'assigned';
        await script.save();
        distributedCount++;
      }

      distributionSummary.push({
        facultyName: faculty.name,
        employeeId: faculty.employeeId,
        bundleSize: bundle.length
      });

      // Move to next faculty (round-robin)
      facultyIndex = (facultyIndex + 1) % eligibleFaculty.length;
    }

    res.json({
      success: true,
      message: `Distributed ${distributedCount} scripts into bundles successfully.`,
      distributedCount,
      summary: distributionSummary
    });
  } catch (error) {
    console.error('Error in bundle distribution:', error);
    res.status(500).json({ success: false, message: 'Bundle distribution failed', error: error.message });
  }
};


/**
 * Get all evaluations for exam cell review
 * GET /api/v1/examcell/answer-scripts/review
 */
exports.getEvaluationsForReview = async (req, res) => {
  try {
    const { semester, department } = req.query;

    const query = {};
    
    const scripts = await AnswerScript.find(query)
      .populate('studentId', 'usn name department semester')
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department semester'
        }
      })
      .populate('evaluatorId', 'name employeeId department');

    let filteredScripts = scripts.filter(s => s.studentId && s.examId);
    
    if (semester) {
      filteredScripts = filteredScripts.filter(s => s.examId.semester === parseInt(semester));
    }
    if (department) {
      filteredScripts = filteredScripts.filter(s => 
        s.studentId.department?.trim().toLowerCase() === department.trim().toLowerCase()
      );
    }

    res.json({
      success: true,
      count: filteredScripts.length,
      data: filteredScripts,
    });
  } catch (error) {
    console.error('Error fetching evaluations for review:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch evaluations', error: error.message });
  }
};

/**
 * Publish results for a semester and/or department
 * POST /api/v1/examcell/answer-scripts/publish
 */
exports.publishResults = async (req, res) => {
  try {
    const { semester, department } = req.body;

    if (!semester) {
      return res.status(400).json({ success: false, message: 'Semester is required to publish results' });
    }

    // Load all scripts to inspect their status for the chosen semester
    const allScripts = await AnswerScript.find()
      .populate('studentId')
      .populate({
        path: 'examId',
        populate: { path: 'subjectId' }
      });

    // Filter to get only scripts for the selected semester
    const semesterScripts = allScripts.filter(s => s.examId && s.examId.semester === parseInt(semester));

    if (semesterScripts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `No answer scripts found for Semester ${semester}.` 
      });
    }

    // Check if any scripts in this semester are still pending evaluation
    const pendingScripts = semesterScripts.filter(s => s.status === 'assigned' || s.status === 'uploaded');
    if (pendingScripts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish results. There are still ${pendingScripts.length} answer booklets pending evaluation in Semester ${semester} across departments.`
      });
    }

    // Get only evaluated scripts to publish
    const relevantScripts = semesterScripts.filter(s => s.status === 'evaluated');

    if (relevantScripts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `All scripts for Semester ${semester} are already published or no newly evaluated scripts were found.` 
      });
    }

    console.log(`Publishing ${relevantScripts.length} results...`);
    const publishedIds = [];

    for (const script of relevantScripts) {
      script.status = 'published';
      script.publishedAt = new Date();
      await script.save();
      publishedIds.push(script._id);

      // Trigger student notification for published result
      const studentUser = await User.findOne({ username: { $regex: new RegExp('^' + script.studentId.usn + '$', 'i') } });
      if (studentUser && studentUser.email) {
        console.log(`Triggering result published notification for student ${script.studentId.usn}`);
        
        await sendNotification({
          recipientId: studentUser._id,
          recipientRole: 'student',
          type: 'result_published',
          title: 'Exam Results Published',
          message: `Your results for ${script.examId.subjectId?.subjectName || 'Exam'} have been published. Marks: ${script.marksObtained}/${script.maxMarks}`,
          email: studentUser.email,
          recipientName: script.studentId.name,
          data: {
            studentName: script.studentId.name,
            usn: script.studentId.usn,
            subjectName: script.examId.subjectId?.subjectName || 'N/A',
            subjectCode: script.examId.subjectId?.subjectCode || 'N/A',
            marksObtained: script.marksObtained,
            maxMarks: script.maxMarks,
            comments: script.comments,
            grade: script.marksObtained >= 40 ? 'PASS' : 'FAIL',
          },
        }).catch(err => console.error('Error sending result email:', err));
      }
    }

    res.json({
      success: true,
      message: `Successfully published ${relevantScripts.length} results`,
      count: relevantScripts.length,
      publishedIds,
    });
  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({ success: false, message: 'Failed to publish results', error: error.message });
  }
};

/**
 * Get all students for dropdown selection
 * GET /api/v1/examcell/students
 */
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({}, 'usn name semester department');
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

/**
 * Get all faculty for evaluator assignment dropdown
 * GET /api/v1/examcell/faculty
 */
exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({}, 'employeeId name department designation');
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch faculty', error: error.message });
  }
};

/**
 * Get all Question Papers
 * GET /api/v1/examcell/question-papers
 */
exports.getAllQuestionPapers = async (req, res) => {
  try {
    const papers = await QuestionPaper.find({});
    res.json({ success: true, data: papers });
  } catch (error) {
    console.error('Error fetching all question papers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question papers', error: error.message });
  }
};

/**
 * Configure/Create Question Paper for an exam
 * POST /api/v1/examcell/question-papers
 */
exports.createQuestionPaper = async (req, res) => {
  try {
    const { examId, maxMarks, questions } = req.body;

    if (!examId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'examId and questions array are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let qPaper = await QuestionPaper.findOne({ examId });
    
    if (qPaper) {
      qPaper.maxMarks = maxMarks || qPaper.maxMarks;
      qPaper.questions = questions;
      await qPaper.save();
    } else {
      qPaper = await QuestionPaper.create({
        examId,
        subjectId: exam.subjectId,
        maxMarks: maxMarks || 100,
        questions,
      });
    }

    res.json({
      success: true,
      message: 'Question paper configured successfully',
      data: qPaper,
    });
  } catch (error) {
    console.error('Error creating question paper:', error);
    res.status(500).json({ success: false, message: 'Failed to configure question paper', error: error.message });
  }
};

/**
 * Get Question Paper by Exam ID
 * GET /api/v1/examcell/question-papers/exam/:examId
 */
exports.getQuestionPaperByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    let qPaper = await QuestionPaper.findOne({ examId })
      .populate('examId')
      .populate('subjectId');

    if (!qPaper) {
      const exam = await Exam.findById(examId).populate('subjectId');
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      let defaultMaxMarks = 100;
      let defaultSlots = [
        { questionNumber: 'Q1', maxMarks: 40, text: '', or: null },
        { questionNumber: 'Q2', maxMarks: 40, text: '', or: null },
        { questionNumber: 'Q3', maxMarks: 20, text: '', or: null }
      ];

      // Try fetching template config
      const template = await QPTemplate.findOne({ examType: exam.examType });
      if (template) {
        // Check exceptions
        const exception = template.exceptions?.find(
          ex => ex.subjectId.toString() === exam.subjectId._id.toString()
        );
        if (exception) {
          defaultMaxMarks = exception.maxMarks;
          defaultSlots = exception.slots?.map(s => ({
            questionNumber: s.questionNumber,
            maxMarks: s.maxMarks,
            text: '',
            or: s.or ? { questionNumber: s.or.questionNumber, maxMarks: s.or.maxMarks, text: '' } : null
          })) || [];
        } else {
          defaultMaxMarks = template.maxMarks;
          defaultSlots = template.slots?.map(s => ({
            questionNumber: s.questionNumber,
            maxMarks: s.maxMarks,
            text: '',
            or: s.or ? { questionNumber: s.or.questionNumber, maxMarks: s.or.maxMarks, text: '' } : null
          })) || [];
        }
      } else {
        // Falling back to credit-based rules if no template is defined
        const credits = exam.subjectId?.credits || 4;
        if (credits === 1) {
          defaultMaxMarks = 25;
          defaultSlots = [
            { questionNumber: 'Q1', maxMarks: 10, text: '', or: null },
            { questionNumber: 'Q2', maxMarks: 10, text: '', or: null },
            { questionNumber: 'Q3', maxMarks: 5, text: '', or: null }
          ];
        } else if (exam.examType === 'internal1' || exam.examType === 'internal2') {
          defaultMaxMarks = 50;
          defaultSlots = [
            { questionNumber: 'Q1', maxMarks: 20, text: '', or: { questionNumber: 'Q2', maxMarks: 20, text: '' } },
            { questionNumber: 'Q3', maxMarks: 20, text: '', or: { questionNumber: 'Q4', maxMarks: 20, text: '' } },
            { questionNumber: 'Q5', maxMarks: 10, text: '', or: null }
          ];
        }
      }

      qPaper = await QuestionPaper.create({
        examId,
        subjectId: exam.subjectId._id,
        maxMarks: defaultMaxMarks,
        slots: defaultSlots,
        questions: defaultSlots.map(s => ({ questionNumber: s.questionNumber, maxMarks: s.maxMarks, text: '' })), // backward compat
        status: 'draft'
      });

      qPaper = await QuestionPaper.findById(qPaper._id)
        .populate('examId')
        .populate('subjectId');
    }

    res.json({
      success: true,
      data: qPaper,
    });
  } catch (error) {
    console.error('Error fetching question paper:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question paper', error: error.message });
  }
};

/**
 * Approve a submitted question paper
 */
exports.approveQuestionPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const paper = await QuestionPaper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    paper.status = 'approved';
    await paper.save();

    res.json({
      success: true,
      message: 'Question paper approved successfully',
      data: paper,
    });
  } catch (error) {
    console.error('Error approving question paper:', error);
    res.status(500).json({ success: false, message: 'Failed to approve question paper', error: error.message });
  }
};

/**
 * Run AI Evaluation Agent and see statistics
 * POST /api/v1/examcell/agents/run-evaluation
 */
exports.runEvaluationAgent = async (req, res) => {
  try {
    const totalScripts = await AnswerScript.countDocuments();
    const evaluatedScripts = await AnswerScript.countDocuments({ status: { $in: ['evaluated', 'published'] } });
    const pendingScripts = totalScripts - evaluatedScripts;

    const scripts = await AnswerScript.find({ status: { $in: ['evaluated', 'published'] } });
    
    let averageMarks = 0;
    let passCount = 0;
    let failCount = 0;

    if (scripts.length > 0) {
      const sum = scripts.reduce((acc, s) => acc + (s.marksObtained || 0), 0);
      averageMarks = sum / scripts.length;
      
      scripts.forEach(s => {
        if (s.marksObtained >= 40) passCount++;
        else failCount++;
      });
    }

    const passRate = scripts.length > 0 ? (passCount / scripts.length) * 100 : 0;

    const agentRun = await AgentRun.create({
      agentType: 'evaluation',
      status: 'completed',
      inputData: {},
      triggeredBy: req.user?.username || 'examcell',
      logs: `Evaluation run complete. Checked ${evaluatedScripts}/${totalScripts} booklets. Average: ${averageMarks.toFixed(2)} Marks. Pass Rate: ${passRate.toFixed(2)}%.`,
      completedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        totalScripts,
        evaluatedScripts,
        pendingScripts,
        averageMarks: Math.round(averageMarks * 100) / 100,
        passCount,
        failCount,
        passRate: Math.round(passRate * 100) / 100,
        agentRun,
      }
    });
  } catch (error) {
    console.error('Error running evaluation agent:', error);
    res.status(500).json({ success: false, message: 'Failed to run evaluation agent', error: error.message });
  }
};

/**
 * Generate draft timetable from subjects and available dates using AI Scheduling Agent
 * POST /api/v1/examcell/timetable/generate
 */
exports.generateTimetable = async (req, res) => {
  try {
    const { semester, examCategory, component, startDate, constraints = {} } = req.body;

    if (!semester || !examCategory || !component || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required parameters: semester, examCategory, component, startDate' });
    }

    // Fetch subjects for this semester
    const subjects = await Subject.find({ semester: parseInt(semester) }).lean();

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: `No subjects found for semester ${semester}` });
    }

    // Format subjects for Python service
    const subjectsForPython = subjects.map(s => ({
      _id: s._id.toString(),
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      department: s.department,
      semester: s.semester,
      credits: s.credits || 3,
      subjectType: s.subjectType || 'theory',
      examConfig: s.examConfig || {
        theoryInternals: 2,
        theoryExternal: true,
        labInternals: 0,
        labExternal: false
      }
    }));

    // Call Python AI Service schedule endpoint
    const response = await axios.post(`${AI_SERVICE_URL}/agents/schedule`, {
      subjects: subjectsForPython,
      start_date: startDate,
      exam_category: examCategory,
      component: component,
      constraints: constraints
    }, {
      timeout: 30000,
    });

    res.json({
      success: true,
      message: 'Draft timetable generated successfully',
      data: response.data.result
    });

  } catch (error) {
    console.error('Error generating timetable:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail?.error || error.message || 'Failed to generate timetable',
      details: error.response?.data || null
    });
  }
};

/**
 * Confirm and save draft timetable, replacing existing exams for the same semester and category
 * POST /api/v1/examcell/timetable/confirm
 */
exports.confirmTimetable = async (req, res) => {
  try {
    const { exams, semester, examCategory } = req.body;

    if (!exams || !Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({ success: false, message: 'No exams to confirm' });
    }

    // Delete existing exams of the same semester and category to replace them
    const examFilter = { semester: parseInt(semester), examType: examCategory };
    
    // Find all exams matching the filter to clean up allocations and assignments
    const existingExams = await Exam.find(examFilter).select('_id');
    const existingExamIds = existingExams.map(e => e._id);
    
    await HallAllocation.deleteMany({ examId: { $in: existingExamIds } });
    await InvigilatorAssignment.deleteMany({ examId: { $in: existingExamIds } });
    await Exam.deleteMany(examFilter);

    // Save the new exams
    const savedExams = [];
    for (const exam of exams) {
      const subject = await Subject.findOne({ subjectCode: exam.subjectCode });
      if (!subject) {
        console.warn(`Subject with code ${exam.subjectCode} not found during confirm`);
        continue;
      }

      const examDoc = await Exam.create({
        subjectId: subject._id,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        semester: parseInt(exam.semester),
        examType: exam.examType,
        componentType: exam.componentType || 'theory',
        status: 'scheduled',
      });
      savedExams.push(examDoc);
    }

    res.json({
      success: true,
      message: `Confirmed and saved ${savedExams.length} exams.`,
      count: savedExams.length,
      data: savedExams
    });

  } catch (error) {
    console.error('Error confirming timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm timetable', error: error.message });
  }
};

/**
 * Run Seating Allocation Agent separately for selected scheduled exams
 * POST /api/v1/examcell/hall-allocations/generate
 */
exports.runHallAllocationAgentSeparate = async (req, res) => {
  try {
    const { examIds, constraints = {} } = req.body;

    if (!examIds || examIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No scheduled exams selected' });
    }

    // Fetch exams, students, and halls
    const exams = await Exam.find({ _id: { $in: examIds } }).populate('subjectId').lean();
    const students = await Student.find().lean();
    const halls = await Hall.find().lean();

    if (exams.length === 0) {
      return res.status(400).json({ success: false, message: 'None of the selected exams were found in the database' });
    }

    // Convert exams to format expected by Python:
    const formattedExamsForPython = exams.map(e => ({
      _id: e._id.toString(),
      id: e._id.toString(),
      subjectId: e.subjectId?._id?.toString(),
      subjectCode: e.subjectId?.subjectCode,
      subjectName: e.subjectId?.subjectName,
      department: e.subjectId?.department || e.department || '',
      semester: e.semester,
      examDate: e.examDate?.toISOString?.() || e.examDate,
      startTime: e.startTime,
      endTime: e.endTime,
      examType: e.examType,
      componentType: e.componentType || 'theory'
    }));

    // Create AgentRun record
    const agentRun = await AgentRun.create({
      agentType: 'hall_allocation',
      status: 'running',
      inputData: {
        examIds,
        constraints,
        counts: {
          exams: exams.length,
          students: students.length,
          halls: halls.length,
        },
      },
      triggeredBy: req.user?.username || 'examcell',
    });

    try {
      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/agents/allocate-halls`, {
        exams: formattedExamsForPython,
        students,
        halls,
        constraints,
      }, {
        timeout: 45000,
      });

      const result = response.data.result;

      // Delete any existing allocations for these exams to avoid duplicates/overwrite
      await HallAllocation.deleteMany({ examId: { $in: examIds } });

      // Resolve hall & student mappings
      const allHalls = await Hall.find().lean();
      const hallMap = {};
      allHalls.forEach(h => {
        if (h.hallName) hallMap[h.hallName.toUpperCase()] = h._id;
        hallMap[h._id.toString()] = h._id;
      });

      const allStudents = await Student.find().lean();
      const studentMap = {};
      allStudents.forEach(s => {
        if (s.usn) studentMap[s.usn.toUpperCase()] = s._id;
        studentMap[s._id.toString()] = s._id;
      });

      const allocationDocs = [];
      for (const allocation of result.hall_allocations) {
        const examId = allocation.examId;
        
        let hallId = null;
        if (allocation.hallId && /^[a-f0-9]{24}$/i.test(allocation.hallId)) {
          hallId = allocation.hallId;
        } else if (allocation.hallId && hallMap[allocation.hallId.toUpperCase()]) {
          hallId = hallMap[allocation.hallId.toUpperCase()];
        } else if (allocation.hallName && hallMap[allocation.hallName.toUpperCase()]) {
          hallId = hallMap[allocation.hallName.toUpperCase()];
        }

        let studentId = null;
        if (allocation.studentId && /^[a-f0-9]{24}$/i.test(allocation.studentId)) {
          studentId = allocation.studentId;
        } else if (allocation.studentUSN && studentMap[allocation.studentUSN.toUpperCase()]) {
          studentId = studentMap[allocation.studentUSN.toUpperCase()];
        } else if (allocation.usn && studentMap[allocation.usn.toUpperCase()]) {
          studentId = studentMap[allocation.usn.toUpperCase()];
        }

        if (examId && hallId && studentId) {
          allocationDocs.push({
            examId,
            hallId,
            studentId,
            seatNumber: parseInt(allocation.seatNumber) || 1,
            benchNumber: parseInt(allocation.benchNumber) || Math.ceil((parseInt(allocation.seatNumber) || 1) / 2),
            seatPosition: allocation.seatPosition || (parseInt(allocation.seatNumber) % 2 === 0 ? 'right' : 'left'),
            studentUSN: allocation.studentUSN || allocation.usn,
            subjectCode: allocation.subjectCode
          });
        }
      }

      if (allocationDocs.length > 0) {
        await HallAllocation.insertMany(allocationDocs);
      }

      // Update AgentRun
      agentRun.status = 'completed';
      agentRun.outputData = result;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      res.json({
        success: true,
        message: `Seating allocation completed successfully. Allocated ${allocationDocs.length} students.`,
        allocationsCount: allocationDocs.length,
        agentRun,
      });

    } catch (aiError) {
      agentRun.status = 'failed';
      agentRun.errorMessage = aiError.message;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();
      throw aiError;
    }

  } catch (error) {
    console.error('Error running separate seating allocation:', error);
    res.status(500).json({ success: false, message: 'Failed to run seating allocation', error: error.message });
  }
};

/**
 * Run Invigilator Assignment Agent separately for selected scheduled exams and their hall allocations
 * POST /api/v1/examcell/invigilator-assignments/generate
 */
exports.runInvigilatorAgentSeparate = async (req, res) => {
  try {
    const { examIds, constraints = {} } = req.body;

    if (!examIds || examIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No scheduled exams selected' });
    }

    // Fetch exams, faculty, and hall allocations
    const exams = await Exam.find({ _id: { $in: examIds } }).populate('subjectId').lean();
    const faculty = await Faculty.find().lean();
    const hallAllocations = await HallAllocation.find({ examId: { $in: examIds } }).lean();

    if (exams.length === 0) {
      return res.status(400).json({ success: false, message: 'None of the selected exams were found in the database' });
    }
    if (hallAllocations.length === 0) {
      return res.status(400).json({ success: false, message: 'Please run Seating Allocation first. Invigilation requires hall allocations to determine which rooms are in use.' });
    }

    // Convert exams to format expected by Python:
    const formattedExamsForPython = exams.map(e => ({
      _id: e._id.toString(),
      id: e._id.toString(),
      subjectId: e.subjectId?._id?.toString(),
      subjectCode: e.subjectId?.subjectCode,
      subjectName: e.subjectId?.subjectName,
      department: e.subjectId?.department || e.department || '',
      semester: e.semester,
      examDate: e.examDate?.toISOString?.() || e.examDate,
      startTime: e.startTime,
      endTime: e.endTime,
      examType: e.examType,
      componentType: e.componentType || 'theory'
    }));

    // Resolve faculty subjects
    const allSubs = await Subject.find().lean();
    const subIdToCode = {};
    allSubs.forEach(sub => { subIdToCode[sub._id.toString()] = sub.subjectCode; });

    const formattedFaculty = faculty.map(f => ({
      _id: f._id.toString(),
      employeeId: f.employeeId,
      name: f.name,
      department: f.department,
      designation: f.designation || 'Faculty',
      subjectsAssigned: (f.subjectsAssigned || []).map(id => subIdToCode[id.toString()]).filter(Boolean),
    }));

    // Create AgentRun record
    const agentRun = await AgentRun.create({
      agentType: 'invigilator',
      status: 'running',
      inputData: {
        examIds,
        constraints,
        counts: {
          exams: exams.length,
          faculty: faculty.length,
          hallAllocations: hallAllocations.length,
        },
      },
      triggeredBy: req.user?.username || 'examcell',
    });

    try {
      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/agents/assign-invigilators`, {
        exams: formattedExamsForPython,
        faculty: formattedFaculty,
        hall_allocations: hallAllocations,
        constraints,
      }, {
        timeout: 45000,
      });

      const result = response.data.result;

      // Delete existing assignments for these exams
      await InvigilatorAssignment.deleteMany({ examId: { $in: examIds } });

      // Resolve reference maps
      const allHalls = await Hall.find().lean();
      const hallMap = {};
      allHalls.forEach(h => {
        if (h.hallName) hallMap[h.hallName.toUpperCase()] = h._id;
        hallMap[h._id.toString()] = h._id;
      });

      const facultyMap = {};
      faculty.forEach(f => {
        if (f.employeeId) facultyMap[f.employeeId.toUpperCase()] = f._id;
        facultyMap[f._id.toString()] = f._id;
        if (f.name) facultyMap[f.name.toUpperCase()] = f._id;
      });

      const assignmentDocs = [];
      for (const assignment of result.invigilator_assignments) {
        const examId = assignment.examId;
        
        let hallId = null;
        if (assignment.hallId && /^[a-f0-9]{24}$/i.test(assignment.hallId)) {
          hallId = assignment.hallId;
        } else if (assignment.hallId && hallMap[assignment.hallId.toUpperCase()]) {
          hallId = hallMap[assignment.hallId.toUpperCase()];
        } else if (assignment.hallName && hallMap[assignment.hallName.toUpperCase()]) {
          hallId = hallMap[assignment.hallName.toUpperCase()];
        } else if (allHalls.length > 0) {
          hallId = allHalls[0]._id;
        }

        let facultyId = null;
        if (assignment.facultyId && /^[a-f0-9]{24}$/i.test(assignment.facultyId)) {
          facultyId = assignment.facultyId;
        } else if (assignment.facultyId && facultyMap[assignment.facultyId.toUpperCase()]) {
          facultyId = facultyMap[assignment.facultyId.toUpperCase()];
        } else if (assignment.facultyName && facultyMap[assignment.facultyName.toUpperCase()]) {
          facultyId = facultyMap[assignment.facultyName.toUpperCase()];
        } else if (assignment.employeeId && facultyMap[assignment.employeeId.toUpperCase()]) {
          facultyId = facultyMap[assignment.employeeId.toUpperCase()];
        }

        if (examId && hallId && facultyId) {
          assignmentDocs.push({
            examId,
            hallId,
            facultyId,
            role: assignment.role || 'invigilator',
            startTime: assignment.startTime || exams.find(e => e._id.toString() === examId)?.startTime || '09:00',
            endTime: assignment.endTime || exams.find(e => e._id.toString() === examId)?.endTime || '10:30',
          });
        }
      }

      if (assignmentDocs.length > 0) {
        await InvigilatorAssignment.insertMany(assignmentDocs);
      }

      // Update AgentRun
      agentRun.status = 'completed';
      agentRun.outputData = result;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();

      res.json({
        success: true,
        message: `Invigilator assignments generated successfully. Assigned ${assignmentDocs.length} faculty.`,
        assignmentsCount: assignmentDocs.length,
        agentRun,
      });

    } catch (aiError) {
      agentRun.status = 'failed';
      agentRun.errorMessage = aiError.message;
      agentRun.completedAt = Date.now();
      agentRun.executionTimeMs = Date.now() - agentRun.createdAt.getTime();
      await agentRun.save();
      throw aiError;
    }

  } catch (error) {
    console.error('Error running separate invigilator assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to run invigilator assignment', error: error.message });
  }
};
