const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const AnswerScript = require('../models/AnswerScript');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const User = require('../models/User');
const Result = require('../models/Result');

// Apply verifyToken and authorize('hod') to all routes in this router
router.use(verifyToken);
router.use(authorize('hod'));

/**
 * Get HOD department evaluation insights
 * GET /api/v1/hod/insights
 */
router.get('/insights', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dept = user.department;
    if (!dept) {
      return res.status(400).json({ success: false, message: 'No department associated with this HOD' });
    }

    // 1. Get subjects belonging to HOD's department
    const subjects = await Subject.find({ department: { $regex: new RegExp('^' + dept.trim() + '$', 'i') } });
    const subjectIds = subjects.map(s => s._id);

    // 2. Find all scripts matching these subjects
    const scripts = await AnswerScript.find({
      subjectId: { $in: subjectIds }
    })
      .populate('studentId', 'usn name department semester')
      .populate({
        path: 'examId',
        populate: { path: 'subjectId', select: 'subjectCode subjectName' }
      })
      .populate('evaluatorId', 'name employeeId');

    // 3. Find computed final SEE results for this department
    const results = await Result.find({ department: { $regex: new RegExp('^' + dept.trim() + '$', 'i') } })
      .populate('studentId', 'name usn department semester');

    // 4. Basic script valuation metrics
    const totalScripts = scripts.length;
    const evaluatedScripts = scripts.filter(s => ['evaluated', 'published'].includes(s.status)).length;
    const publishedScripts = scripts.filter(s => s.status === 'published').length;
    const pendingScripts = totalScripts - evaluatedScripts;

    const evaluatedOnly = scripts.filter(s => ['evaluated', 'published'].includes(s.status));
    let averageMarks = 0;
    let passCount = 0;
    let failCount = 0;

    if (evaluatedOnly.length > 0) {
      const sum = evaluatedOnly.reduce((acc, s) => acc + (s.marksObtained || 0), 0);
      averageMarks = sum / evaluatedOnly.length;
      evaluatedOnly.forEach(s => {
        if (s.marksObtained >= 40) passCount++;
        else failCount++;
      });
    }

    const passRate = evaluatedOnly.length > 0 ? (passCount / evaluatedOnly.length) * 100 : 0;

    // 5. Compute CIE (Internal) Toppers and Slow Learners
    // Group scripts by student (only for internal exams)
    const studentCieData = {};
    
    scripts.forEach(s => {
      const isCie = s.examId && (s.examId.examType === 'internal1' || s.examId.examType === 'internal2');
      if (!isCie || !s.studentId || !['evaluated', 'published'].includes(s.status)) return;
      
      const studentId = s.studentId._id.toString();
      const semester = s.examId.semester || s.studentId.semester || 1;
      
      if (!studentCieData[studentId]) {
        studentCieData[studentId] = {
          studentId,
          name: s.studentId.name,
          usn: s.studentId.usn,
          semester,
          totalMarks: 0,
          totalMax: 0,
          subjects: [],
          failedSubjects: []
        };
      }
      
      const score = s.marksObtained || 0;
      const max = s.maxMarks || 50;
      studentCieData[studentId].totalMarks += score;
      studentCieData[studentId].totalMax += max;
      
      const percentage = max > 0 ? (score / max) * 100 : 0;
      
      studentCieData[studentId].subjects.push({
        subjectCode: s.examId.subjectId?.subjectCode,
        subjectName: s.examId.subjectId?.subjectName,
        examType: s.examId.examType,
        score,
        max
      });

      // CIE Pass mark threshold is 40% (e.g. 20 out of 50)
      if (percentage < 40) {
        studentCieData[studentId].failedSubjects.push({
          subjectCode: s.examId.subjectId?.subjectCode,
          subjectName: s.examId.subjectId?.subjectName,
          examType: s.examId.examType,
          score,
          max
        });
      }
    });

    const ciePerformanceList = Object.values(studentCieData).map(std => {
      const avgPercent = std.totalMax > 0 ? (std.totalMarks / std.totalMax) * 100 : 0;
      return {
        ...std,
        avgPercent: Math.round(avgPercent * 100) / 100
      };
    });

    // 6. Group course stats including highest, lowest, average, and failures
    const courseStats = {};
    subjects.forEach(sub => {
      courseStats[sub.subjectCode] = {
        subjectCode: sub.subjectCode,
        subjectName: sub.subjectName,
        semester: sub.semester || 1,
        total: 0,
        evaluated: 0,
        marksSum: 0,
        pass: 0,
        highest: -1,
        lowest: 101,
        failures: 0
      };
    });

    scripts.forEach(s => {
      const code = s.examId?.subjectId?.subjectCode;
      if (code && courseStats[code]) {
        courseStats[code].total++;
        if (['evaluated', 'published'].includes(s.status)) {
          courseStats[code].evaluated++;
          const score = s.marksObtained || 0;
          courseStats[code].marksSum += score;
          
          if (score > courseStats[code].highest) courseStats[code].highest = score;
          if (score < courseStats[code].lowest) courseStats[code].lowest = score;

          if (score >= 40) {
            courseStats[code].pass++;
          } else {
            courseStats[code].failures++;
          }
        }
      }
    });

    const courseBreakdown = Object.values(courseStats).map(c => {
      return {
        subjectCode: c.subjectCode,
        subjectName: c.subjectName,
        semester: c.semester,
        total: c.total,
        evaluated: c.evaluated,
        avgMarks: c.evaluated > 0 ? Math.round((c.marksSum / c.evaluated) * 100) / 100 : 0,
        passRate: c.evaluated > 0 ? Math.round((c.pass / c.evaluated) * 100) / 100 : 0,
        highest: c.highest === -1 ? '-' : c.highest,
        lowest: c.lowest === 101 ? '-' : c.lowest,
        failures: c.failures
      };
    });

    // 7. Assemble final SEE toppers and slow learners
    const seePerformanceList = results.map(r => {
      const failedSubjects = r.subjectResults
        .filter(sub => sub.result === 'FAIL')
        .map(sub => ({
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          score: sub.marksObtained,
          max: sub.maxMarks
        }));

      return {
        studentId: r.studentId?._id,
        name: r.studentId?.name || 'N/A',
        usn: r.usn,
        semester: r.semester,
        sgpa: r.sgpa,
        cgpa: r.cgpa,
        overallResult: r.overallResult,
        failedSubjects
      };
    });

    res.json({
      success: true,
      data: {
        department: dept,
        totalScripts,
        evaluatedScripts,
        publishedScripts,
        pendingScripts,
        averageMarks: Math.round(averageMarks * 100) / 100,
        passCount,
        failCount,
        passRate: Math.round(passRate * 100) / 100,
        courseBreakdown,
        scripts: scripts.slice(0, 50),
        ciePerformance: ciePerformanceList,
        seePerformance: seePerformanceList
      }
    });
  } catch (error) {
    console.error('Error fetching HOD insights:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch insights', error: error.message });
  }
});

