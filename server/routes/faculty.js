/**
 * Faculty Routes
 * Handles faculty-specific data retrieval (invigilation duties)
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const AnswerScript = require('../models/AnswerScript');

/**
 * GET /api/v1/faculty/duties
 * Get invigilation duties for logged-in faculty
 */
router.get('/duties', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    // Find faculty by user ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found',
      });
    }

    // Find all invigilation assignments for this faculty
    const assignments = await InvigilatorAssignment.find({
      facultyId: faculty._id,
    })
      .populate({
        path: 'examId',
        select: 'examDate startTime endTime subjectId semester',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department semester'
        }
      })
      .populate('hallId', 'name building');

    // Build duties data
    const duties = assignments
      .filter((assign) => assign.examId && assign.hallId)
      .map((assign) => ({
        assignmentId: assign._id,
        date: assign.examId.examDate,
        day: assign.examId.examDate ? new Date(assign.examId.examDate).toLocaleDateString('en-IN', {
          weekday: 'long',
        }) : 'N/A',
        subject: assign.examId.subjectId?.subjectName || 'N/A',
        subjectCode: assign.examId.subjectId?.subjectCode || 'N/A',
        time: `${assign.examId.startTime || 'N/A'} - ${assign.examId.endTime || 'N/A'}`,
        hall: assign.hallId.name || 'N/A',
        building: assign.hallId.building || 'N/A',
        role: assign.role,
        department: assign.examId.subjectId?.department || 'N/A',
        semester: assign.examId.subjectId?.semester || assign.examId.semester || 'N/A',
        status: assign.status || 'pending',
      }));

    // Sort in memory by examDate ascending
    duties.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        faculty: {
          name: faculty.name,
          employeeId: faculty.employeeId,
          department: faculty.department,
          designation: faculty.designation,
        },
        duties,
        totalDuties: duties.length,
      },
    });
  } catch (error) {
    console.error('Error fetching faculty duties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch duties',
      error: error.message,
    });
  }
});

// ============================================
// FACULTY EVALUATIONS (MARKING) ROUTES
// ============================================

// Get assigned evaluations
router.get('/evaluations', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const scripts = await AnswerScript.find({
      evaluatorId: faculty._id,
    })
      .populate('studentId', 'usn name department semester')
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department semester'
        }
      });

    const evaluations = scripts.map((script) => ({
      scriptId: script._id,
      studentName: script.studentId?.name || 'N/A',
      studentUSN: script.studentId?.usn || 'N/A',
      subjectName: script.examId?.subjectId?.subjectName || 'N/A',
      subjectCode: script.examId?.subjectId?.subjectCode || 'N/A',
      date: script.examId?.examDate,
      time: script.examId ? `${script.examId.startTime || 'N/A'} - ${script.examId.endTime || 'N/A'}` : 'N/A',
      status: script.status,
      filePath: script.filePath,
      fileName: script.fileName,
      marksObtained: script.marksObtained,
      maxMarks: script.maxMarks,
      comments: script.comments,
      examId: script.examId?._id || script.examId,
      examType: script.examId?.examType || 'internal1',
    }));

    res.json({
      success: true,
      count: evaluations.length,
      data: evaluations,
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch evaluations', error: error.message });
  }
});

// Submit marks for a script
router.put('/evaluations/:scriptId', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const { scriptId } = req.params;
    const { marksObtained, questionMarks, comments } = req.body;

    let totalMarks = 0;
    let savedQuestionMarks = [];

    if (questionMarks && Array.isArray(questionMarks) && questionMarks.length > 0) {
      savedQuestionMarks = questionMarks.map(qm => ({
        questionNumber: qm.questionNumber,
        marksObtained: parseFloat(qm.marksObtained) || 0
      }));
      totalMarks = savedQuestionMarks.reduce((sum, qm) => sum + qm.marksObtained, 0);
    } else {
      if (marksObtained === undefined || marksObtained === null) {
        return res.status(400).json({ success: false, message: 'marksObtained or questionMarks is required' });
      }
      totalMarks = parseFloat(marksObtained);
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const script = await AnswerScript.findOne({
      _id: scriptId,
      evaluatorId: faculty._id,
    });

    if (!script) {
      return res.status(404).json({ 
        success: false, 
        message: 'Answer script not found or you are not authorized to evaluate it' 
      });
    }

    script.marksObtained = totalMarks;
    script.questionMarks = savedQuestionMarks;
    script.comments = comments || '';
    script.status = 'evaluated';
    script.evaluatedAt = new Date();
    await script.save();

    res.json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: script,
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ success: false, message: 'Failed to submit evaluation', error: error.message });
  }
});

const QuestionPaper = require('../models/QuestionPaper');
const QPTemplate = require('../models/QPTemplate');
const Exam = require('../models/Exam');

/**
 * GET /api/v1/faculty/question-papers
 * Get question papers for exams scheduled in the faculty's department
 */
