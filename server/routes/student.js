/**
 * Student Routes
 * Handles student-specific data retrieval (hall tickets, timetables)
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const Exam = require('../models/Exam');
const HallAllocation = require('../models/HallAllocation');
const Student = require('../models/Student');
const User = require('../models/User');
const AnswerScript = require('../models/AnswerScript');

/**
 * GET /api/v1/student/hall-ticket
 * Get hall ticket for logged-in student
 * Returns all exams assigned to this student with hall details
 */
router.get('/hall-ticket', verifyToken, authorize('student'), async (req, res) => {
  try {
    // Find student by user ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const student = await Student.findOne({ usn: user.username });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Find all hall allocations for this student
    const allocations = await HallAllocation.find({
      studentId: student._id,
    })
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department'
        }
      })
      .populate('hallId', 'name hallName building capacity');

    // Build hall ticket data
    const hallTicket = allocations
      .filter((alloc) => alloc.examId && alloc.hallId)
      .map((alloc) => {
        return {
          examId: alloc.examId._id,
          subject: alloc.examId.subjectId?.subjectName || 'N/A',
          subjectCode: alloc.examId.subjectId?.subjectCode || 'N/A',
          date: alloc.examId.examDate,
          time: `${alloc.examId.startTime || 'N/A'} - ${alloc.examId.endTime || 'N/A'}`,
          hall: alloc.hallId.hallName || alloc.hallId.name || 'N/A',
          building: alloc.hallId.building || 'N/A',
          seatNumber: alloc.seatNumber || '-',
          duration: '3 Hours',
        };
      });

    // Sort in memory by examDate ascending
    hallTicket.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          usn: student.usn,
          department: student.department,
          semester: student.semester,
        },
        exams: hallTicket,
        totalExams: hallTicket.length,
      },
    });
  } catch (error) {
    console.error('Error fetching hall ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hall ticket',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/student/timetable
 * Get timetable for student's semester and department
 */
router.get('/timetable', verifyToken, authorize('student'), async (req, res) => {
  try {
    // Find student by user ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const student = await Student.findOne({ usn: user.username });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Get exams for student's semester and department
    const exams = await Exam.find({
      semester: student.semester,
      status: 'scheduled',
    })
      .populate('subjectId', 'subjectCode subjectName department')
      .sort({ examDate: 1, startTime: 1 });

    // Filter to only this department (safe trimmed case-insensitive comparison)
    const relevantExams = exams.filter(
      (exam) => exam.subjectId && exam.subjectId.department && 
        exam.subjectId.department.trim().toLowerCase() === student.department.trim().toLowerCase()
    );

    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          usn: student.usn,
          department: student.department,
          semester: student.semester,
        },
        exams: relevantExams,
        totalExams: relevantExams.length,
      },
    });
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable',
      error: error.message,
    });
  }
});

// ============================================
// STUDENT RESULTS ROUTES
// ============================================

// Get published results for student
router.get('/results', verifyToken, authorize('student'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = await Student.findOne({ usn: user.username });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Find all published answer scripts for this student
    const scripts = await AnswerScript.find({
      studentId: student._id,
      status: 'published',
    })
      .populate({
        path: 'examId',
        populate: {
          path: 'subjectId',
          select: 'subjectCode subjectName department semester credits'
        }
      });

    const results = scripts.map((script) => {
      const marks = script.marksObtained;
      const max = script.maxMarks || 100;
      const percentage = (marks / max) * 100;
      
      // Calculate grade
      let grade = 'F';
      let gradePoint = 0;
      let passStatus = 'FAIL';

      if (percentage >= 90) { grade = 'O'; gradePoint = 10; passStatus = 'PASS'; }
      else if (percentage >= 80) { grade = 'A+'; gradePoint = 9; passStatus = 'PASS'; }
      else if (percentage >= 70) { grade = 'A'; gradePoint = 8; passStatus = 'PASS'; }
      else if (percentage >= 60) { grade = 'B+'; gradePoint = 7; passStatus = 'PASS'; }
      else if (percentage >= 50) { grade = 'B'; gradePoint = 6; passStatus = 'PASS'; }
      else if (percentage >= 40) { grade = 'C'; gradePoint = 5; passStatus = 'PASS'; }

      return {
        resultId: script._id,
        subjectCode: script.examId?.subjectId?.subjectCode || 'N/A',
        subjectName: script.examId?.subjectId?.subjectName || 'N/A',
        credits: script.examId?.subjectId?.credits || 4,
        semester: script.examId?.subjectId?.semester || script.examId?.semester || student.semester,
        examDate: script.examId?.examDate,
        marksObtained: marks,
        maxMarks: max,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        gradePoint,
        passStatus,
        comments: script.comments,
        filePath: script.filePath,
      };
    });

    // Calculate SGPA if results exist
    let totalCredits = 0;
    let weightedPoints = 0;
    results.forEach(r => {
      totalCredits += r.credits;
      weightedPoints += (r.gradePoint * r.credits);
    });
    const sgpa = totalCredits > 0 ? Math.round((weightedPoints / totalCredits) * 100) / 100 : null;

    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          usn: student.usn,
          department: student.department,
          semester: student.semester,
        },
        results,
        sgpa,
        totalCredits,
      },
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
});

module.exports = router;