/**
 * Get HOD department remedial ML analysis
 * POST /api/v1/hod/remedial-analysis
 */
router.post('/remedial-analysis', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dept = user.department;
    if (!dept) {
      return res.status(400).json({ success: false, message: 'No department associated with this HOD' });
    }

    const { semester, academicYear } = req.body;
    if (!semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'Semester and academicYear are required' });
    }

    // 1. Fetch results for this department and semester
    const results = await Result.find({
      department: { $regex: new RegExp('^' + dept.trim() + '$', 'i') },
      semester: parseInt(semester),
      academicYear
    }).populate('studentId', 'name usn');

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'No computed results found for the selected semester' });
    }

    // 2. Format students data for AI agent
    const studentsPayload = [];
    for (const r of results) {
      // Find previous semesters' SGPAs for this student to calculate historical SGPAs
      const prevResults = await Result.find({
        studentId: r.studentId?._id || r.studentId,
        semester: { $lt: r.semester }
      }).sort({ semester: 1 });

      const historicalSGPAs = prevResults.map(p => p.sgpa || 0.0);
      // Fallback if no history exists (logistic regression needs numbers)
      if (historicalSGPAs.length === 0) {
        historicalSGPAs.push(r.sgpa - 0.2 > 0 ? r.sgpa - 0.2 : 6.0);
      }

      const subjectResults = r.subjectResults.map(s => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        marksObtained: s.marksObtained,
        percentage: s.percentage,
        grade: s.grade,
        isPassed: s.result === 'PASS'
      }));

      studentsPayload.push({
        studentId: r.studentId?._id?.toString() || r.studentId?.toString(),
        usn: r.usn,
        name: r.studentId?.name || 'N/A',
        department: r.department,
        semester: r.semester,
        sgpa: r.sgpa,
        historicalSGPAs,
        subjectResults
      });
    }

    // 3. Call Python AI Agent
    const axios = require('axios');
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const payload = {
      results: studentsPayload,
      departments: [dept],
      semester: parseInt(semester),
      academicYear
    };

    console.log(`Calling Analytics AI Agent at: ${aiServiceUrl}/agents/analytics`);
    const agentRes = await axios.post(`${aiServiceUrl}/agents/analytics`, payload);

    if (agentRes.data?.status !== 'SUCCESS') {
      return res.status(500).json({ success: false, message: 'AI Agent failed to analyze results', error: agentRes.data?.error });
    }

    res.json({
      success: true,
      data: agentRes.data
    });

  } catch (error) {
    console.error('Error in HOD remedial analysis:', error);
    res.status(500).json({ success: false, message: 'Failed to run remedial analysis', error: error.message });
  }
});

module.exports = router;