router.get('/question-papers', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Find all scheduled exams for this department
    const exams = await Exam.find()
      .populate({
        path: 'subjectId',
        match: { department: { $regex: new RegExp('^' + faculty.department + '$', 'i') } }
      });
    
    // Filter exams that have a populated subject
    const deptExams = exams.filter(e => e.subjectId !== null);

    const papers = [];
    for (const exam of deptExams) {
      let paper = await QuestionPaper.findOne({ examId: exam._id })
        .populate({
          path: 'examId',
          populate: { path: 'subjectId' }
        });

      if (!paper) {
        let defaultMaxMarks = 100;
        let defaultSlots = [
          { questionNumber: 'Q1', maxMarks: 40, text: '', or: null },
          { questionNumber: 'Q2', maxMarks: 40, text: '', or: null },
          { questionNumber: 'Q3', maxMarks: 20, text: '', or: null }
        ];

        // Fetch template configuration
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
          // Standard fallbacks if no template configuration is stored yet
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

        paper = await QuestionPaper.create({
          examId: exam._id,
          subjectId: exam.subjectId._id,
          maxMarks: defaultMaxMarks,
          slots: defaultSlots,
          questions: defaultSlots.map(s => ({ questionNumber: s.questionNumber, maxMarks: s.maxMarks, text: '' })), // backward compat
          status: 'draft'
        });

        paper = await QuestionPaper.findById(paper._id)
          .populate({
            path: 'examId',
            populate: { path: 'subjectId' }
          });
      }

      papers.push(paper);
    }

    res.json({
      success: true,
      count: papers.length,
      data: papers
    });
  } catch (error) {
    console.error('Error fetching faculty question papers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question papers', error: error.message });
  }
});

/**
 * PUT /api/v1/faculty/question-papers/:paperId/submit
 * Fill and submit questions for a paper
 */
router.put('/question-papers/:paperId/submit', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const { paperId } = req.params;
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'questions array is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const paper = await QuestionPaper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    // Update slots and questions (faculty only changes/adds text/description for pattern)
    const reqSlots = req.body.slots || req.body.questions;
    if (reqSlots && Array.isArray(reqSlots)) {
      if (paper.slots && paper.slots.length > 0) {
        paper.slots = paper.slots.map(s => {
          const match = reqSlots.find(reqS => reqS.questionNumber === s.questionNumber);
          if (match) {
            s.text = match.text || '';
          }
          if (s.or) {
            const orMatch = reqSlots.find(reqS => reqS.or && reqS.or.questionNumber === s.or.questionNumber);
            if (orMatch && orMatch.or) {
              s.or.text = orMatch.or.text || '';
            } else {
              const directMatch = reqSlots.find(reqS => reqS.questionNumber === s.or.questionNumber);
              if (directMatch) {
                s.or.text = directMatch.text || '';
              }
            }
          }
          return s;
        });
      }

      paper.questions = paper.questions.map(q => {
        const match = reqSlots.find(reqQ => reqQ.questionNumber === q.questionNumber);
        if (match) {
          q.text = match.text || '';
        } else {
          const orMatch = reqSlots.find(reqS => reqS.or && reqS.or.questionNumber === q.questionNumber);
          if (orMatch && orMatch.or) {
            q.text = orMatch.or.text || '';
          }
        }
        return q;
      });
    }

    paper.status = 'submitted';
    paper.submittedBy = faculty._id;
    await paper.save();

    res.json({
      success: true,
      message: 'Question paper submitted successfully',
      data: paper
    });
  } catch (error) {
    console.error('Error submitting question paper:', error);
    res.status(500).json({ success: false, message: 'Failed to submit question paper', error: error.message });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/question-papers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'qp-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * PUT /api/v1/faculty/question-papers/:paperId/upload
 * Upload completed question paper file (PDF/Docx)
 */
router.put('/question-papers/:paperId/upload', verifyToken, authorize('faculty'), upload.single('file'), async (req, res) => {
  try {
    const { paperId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const { uploadToCloudinary } = require('../services/cloudinaryService');
    const cloudUrl = await uploadToCloudinary(req.file.path, 'question-papers');

    paper.fileUrl = cloudUrl;
    paper.fileName = req.file.originalname;
    paper.status = 'submitted';
    paper.submittedBy = faculty._id;
    await paper.save();

    res.json({
      success: true,
      message: 'Question paper file uploaded and submitted successfully',
      data: paper
    });
  } catch (error) {
    console.error('Error uploading question paper:', error);
    res.status(500).json({ success: false, message: 'Failed to upload question paper', error: error.message });
  }
});

// Publish internal exam marks for a class
router.put('/evaluations/publish-class/:examId', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const { examId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const faculty = await Faculty.findOne({ employeeId: user.username });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Load exam to verify type
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Verify exam type is internal
    if (exam.examType !== 'internal1' && exam.examType !== 'internal2') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only internal exam results can be published by faculty members. External SEE results are published by the Exam Cell.' 
      });
    }

    // Find all answer scripts for this exam assigned to this evaluator
    const scripts = await AnswerScript.find({
      examId,
      evaluatorId: faculty._id
    });

    if (scripts.length === 0) {
      return res.status(404).json({ success: false, message: 'No answer scripts found for this exam assigned to you.' });
    }

    // Check if any scripts are still pending evaluation
    const pendingCount = scripts.filter(s => s.status === 'assigned' || s.status === 'uploaded').length;
    if (pendingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish results. There are ${pendingCount} answer scripts in the class still pending evaluation.`
      });
    }

    // Update all evaluated scripts to published
    await AnswerScript.updateMany(
      { examId, evaluatorId: faculty._id, status: 'evaluated' },
      { $set: { status: 'published', publishedAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'All evaluated internal scores have been published to the students successfully!'
    });
  } catch (error) {
    console.error('Error publishing class results:', error);
    res.status(500).json({ success: false, message: 'Failed to publish class results', error: error.message });
  }
});

module.exports = router;
