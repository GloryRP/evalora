const axios = require('axios');
const nodemailer = require('nodemailer');
const AnswerScript = require('../models/AnswerScript');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const GradingScheme = require('../models/GradingScheme');
const Result = require('../models/Result');
const InstitutionConfig = require('../models/InstitutionConfig');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send result publication email to student
 */
const sendResultEmail = async (studentUser, result, instName) => {
  try {
    if (!studentUser.email || !studentUser.email.includes('@')) {
      console.warn(`No valid email for student USN ${result.usn}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const isPass = result.overallResult === 'PASS';
    const statusColor = isPass ? '#2D7A5F' : '#ef4444';

    const rows = result.subjectResults.map((r, i) => {
      const rowBg = r.grade === 'F' ? '#FEE2E2' : (i % 2 === 0 ? 'white' : '#f8f9fa');
      return `
        <tr style="background:${rowBg}">
          <td style="padding:10px; border:1px solid #dee2e6;">${r.subjectName}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-family:monospace;">${r.subjectCode}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${r.credits}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${r.marksObtained} / ${r.maxMarks}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${r.percentage}%</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold; color:#C9A227;">${r.grade}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${r.gradePoint}</td>
          <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold; color:${r.result === 'PASS' ? '#2D7A5F' : '#ef4444'}">${r.result}</td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border:1px solid #dee2e6; border-radius:8px; overflow:hidden;">
        <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom:4px solid #C9A227;">
          <h2 style="margin:0">${instName}</h2>
          <p style="margin:4px 0 0 0">Official Examination Result Sheet</p>
        </div>
        
        <div style="padding: 20px; background: white;">
          <p><strong>Dear ${studentUser.name},</strong></p>
          <p>Your results for Semester ${result.semester} (Academic Year ${result.academicYear}) have been published.</p>

          <div style="background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin: 16px 0; border-radius:4px;">
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding:6px; font-weight:bold; color:#666;">Name:</td>
                <td style="padding:6px; color:#111;">${studentUser.name}</td>
                <td style="padding:6px; font-weight:bold; color:#666;">USN:</td>
                <td style="padding:6px; color:#111; font-family:monospace;">${result.usn}</td>
              </tr>
              <tr>
                <td style="padding:6px; font-weight:bold; color:#666;">Semester:</td>
                <td style="padding:6px; color:#111;">${result.semester}</td>
                <td style="padding:6px; font-weight:bold; color:#666;">Academic Year:</td>
                <td style="padding:6px; color:#111;">${result.academicYear}</td>
              </tr>
            </table>
          </div>

          <div style="display:flex; justify-content:space-around; background:#f0f4f8; border:1px solid #d0dbe5; border-radius:6px; padding:16px; margin:20px 0; text-align:center;">
            <div style="flex:1;">
              <div style="font-size:12px; color:#666; font-weight:bold; text-transform:uppercase;">SGPA</div>
              <div style="font-size:24px; font-weight:bold; color:#1E3A5F; margin-top:4px;">${result.sgpa.toFixed(2)}</div>
            </div>
            <div style="flex:1; border-left:1px solid #d0dbe5; border-right:1px solid #d0dbe5;">
              <div style="font-size:12px; color:#666; font-weight:bold; text-transform:uppercase;">Cumulative GPA</div>
              <div style="font-size:24px; font-weight:bold; color:#1E3A5F; margin-top:4px;">${result.cgpa.toFixed(2)}</div>
            </div>
            <div style="flex:1;">
              <div style="font-size:12px; color:#666; font-weight:bold; text-transform:uppercase;">Overall Result</div>
              <div style="font-size:16px; font-weight:bold; color:white; background:${statusColor}; display:inline-block; padding:4px 12px; border-radius:4px; margin-top:8px; text-transform:uppercase;">
                ${result.overallResult}
              </div>
            </div>
          </div>

          <h3 style="color:#1E3A5F; border-bottom: 2px solid #C9A227; padding-bottom: 8px; margin-top:24px;">Subject-wise Breakdown</h3>
          <table style="width:100%; border-collapse:collapse; font-size: 13px; margin-bottom:20px;">
            <thead>
              <tr style="background:#1E3A5F; color:white;">
                <th style="padding:10px; border:1px solid #dee2e6; text-align:left;">Subject</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Code</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Credits</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Marks</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Percentage</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Grade</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Grade Points</th>
                <th style="padding:10px; border:1px solid #dee2e6;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div style="background:#fff3cd; border:1px solid #ffc107; padding:12px; margin:16px 0; border-radius:4px; font-size:13px; color:#856404; line-height:1.5;">
            <strong>Important Notice:</strong><br/>
            Login to the portal to view your detailed results and performance analysis. Contact Exam Cell for re-evaluation requests within 7 days of result publication.
          </div>
        </div>

        <div style="background:#f8f9fa; padding:12px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
          This is an auto-generated email from ${instName} Examination System.<br/>
          Do not reply to this email.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentUser.email,
      subject: `Results Published - Semester ${result.semester} - ${instName}`,
      html: emailHtml,
    });

    console.log(`✓ Email sent successfully to ${studentUser.email} — messageId: ${info.messageId}`);

  } catch (err) {
    console.error(`✗ EMAIL SEND FAILED for ${studentUser.email}:`, err.message);
    console.error('Full error:', err);
  }
};

