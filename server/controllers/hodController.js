/**
 * HOD Controller - Department-specific Head of Department operations
 * All data is filtered by HOD's department automatically
 */
const User = require('../models/User');
const Result = require('../models/Result');
const AnswerScript = require('../models/AnswerScript');

/**
 * Get HOD profile information
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, 'name username department email role');
    
    if (!user.department) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned to this HOD. Contact Admin.',
        code: 'NO_DEPARTMENT'
      });
    }

    return res.json({
      success: true,
      data: {
        name: user.name,
        username: user.username,
        department: user.department,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error getting HOD profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Standard HOD department resolver - use this in all HOD controllers
 * Returns the department name for the authenticated HOD
 */
exports.getHodDepartment = async (req) => {
  const hodUser = await User.findById(req.user.userId, 'department');
  const department = hodUser?.department;
  
  if (!department) {
    throw new Error('HOD department not configured. Contact Admin.');
  }
  
  return department;
};

/**
 * Get HOD insights - department-specific performance data
 */
exports.getInsights = async (req, res) => {
  try {
    const hodUser = await User.findById(req.user.userId, 'department name');
    const department = hodUser?.department;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'HOD department not configured. Contact Admin.'
      });
    }

    const { semester, academicYear } = req.query;

    // Build filter for published results
    const filter = {
      department: department,
      isPublished: true
    };

    if (semester && semester !== 'all') {
      filter.semester = parseInt(semester);
    }
    if (academicYear && academicYear !== 'all') {
      filter.academicYear = academicYear;
    }

    // Fetch published results
    const results = await Result.find(filter)
      .populate('studentId', 'name usn department semester')
      .lean();

    // Fetch answer scripts for evaluation stats
    const scriptFilter = { department: department };
    if (semester && semester !== 'all') {
      scriptFilter.semester = parseInt(semester);
    }

    const allScripts = await AnswerScript.find(scriptFilter).lean();
    const evaluatedScripts = allScripts.filter(s => s.isEvaluated === true);

    // Compute summary statistics
    const totalStudents = results.length;
    const passCount = results.filter(r => r.overallResult === 'PASS').length;
    const failCount = totalStudents - passCount;
    const passRate = totalStudents > 0 
      ? Math.round((passCount / totalStudents) * 100 * 10) / 10
      : 0;

    const avgSGPA = totalStudents > 0
      ? Math.round((results.reduce((sum, r) => sum + (r.sgpa || 0), 0) / totalStudents) * 100) / 100
      : 0;

    const highestSGPA = results.length > 0
      ? Math.max(...results.map(r => r.sgpa || 0))
      : 0;

    const lowestSGPA = results.length > 0
      ? Math.min(...results.map(r => r.sgpa || 0))
      : 0;

    // Total marks for scripts
    const totalMarks = evaluatedScripts.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    const averageMarks = evaluatedScripts.length > 0
      ? Math.round((totalMarks / evaluatedScripts.length) * 10) / 10
      : 0;

    // SEE Performance (Final exam results)
    const seePerformance = results.map(r => ({
      usn: r.studentId?.usn || r.usn,
      name: r.studentId?.name || 'Unknown',
      semester: r.semester,
      sgpa: r.sgpa || 0,
      cgpa: r.cgpa || 0,
      overallResult: r.overallResult,
      failedSubjects: r.subjectResults?.filter(sr => !sr.isPassed).map(sr => ({
        subjectCode: sr.subjectCode,
        subjectName: sr.subjectName,
        marksObtained: sr.marksObtained
      })) || []
    }));

    // CIE Performance (internal marks - mock data for now)
    // In a real system, this would come from internal assessment records
    const ciePerformance = seePerformance.map(s => ({
      usn: s.usn,
      name: s.name,
      semester: s.semester,
      avgPercent: Math.min(100, Math.max(0, (s.sgpa / 10) * 100 + Math.random() * 10 - 5)),
      failedSubjects: s.failedSubjects
    }));

    // Student rankings (top 10)
    const rankings = [...seePerformance]
      .sort((a, b) => (b.sgpa || 0) - (a.sgpa || 0))
      .slice(0, 10)
      .map((r, i) => ({
        rank: i + 1,
        usn: r.usn,
        name: r.name,
        sgpa: r.sgpa,
        cgpa: r.cgpa,
        overallResult: r.overallResult
      }));

    // Grade distribution
    const gradeDistribution = {};
    results.forEach(result => {
      result.subjectResults?.forEach(sr => {
        const grade = sr.grade || 'F';
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      });
    });

    // Subject-wise statistics
    const subjectMap = {};
    results.forEach(result => {
      result.subjectResults?.forEach(sr => {
        const code = sr.subjectCode;
        if (!subjectMap[code]) {
          subjectMap[code] = {
            subjectCode: code,
            subjectName: sr.subjectName,
            semester: sr.semester || 1,
            total: 0,
            passed: 0,
            totalMarks: 0,
            maxMarks: 0
          };
        }
        subjectMap[code].total++;
        if (sr.isPassed) subjectMap[code].passed++;
        subjectMap[code].totalMarks += (sr.marksObtained || 0);
        subjectMap[code].maxMarks += (sr.maxMarks || 0);
      });
    });

    const subjectWise = Object.values(subjectMap).map(s => ({
      ...s,
      passPercentage: s.total > 0 
        ? Math.round((s.passed / s.total) * 100)
        : 0,
      avgMarks: s.total > 0 
        ? Math.round((s.totalMarks / s.total) * 10) / 10
        : 0,
      evaluated: s.passed,
      passRate: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0
    }));

    // Slow learners (risk students)
    const slowLearners = seePerformance
      .filter(r => r.sgpa < 6.0 || r.overallResult === 'FAIL')
      .map(r => ({
        usn: r.usn,
        name: r.name,
        sgpa: r.sgpa,
        overallResult: r.overallResult,
        failedSubjects: r.failedSubjects,
        riskLevel: r.sgpa < 5.0 ? 'High' : r.sgpa < 6.0 ? 'Medium' : 'Low',
        riskScore: r.sgpa < 5.0 ? 85 : r.sgpa < 6.0 ? 65 : 45
      }));

    return res.json({
      success: true,
      data: {
        department,
        semester: semester || 'all',
        academicYear: academicYear || 'all',
        
        // Script evaluation stats
        totalScripts: allScripts.length,
        evaluatedScripts: evaluatedScripts.length,
        averageMarks: averageMarks,
        passRate: passRate,
        
        // Performance data
        seePerformance,
        ciePerformance,
        
        // Summary
        summary: {
          totalStudents,
          passCount,
          failCount,
          passPercentage: passRate,
          avgSGPA,
          highestSGPA,
          lowestSGPA
        },
        
        rankings,
        gradeDistribution,
        subjectWise,
        slowLearners,
        // Alias for backward compatibility
        courseBreakdown: subjectWise
      }
    });
  } catch (error) {
    console.error('Error getting HOD insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: error.message
    });
  }
};