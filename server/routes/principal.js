/**
 * Principal Routes - College-wide Insights
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const AnswerScript = require('../models/AnswerScript');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const User = require('../models/User');
const Result = require('../models/Result');

router.use(verifyToken);
router.use(authorize('principal'));

/**
 * Get college-wide department performance summary
 * GET /api/v1/principal/insights
 */
router.get('/insights', async (req, res) => {
  try {
    // 1. Fetch all subjects, scripts, results
    const subjects = await Subject.find();
    const scripts = await AnswerScript.find()
      .populate('studentId', 'usn name department semester')
      .populate({
        path: 'examId',
        populate: { path: 'subjectId', select: 'subjectCode subjectName' }
      })
      .populate('evaluatorId', 'name employeeId');

    const results = await Result.find()
      .populate('studentId', 'name usn department semester');

    // 2. College-wide metrics
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

    // 3. Department-wide breakdown
    const deptStats = {};
    
    // Seed departments from computed results
    results.forEach(r => {
      const dept = r.department;
      if (dept && !deptStats[dept]) {
        deptStats[dept] = {
          department: dept,
          totalScripts: 0,
          evaluatedScripts: 0,
          marksSum: 0,
          passCount: 0,
          failCount: 0,
          sgpaSum: 0,
          topper: null
        };
      }
    });

    // Fallback seed from scripts
    scripts.forEach(s => {
      const dept = s.studentId?.department;
      if (dept && !deptStats[dept]) {
        deptStats[dept] = {
          department: dept,
          totalScripts: 0,
          evaluatedScripts: 0,
          marksSum: 0,
          passCount: 0,
          failCount: 0,
          sgpaSum: 0,
          topper: null
        };
      }
    });

    // Compute scripts metrics per department
    scripts.forEach(s => {
      const dept = s.studentId?.department;
      if (dept && deptStats[dept]) {
        deptStats[dept].totalScripts++;
        if (['evaluated', 'published'].includes(s.status)) {
          deptStats[dept].evaluatedScripts++;
          const score = s.marksObtained || 0;
          deptStats[dept].marksSum += score;
          if (score >= 40) {
            deptStats[dept].passCount++;
          } else {
            deptStats[dept].failCount++;
          }
        }
      }
    });

    // Process results per department for SGPA & toppers
    results.forEach(r => {
      const dept = r.department;
      if (dept && deptStats[dept]) {
        deptStats[dept].sgpaSum += (r.sgpa || 0);
        
        // Track department topper
        if (!deptStats[dept].topper || r.sgpa > deptStats[dept].topper.sgpa) {
          deptStats[dept].topper = {
            name: r.studentId?.name || 'N/A',
            usn: r.usn,
            sgpa: r.sgpa
          };
        }
      }
    });

    const departmentBreakdown = Object.values(deptStats).map(d => {
      const studentCount = results.filter(r => r.department === d.department).length;
      return {
        department: d.department,
        totalScripts: d.totalScripts,
        evaluatedScripts: d.evaluatedScripts,
        avgMarks: d.evaluatedScripts > 0 ? Math.round((d.marksSum / d.evaluatedScripts) * 100) / 100 : 0,
        passRate: d.evaluatedScripts > 0 ? Math.round((d.passCount / d.evaluatedScripts) * 10000 / d.evaluatedScripts) / 100 : 0,
        avgSGPA: studentCount > 0 ? Math.round((d.sgpaSum / studentCount) * 100) / 100 : 0,
        topper: d.topper || { name: 'N/A', usn: 'N/A', sgpa: 0 }
      };
    });

    // 4. College Toppers (top 10 based on results SGPA)
    const collegeToppers = results
      .sort((a, b) => b.sgpa - a.sgpa)
      .slice(0, 10)
      .map((r, idx) => ({
        rank: idx + 1,
        name: r.studentId?.name || 'N/A',
        usn: r.usn,
        department: r.department,
        semester: r.semester,
        sgpa: r.sgpa
      }));

    res.json({
      success: true,
      data: {
        totalScripts,
        evaluatedScripts,
        publishedScripts,
        pendingScripts,
        averageMarks: Math.round(averageMarks * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        departmentBreakdown,
        collegeToppers
      }
    });

  } catch (error) {
    console.error('Error fetching Principal insights:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch college insights', error: error.message });
  }
});

module.exports = router;