/**
 * Send result summary email to HOD
 */
const sendHODSummaryEmail = async (hodUser, semester, deptName, passRate, avgSgpa, instName) => {
  try {
    if (!hodUser.email || !hodUser.email.includes('@')) {
      console.warn(`No valid email for HOD of ${deptName}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border:1px solid #dee2e6; border-radius:8px; overflow:hidden;">
        <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom:4px solid #C9A227;">
          <h2 style="margin:0">${instName}</h2>
          <p style="margin:4px 0 0 0">HOD Results Publication Summary</p>
        </div>
        
        <div style="padding: 20px; background: white; line-height: 1.6;">
          <p><strong>Dear Prof. ${hodUser.name},</strong></p>
          <p>Results for <strong>Semester ${semester}</strong>, Department of <strong>${deptName}</strong> have been officially published by the Exam Cell.</p>

          <div style="background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin: 16px 0; border-radius:4px;">
            <h3 style="margin:0 0 12px 0; color:#1E3A5F; border-bottom:1px solid #eee; padding-bottom:6px;">Performance Highlights</h3>
            <table style="width:100%; border-collapse: collapse; font-size:14px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; color:#666;">Pass Rate:</td>
                <td style="padding:6px 0; color:#111; font-weight:bold; font-size:16px; color:#2D7A5F;">${passRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold; color:#666;">Class Average SGPA:</td>
                <td style="padding:6px 0; color:#111; font-weight:bold; font-size:16px; color:#1E3A5F;">${avgSgpa.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p>Please log into your Vidyā HOD Portal to view full subject breakdowns, class distributions, and performance graphs.</p>
        </div>

        <div style="background:#f8f9fa; padding:12px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
          This is an auto-generated summary report from ${instName} Examination System.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: hodUser.email,
      subject: `Summary: Semester ${semester} Results Published - ${deptName} - ${instName}`,
      html: emailHtml,
    });

    console.log(`✓ Email sent successfully to HOD ${hodUser.email} — messageId: ${info.messageId}`);

  } catch (err) {
    console.error(`✗ EMAIL SEND FAILED for HOD ${hodUser.email}:`, err.message);
    console.error('Full error:', err);
  }
};

/**
 * Compute results for a semester/academicYear using GPA AI Agent
 * POST /api/v1/results/compute
 */
exports.computeResults = async (req, res) => {
  try {
    const { semester, academicYear, department } = req.body;

    if (!semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'semester and academicYear are required' });
    }

    // Find all evaluated answer scripts
    const scripts = await AnswerScript.find({ status: { $in: ['evaluated', 'published'] } })
      .populate('studentId')
      .populate({
        path: 'examId',
        populate: { path: 'subjectId' }
      });

    // Filter by semester and optionally department
    let filteredScripts = scripts.filter(s => {
      if (!s.studentId || !s.examId || !s.examId.subjectId) return false;
      
      const semMatch = s.examId.semester === parseInt(semester);
      const deptMatch = !department || 
        s.studentId.department?.trim().toLowerCase() === department.trim().toLowerCase();
      
      return semMatch && deptMatch;
    });

    if (filteredScripts.length === 0) {
      return res.status(404).json({ success: false, message: 'No evaluated answer scripts found for the selected criteria' });
    }

    // Group scripts by student
    const studentRawScripts = {};
    filteredScripts.forEach(script => {
      if (!script.studentId || !script.examId || !script.examId.subjectId) return;
      const studentId = script.studentId._id.toString();
      if (!studentRawScripts[studentId]) {
        studentRawScripts[studentId] = {
          student: script.studentId,
          scripts: []
        };
      }
      studentRawScripts[studentId].scripts.push(script);
    });

    const studentsInput = [];
    for (const studentId of Object.keys(studentRawScripts)) {
      const { student, scripts } = studentRawScripts[studentId];
      
      // Group scripts by subject ID
      const subjectScripts = {};
      scripts.forEach(s => {
        const subId = s.examId.subjectId._id.toString();
        if (!subjectScripts[subId]) {
          subjectScripts[subId] = {
            subject: s.examId.subjectId,
            internal1: 0,
            internal2: 0,
            external: 0,
            representativeExamId: s.examId._id
          };
        }
        
        const examType = s.examId.examType;
        const marks = s.marksObtained || 0;
        
        if (examType === 'internal1') {
          subjectScripts[subId].internal1 = marks;
        } else if (examType === 'internal2') {
          subjectScripts[subId].internal2 = marks;
        } else {
          // external, makeup or regular
          subjectScripts[subId].external = marks;
          subjectScripts[subId].representativeExamId = s.examId._id;
        }
      });
      
      const subjectsPayload = [];
      for (const subId of Object.keys(subjectScripts)) {
        const item = subjectScripts[subId];
        
        // VTU: CIE = (internal1 + internal2) / 2 (since each internal is out of 50)
        const cie = (item.internal1 + item.internal2) / 2;
        
        // VTU: SEE = external (out of 100) scaled to 50
        const seeScaled = item.external / 2;
        
        const finalScore = cie + seeScaled;
        
        subjectsPayload.push({
          examId: item.representativeExamId.toString(),
          subjectId: item.subject._id.toString(),
          subjectCode: item.subject.subjectCode,
          subjectName: item.subject.subjectName,
          credits: item.subject.credits || 4,
          maxMarks: 100, // Final combined max marks is 100
          marksObtained: Math.round(finalScore * 100) / 100
        });
      }
      
      studentsInput.push({
        studentId: student._id.toString(),
        usn: student.usn,
        name: student.name,
        semester: parseInt(semester),
        department: student.department,
        subjects: subjectsPayload
      });
    }

    // Fetch active grading scheme
    const activeScheme = await GradingScheme.findOne({ isActive: true });
    if (!activeScheme) {
      return res.status(404).json({ success: false, message: 'No active grading scheme found in the database' });
    }

    // Call Python agent
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const agentPayload = {
      students: studentsInput,
      gradingScheme: activeScheme.gradeTable.map(g => ({
        minPercentage: g.minPercentage,
        maxPercentage: g.maxPercentage,
        grade: g.grade,
        gradePoint: g.gradePoint,
        description: g.description
      })),
      passMarkPercentage: activeScheme.passMarkPercentage
    };

    console.log('Calling GPA Agent at:', `${aiServiceUrl}/agents/compute-gpa`);
    const agentResponse = await axios.post(`${aiServiceUrl}/agents/compute-gpa`, agentPayload);
    
    if (agentResponse.data?.status !== 'SUCCESS') {
      return res.status(500).json({ 
        success: false, 
        message: 'GPA Agent failed to process results', 
        error: agentResponse.data?.error 
      });
    }

    const computedResults = agentResponse.data.results;
    const savedResults = [];

    // Save results and calculate CGPA
    for (const r of computedResults) {
      // Result Immutability Safety Check:
      // If a result is already published, it cannot be modified
      const existing = await Result.findOne({
        studentId: r.studentId,
        semester: parseInt(semester),
        academicYear: academicYear
      });

      if (existing && existing.isPublished) {
        return res.status(400).json({
          success: false,
          message: `Published results cannot be modified for student USN ${r.usn}. Contact system admin.`
        });
      }

      // Fetch all previous Result documents for this student to calculate CGPA
      const previousResults = await Result.find({
        studentId: r.studentId,
        semester: { $ne: parseInt(semester) },
        isPublished: true
      });

      // Compute CGPA: CGPA = sum(gradePoint*credits) / sum(credits)
      let totalPoints = r.totalGradePoints;
      let totalCredits = r.totalCredits;

      previousResults.forEach(prev => {
        totalPoints += (prev.totalGradePoints || 0);
        totalCredits += (prev.totalCredits || 0);
      });

      const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;

      const resultDoc = await Result.findOneAndUpdate(
        { studentId: r.studentId, semester: parseInt(semester), academicYear: academicYear },
        {
          studentId: r.studentId,
          usn: r.usn,
          semester: parseInt(semester),
          academicYear: academicYear,
          department: r.department,
          subjectResults: r.subjectResults,
          totalCredits: r.totalCredits,
          totalGradePoints: r.totalGradePoints,
          sgpa: r.sgpa,
          cgpa: cgpa,
          overallResult: r.overallResult,
          computedAt: new Date(),
          computedBy: 'GPA_AGENT',
          isPublished: false
        },
        { new: true, upsert: true }
      );

      savedResults.push(resultDoc);
    }

    res.json({
      success: true,
      message: `Results successfully computed for ${savedResults.length} students`,
      summary: agentResponse.data.summary,
      data: savedResults
    });

  } catch (error) {
    console.error('Error computing results:', error);
    res.status(500).json({ success: false, message: 'Failed to compute results', error: error.message });
  }
};

/**
 * Get all computed results
 * GET /api/v1/results
 */
exports.getResults = async (req, res) => {
  try {
    const { semester, academicYear, department, isPublished } = req.query;
    const query = {};
    
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (department) query.department = department;
    if (isPublished !== undefined && isPublished !== '') {
      query.isPublished = isPublished === 'true';
    }

    const results = await Result.find(query)
      .populate('studentId', 'usn name department semester email')
      .sort({ usn: 1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
};

/**
 * Get results for a single student (all semesters)
 * GET /api/v1/results/:studentId
 */
exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await Result.find({ studentId })
      .populate('studentId')
      .sort({ semester: 1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student results', error: error.message });
  }
};

/**
 * Bulk Publish Results
 * POST /api/v1/results/publish
 */
exports.publishResults = async (req, res) => {
  try {
    const { semester, academicYear, department } = req.body;

    if (!semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'semester and academicYear are required' });
    }

    const query = {
      semester: parseInt(semester),
      academicYear,
      isPublished: false,
    };

    if (department) {
      query.department = department;
    }

    const results = await Result.find(query);
    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'No unpublished computed results found matching the criteria' });
    }

    const config = await InstitutionConfig.findOne() || {};
    const instName = config.institutionName || 'Examination System';
    const publishedAt = new Date();

    // Bulk update database fields
    await Result.updateMany(query, {
      isPublished: true,
      publishedAt,
      publishedBy: req.user.userId,
    });

    let passCount = 0;
    let totalSgpa = 0;

    for (const result of results) {
      if (result.overallResult === 'PASS') passCount++;
      totalSgpa += (result.sgpa || 0);

      // Notify Student
      const studentUser = await User.findOne({ username: { $regex: new RegExp('^' + result.usn + '$', 'i') } });
      if (studentUser) {
        // Create student in-app notification
        await Notification.create({
          recipientId: studentUser._id,
          recipientRole: 'student',
          type: 'result_published',
          title: `Exam Results Published - Semester ${semester}`,
          message: `Your results for Semester ${semester} are published. SGPA: ${result.sgpa}`,
          data: { semester, sgpa: result.sgpa, cgpa: result.cgpa },
        }).catch(err => console.error(err));

        // Send email
        await sendResultEmail(studentUser, result, instName);
      }
    }

    // Send HOD summary alerts
    const passRate = results.length > 0 ? (passCount / results.length) * 100 : 0;
    const classAvgSgpa = results.length > 0 ? (totalSgpa / results.length) : 0;
    const deptName = department || results[0].department;

    const hodUser = await User.findOne({ role: 'hod', department: { $regex: new RegExp('^' + deptName + '$', 'i') } });
    if (hodUser) {
      await Notification.create({
        recipientId: hodUser._id,
        recipientRole: 'hod',
        type: 'result_published',
        title: `Semester ${semester} Results Published`,
        message: `Results published for Sem ${semester}, ${deptName}. Pass Rate: ${passRate.toFixed(1)}%, Class Avg SGPA: ${classAvgSgpa.toFixed(2)}`,
        data: { semester, department: deptName, passRate, classAvgSgpa },
      }).catch(err => console.error(err));

      await sendHODSummaryEmail(hodUser, semester, deptName, passRate, classAvgSgpa, instName);
    }

    res.json({
      success: true,
      message: `Successfully published results for ${results.length} students`,
      count: results.length,
    });

  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({ success: false, message: 'Failed to publish results', error: error.message });
  }
};

/**
 * Publish a single student's result
 * POST /api/v1/results/publish/:resultId
 */
exports.publishSingleResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (result.isPublished) {
      return res.status(400).json({ success: false, message: 'Result is already published' });
    }

    const config = await InstitutionConfig.findOne() || {};
    const instName = config.institutionName || 'Examination System';

    result.isPublished = true;
    result.publishedAt = new Date();
    result.publishedBy = req.user.userId;
    await result.save();

    const studentUser = await User.findOne({ username: { $regex: new RegExp('^' + result.usn + '$', 'i') } });
    if (studentUser) {
      await Notification.create({
        recipientId: studentUser._id,
        recipientRole: 'student',
        type: 'result_published',
        title: `Exam Results Published - Semester ${result.semester}`,
        message: `Your results for Semester ${result.semester} are published. SGPA: ${result.sgpa}`,
        data: { semester: result.semester, sgpa: result.sgpa, cgpa: result.cgpa },
      }).catch(err => console.error(err));

      await sendResultEmail(studentUser, result, instName);
    }

    res.json({
      success: true,
      message: `Successfully published result for student ${result.usn}`,
      data: result,
    });
  } catch (error) {
    console.error('Error publishing single result:', error);
    res.status(500).json({ success: false, message: 'Failed to publish result', error: error.message });
  }
};

/**
 * Get results for logged-in student (published only)
 * GET /api/v1/results/my-results
 */
exports.getMyResults = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = await Student.findOne({ usn: { $regex: new RegExp('^' + user.username + '$', 'i') } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const results = await Result.find({
      studentId: student._id,
      isPublished: true,
    }).sort({ semester: 1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching my results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
};

/**
 * Get results for logged-in student for a specific semester
 * GET /api/v1/results/my-results/:semester
 */
exports.getMyResultForSemester = async (req, res) => {
  try {
    const { semester } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = await Student.findOne({ usn: { $regex: new RegExp('^' + user.username + '$', 'i') } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const result = await Result.findOne({
      studentId: student._id,
      semester: parseInt(semester),
      isPublished: true,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found or not published' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching semester result:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch result', error: error.message });
  }
};
