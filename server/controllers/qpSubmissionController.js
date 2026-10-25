/**
 * Question Paper Submission Controller
 * Multi-submission workflow: Exam Cell auto-assigns → Faculty submits →
 * Exam Cell reviews ALL submissions per subject → selects ONE final paper → archives others
 */
const mongoose = require('mongoose');
const QuestionPaperSubmission = require('../models/QuestionPaperSubmission');
const QPTemplate = require('../models/QPTemplate');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// Helper: get exam type label
const examTypeLabel = (t) => {
  const m = { internal1: 'Internal 1 (CIE-1)', internal2: 'Internal 2 (CIE-2)', external: 'External (SEE)', makeup: 'Makeup/Supplementary' };
  return m[t] || t;
};

// Helper: format date
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

/**
 * GET /api/v1/qp-submissions/subjects-preview?semester=N
 * Returns subjects for a semester with count of assigned faculty for UI preview
 */
exports.getSubjectsPreview = async (req, res) => {
  try {
    const { semester } = req.query;
    if (!semester) {
      return res.status(400).json({ success: false, message: 'semester is required' });
    }

    // CRITICAL FIX: always convert to Number before querying
    const semesterNum = parseInt(semester, 10);

    if (isNaN(semesterNum)) {
      return res.status(400).json({ success: false, message: 'Invalid semester value' });
    }

    console.log('Querying subjects with filter:', { semester: semesterNum, type: typeof semesterNum });

    const subjects = await Subject.find({ semester: semesterNum }).sort({ subjectCode: 1 }).lean();
    console.log(`Found ${subjects.length} subjects for semester ${semesterNum}`);
    const facultyList = await Faculty.find({}, '_id name employeeId subjectsAssigned department').lean();

    const data = subjects.map(sub => {
      const assigned = facultyList.filter(f =>
        (f.subjectsAssigned || []).some(id => id.toString() === sub._id.toString())
      );
      return {
        ...sub,
        facultyCount: assigned.length,
        facultyNames: assigned.map(f => f.name),
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getSubjectsPreview:', error);
    res.status(500).json({ success: false, message: 'Failed to get subjects preview', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// EXAM CELL CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/qp-submissions/auto-assign
 * Exam Cell triggers: assigns ALL faculty for ALL subjects in an exam series
 */
exports.autoAssign = async (req, res) => {
  try {
    const { semester, academicYear = '2025-26', examType, deadline, examSeriesId } = req.body;

    if (!semester || !examType || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'semester, examType, and deadline are required',
      });
    }

    // 1. Find QPTemplate pattern for this examType
    const pattern = await QPTemplate.findOne({ examType });

    if (!pattern) {
      return res.status(400).json({
        success: false,
        message: `Create question paper pattern for ${examTypeLabel(examType)} first in Config Patterns.`,
      });
    }

    // Build patternRef.questions from pattern slots
    const patternQuestions = [];
    (pattern.slots || []).forEach((slot, idx) => {
      patternQuestions.push({
        qNo: slot.questionNumber || `Q${idx * 2 + 1}`,
        maxMarks: slot.maxMarks,
        isOrQuestion: false,
        orGroupId: slot.or ? `grp_${idx}` : null,
      });
      if (slot.or) {
        patternQuestions.push({
          qNo: slot.or.questionNumber || `Q${idx * 2 + 2}`,
          maxMarks: slot.or.maxMarks,
          isOrQuestion: true,
          orGroupId: `grp_${idx}`,
        });
      }
    });

    // 2. Find all subjects for this semester directly
    const subjects = await Subject.find({ semester: Number(semester) });

    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No subjects found for Semester ${semester}. Please add subjects in Admin → Subjects.`,
      });
    }

    let assignmentsCreated = 0;
    let assignmentsSkipped = 0;
    const subjectsWithNoFaculty = [];
    const subjectDetails = [];

    // 3. For each subject, find ALL faculty who teach it
    for (const subject of subjects) {
      const facultyList = await Faculty.find({ subjectsAssigned: subject._id });

      subjectDetails.push({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        department: subject.department,
        semester: subject.semester,
        credits: subject.credits || 4,
        facultyAssignedCount: facultyList.length,
        facultyNames: facultyList.map(f => f.name),
      });

      if (facultyList.length === 0) {
        subjectsWithNoFaculty.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
        });
        continue;
      }

      for (const faculty of facultyList) {
        // Skip if already assigned for this subject, academicYear, examType
        const filter = {
          subjectId: subject._id,
          facultyId: faculty._id,
          academicYear,
          'patternRef.examType': examType,
        };

        const existing = await QuestionPaperSubmission.findOne(filter);

        if (existing) {
          assignmentsSkipped++;
          continue;
        }

        // Find faculty's User record
        const facultyUser = await User.findOne({ username: faculty.employeeId, role: 'faculty' });

        // Create assignment
        await QuestionPaperSubmission.create({
          examSeriesId: examSeriesId || null,
          academicYear,
          subjectId: subject._id,
          facultyId: faculty._id,
          facultyUserId: facultyUser?._id || null,
          patternRef: {
            examType: pattern.examType,
            totalMarks: pattern.maxMarks,
            questions: patternQuestions,
          },
          deadline: new Date(deadline),
          status: 'assigned',
        });

        assignmentsCreated++;

        // Send in-app notification + email to faculty
        if (facultyUser) {
          try {
            await sendNotification({
              recipientId: facultyUser._id,
              recipientRole: 'faculty',
              type: 'qp_assigned',
              title: `Question Paper Assignment — ${subject.subjectName}`,
              message: `You have been assigned to prepare the question paper for ${subject.subjectName} (${subject.subjectCode}). Deadline: ${fmtDate(deadline)}`,
              email: faculty.email,
              recipientName: faculty.name,
              data: {
                facultyName: faculty.name,
                subjectName: subject.subjectName,
                subjectCode: subject.subjectCode,
                examType: examTypeLabel(examType),
                semester,
                academicYear,
                department: subject.department,
                maxMarks: pattern.maxMarks,
                deadline: fmtDate(deadline),
                slots: pattern.slots || [],
              },
            });
          } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Assignments created successfully',
      summary: {
        subjectsProcessed: subjects.length,
        assignmentsCreated,
        assignmentsSkipped,
        subjectsWithNoFaculty,
        subjectDetails,
      },
    });
  } catch (error) {
    console.error('Error in autoAssign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignments',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/qp-submissions/overview
 * Subject-grouped overview showing all subjects and submission status
 */
exports.getOverview = async (req, res) => {
  try {
    const { examSeriesId, semester, examType, academicYear } = req.query;

    const filter = {};
    if (examSeriesId) filter.examSeriesId = examSeriesId;
    if (academicYear) filter.academicYear = academicYear;
    if (examType) filter['patternRef.examType'] = examType;

    let submissions = await QuestionPaperSubmission.find(filter)
      .populate('subjectId')
      .populate('facultyId', 'name employeeId department')
      .lean();

    if (semester) {
      submissions = submissions.filter(s => s.subjectId?.semester === Number(semester));
    }

    const subjectMap = {};

    for (const sub of submissions) {
      const subId = sub.subjectId?._id?.toString();
      if (!subId) continue;

      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: sub.subjectId._id,
          subjectCode: sub.subjectId.subjectCode,
          subjectName: sub.subjectId.subjectName,
          semester: sub.subjectId.semester,
          department: sub.subjectId.department,
          academicYear: sub.academicYear || '2025-26',
          totalAssigned: 0,
          submitted: 0,
          selected: 0,
          hasSelectedPaper: false,
          submissions: [],
        };
      }

      subjectMap[subId].totalAssigned++;

      if (['submitted', 'under_review', 'revision_requested', 'selected', 'archived'].includes(sub.status)) {
        subjectMap[subId].submitted++;
      }

      if (sub.isSelected || sub.status === 'selected') {
        subjectMap[subId].selected++;
        subjectMap[subId].hasSelectedPaper = true;
      }

      subjectMap[subId].submissions.push({
        submissionId: sub._id,
        facultyId: sub.facultyId?._id,
        facultyName: sub.facultyId?.name,
        employeeId: sub.facultyId?.employeeId,
        department: sub.facultyId?.department,
        status: sub.status,
        submittedAt: sub.submittedAt,
        isSelected: sub.isSelected,
        deadline: sub.deadline,
      });
    }

    res.status(200).json({ success: true, data: Object.values(subjectMap) });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ success: false, message: 'Failed to get overview', error: error.message });
  }
};

/**
 * GET /api/v1/qp-submissions/subject/:subjectId
 * All submissions for one subject (for side-by-side review)
 */
exports.getBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { examSeriesId } = req.query;

    const filter = { subjectId };
    if (examSeriesId) filter.examSeriesId = examSeriesId;

    const submissions = await QuestionPaperSubmission.find(filter)
      .populate('facultyId', 'name employeeId department designation')
      .populate('subjectId')
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error in getBySubject:', error);
    res.status(500).json({ success: false, message: 'Failed to get submissions', error: error.message });
  }
};

/**
 * GET /api/v1/qp-submissions/:id
 * Single submission with full question content
 */
exports.getOne = async (req, res) => {
  try {
    const submission = await QuestionPaperSubmission.findById(req.params.id)
      .populate('facultyId', 'name employeeId department designation')
      .populate('subjectId')
      .populate('reviewedBy', 'name username')
      .populate('selectedBy', 'name username');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error in getOne:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission', error: error.message });
  }
};

/**
 * PATCH /api/v1/qp-submissions/:id/review
 * Review: approve (under_review), request_revision, reject
 */
exports.review = async (req, res) => {
  try {
    const { action, reviewNote } = req.body;

    if (!['approve', 'request_revision', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const submission = await QuestionPaperSubmission.findById(req.params.id)
      .populate('facultyUserId')
      .populate('facultyId', 'name email')
      .populate('subjectId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const statusMap = {
      approve: 'under_review',
      request_revision: 'revision_requested',
      reject: 'rejected',
    };

    submission.status = statusMap[action];
    submission.reviewNote = reviewNote || '';
    submission.reviewedBy = req.user.userId;
    submission.reviewedAt = new Date();

    submission.revisionHistory.push({
      action,
      byUserId: req.user.userId,
      byName: req.user.name || 'Exam Cell',
      note: reviewNote || '',
    });

    await submission.save();

    // Notify faculty if revision requested or rejected
    const targetUser = submission.facultyUserId;
    if (targetUser && action === 'request_revision') {
      try {
        await sendNotification({
          recipientId: targetUser._id,
          recipientRole: 'faculty',
          type: 'qp_revision_requested',
          title: `Revision Requested — ${submission.subjectId.subjectName} Question Paper`,
          message: `Exam Cell has reviewed your question paper for ${submission.subjectId.subjectName} and requested revisions. Feedback: ${reviewNote}`,
          email: submission.facultyId?.email,
          recipientName: submission.facultyId?.name,
          data: {
            facultyName: submission.facultyId?.name,
            subjectName: submission.subjectId.subjectName,
            reviewNote: reviewNote || 'No comments provided',
            deadline: fmtDate(submission.deadline),
          },
        });
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr.message);
      }
    }

    res.status(200).json({ success: true, message: `Action "${action}" applied`, data: submission });
  } catch (error) {
    console.error('Error in review:', error);
    res.status(500).json({ success: false, message: 'Failed to review submission', error: error.message });
  }
};

/**
 * POST /api/v1/qp-submissions/select
 * Select ONE final paper, archive all others for same subject+series
 */
exports.selectFinal = async (req, res) => {
  try {
    const { submissionId, examSeriesId, subjectId } = req.body;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'submissionId is required',
      });
    }

    // Find & update selected submission
    const selected = await QuestionPaperSubmission.findById(submissionId)
      .populate('facultyUserId')
      .populate('facultyId', 'name email employeeId')
      .populate('subjectId');

    if (!selected) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    selected.status = 'selected';
    selected.isSelected = true;
    selected.selectedAt = new Date();
    selected.selectedBy = req.user.userId;

    selected.revisionHistory.push({
      action: 'selected',
      byUserId: req.user.userId,
      byName: req.user.name || 'Exam Cell',
      note: 'Selected as final question paper',
    });

    await selected.save();

    // Archive all other submissions for same subject
    const othersFilter = {
      _id: { $ne: selected._id },
    };
    const targetSubjectId = subjectId || selected.subjectId?._id || selected.subjectId;
    if (targetSubjectId) {
      othersFilter.subjectId = targetSubjectId;
    }
    const targetSeriesId = examSeriesId || selected.examSeriesId;
    if (targetSeriesId) {
      othersFilter.examSeriesId = targetSeriesId;
    }
    if (selected.academicYear) {
      othersFilter.academicYear = selected.academicYear;
    }
    if (selected.patternRef?.examType) {
      othersFilter['patternRef.examType'] = selected.patternRef.examType;
    }

    const others = await QuestionPaperSubmission.find(othersFilter)
      .populate('facultyUserId')
      .populate('facultyId', 'name email');

    let archivedCount = 0;

    for (const other of others) {
      other.status = 'archived';
      other.isSelected = false;

      other.revisionHistory.push({
        action: 'archived',
        byUserId: req.user.userId,
        byName: req.user.name || 'Exam Cell',
        note: 'Another submission was selected as final',
      });

      await other.save();
      archivedCount++;

      // Notify archived faculty
      if (other.facultyUserId) {
        try {
          await sendNotification({
            recipientId: other.facultyUserId._id,
            recipientRole: 'faculty',
            type: 'qp_archived',
            title: `Question Paper Update — ${selected.subjectId.subjectName}`,
            message: `Thank you for submitting your question paper for ${selected.subjectId.subjectName}. The Exam Cell has reviewed all submissions and selected a different paper. Your contribution is appreciated.`,
            email: other.facultyId?.email,
            recipientName: other.facultyId?.name,
            data: {
              facultyName: other.facultyId?.name,
              subjectName: selected.subjectId.subjectName,
            },
          });
        } catch (e) { console.error('Notify archived faculty error:', e.message); }
      }
    }

    // Notify selected faculty
    if (selected.facultyUserId) {
      try {
        await sendNotification({
          recipientId: selected.facultyUserId._id,
          recipientRole: 'faculty',
          type: 'qp_selected',
          title: `✓ Your Question Paper Selected — ${selected.subjectId.subjectName}`,
          message: `Congratulations! Your question paper for ${selected.subjectId.subjectName} has been selected as the final paper for the examination.`,
          email: selected.facultyId?.email,
          recipientName: selected.facultyId?.name,
          data: {
            facultyName: selected.facultyId?.name,
            subjectName: selected.subjectId.subjectName,
            examType: examTypeLabel(selected.patternRef?.examType),
            semester: selected.subjectId?.semester,
          },
        });
      } catch (e) { console.error('Notify selected faculty error:', e.message); }
    }

    res.status(200).json({
      success: true,
      message: `${selected.facultyId?.name}'s paper selected as final for ${selected.subjectId.subjectName}`,
      data: { selected: selected._id, archived: archivedCount },
    });
  } catch (error) {
    console.error('Error in selectFinal:', error);
    res.status(500).json({ success: false, message: 'Failed to select final paper', error: error.message });
  }
};

/**
 * POST /api/v1/qp-submissions/send-reminder
 * Send reminder to all pending (assigned/draft) faculty
 */
exports.sendReminder = async (req, res) => {
  try {
    const { examSeriesId, subjectId } = req.body;

    if (!examSeriesId) {
      return res.status(400).json({ success: false, message: 'examSeriesId is required' });
    }

    const query = { examSeriesId, status: { $in: ['assigned', 'draft'] } };
    if (subjectId) query.subjectId = subjectId;

    const pending = await QuestionPaperSubmission.find(query)
      .populate('facultyUserId')
      .populate('facultyId', 'name email')
      .populate('subjectId');

    let remindersSent = 0;

    for (const sub of pending) {
      if (sub.facultyUserId) {
        try {
          await sendNotification({
            recipientId: sub.facultyUserId._id,
            recipientRole: 'faculty',
            type: 'general',
            title: 'Reminder: Question Paper Deadline Approaching',
            message: `This is a reminder to submit your question paper for ${sub.subjectId?.subjectName}. Deadline: ${fmtDate(sub.deadline)}.`,
            email: sub.facultyId?.email,
            recipientName: sub.facultyId?.name,
            data: {
              facultyName: sub.facultyId?.name,
              subjectName: sub.subjectId?.subjectName,
              deadline: fmtDate(sub.deadline),
            },
          });
          remindersSent++;
        } catch (e) { console.error('Reminder notification error:', e.message); }
      }
    }

    res.status(200).json({ success: true, message: `Reminders sent to ${remindersSent} faculty member(s)` });
  } catch (error) {
    console.error('Error in sendReminder:', error);
    res.status(500).json({ success: false, message: 'Failed to send reminders', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// FACULTY CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/qp-submissions/my-assignments
 * Faculty sees all their assigned submissions
 */
exports.getMyAssignments = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ employeeId: req.user.username });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found' });
    }

    const submissions = await QuestionPaperSubmission.find({ facultyId: faculty._id })
      .populate('subjectId')
      .sort({ deadline: 1 });

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error in getMyAssignments:', error);
    res.status(500).json({ success: false, message: 'Failed to get assignments', error: error.message });
  }
};

/**
 * GET /api/v1/qp-submissions/my-assignments/:id
 * Faculty opens one assignment. On first open: assigned → draft
 */
exports.getMyAssignment = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ employeeId: req.user.username });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found' });
    }

    const submission = await QuestionPaperSubmission.findOne({
      _id: req.params.id,
      facultyId: faculty._id,
    }).populate('subjectId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // First open: transition assigned → draft
    if (submission.status === 'assigned' && !submission.firstOpenedAt) {
      submission.status = 'draft';
      submission.firstOpenedAt = new Date();
      await submission.save();
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error in getMyAssignment:', error);
    res.status(500).json({ success: false, message: 'Failed to get assignment', error: error.message });
  }
};

/**
 * PATCH /api/v1/qp-submissions/:id/save-draft
 * Faculty saves draft progress
 */
exports.saveDraft = async (req, res) => {
  try {
    const { submittedQuestions } = req.body;
    const faculty = await Faculty.findOne({ employeeId: req.user.username });

    const submission = await QuestionPaperSubmission.findOne({
      _id: req.params.id,
      facultyId: faculty?._id,
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.isLocked || ['selected', 'archived', 'rejected'].includes(submission.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit this submission because it is locked or final selected' });
    }

    submission.submittedQuestions = submittedQuestions || [];
    if (submission.status === 'assigned') submission.status = 'draft';
    await submission.save();

    res.status(200).json({ success: true, message: 'Draft saved', data: submission });
  } catch (error) {
    console.error('Error in saveDraft:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft', error: error.message });
  }
};

/**
 * PATCH /api/v1/qp-submissions/:id/submit
 * Faculty submits for review
 */
exports.submit = async (req, res) => {
  try {
    const { submittedQuestions } = req.body;
    const faculty = await Faculty.findOne({ employeeId: req.user.username });

    const submission = await QuestionPaperSubmission.findOne({
      _id: req.params.id,
      facultyId: faculty?._id,
    }).populate('subjectId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check deadline
    if (new Date() > new Date(submission.deadline)) {
      return res.status(400).json({ success: false, message: 'Submission deadline has passed. Contact Exam Cell.' });
    }

    // Check status or lock
    if (submission.isLocked || ['selected', 'archived'].includes(submission.status)) {
      return res.status(400).json({ success: false, message: 'Cannot submit this paper because it is locked or final selected' });
    }

    // Validate all questions have content
    const qs = submittedQuestions || [];
    const emptyQNos = qs.filter(q => !q.questionText || !q.questionText.trim()).map(q => q.qNo);

    if (emptyQNos.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill all question fields before submitting`,
        emptyQuestions: emptyQNos,
      });
    }

    submission.submittedQuestions = qs;
    submission.status = 'submitted';
    submission.submittedAt = new Date();

    submission.revisionHistory.push({
      action: 'submitted',
      byUserId: req.user.userId,
      byName: faculty?.name || req.user.username,
      note: 'Submitted for Exam Cell review',
    });

    await submission.save();

    // Notify Exam Cell users
    try {
      const examCellUsers = await User.find({ role: 'examcell' });
      for (const u of examCellUsers) {
        await sendNotification({
          recipientId: u._id,
          recipientRole: 'examcell',
          type: 'qp_submitted',
          title: `New QP Submission — ${submission.subjectId?.subjectName} — by ${faculty?.name}`,
          message: `${faculty?.name} submitted a question paper for ${submission.subjectId?.subjectName}. Submitted at: ${new Date().toLocaleString()}. Please log in to review.`,
          data: {
            facultyName: faculty?.name,
            subjectName: submission.subjectId?.subjectName,
            examType: examTypeLabel(submission.patternRef?.examType),
            semester: submission.subjectId?.semester,
          },
        });
      }
    } catch (e) { console.error('Notify exam cell error:', e.message); }

    res.status(200).json({ success: true, message: 'Question paper submitted successfully', data: submission });
  } catch (error) {
    console.error('Error in submit:', error);
    res.status(500).json({ success: false, message: 'Failed to submit', error: error.message });
  }
};

/**
 * PATCH /api/v1/qp-submissions/:id/revise
 * Faculty resubmits after revision_requested
 */
exports.revise = async (req, res) => {
  try {
    const { submittedQuestions } = req.body;
    const faculty = await Faculty.findOne({ employeeId: req.user.username });

    const submission = await QuestionPaperSubmission.findOne({
      _id: req.params.id,
      facultyId: faculty?._id,
    }).populate('subjectId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.status !== 'revision_requested') {
      return res.status(400).json({ success: false, message: 'This submission is not awaiting revision' });
    }

    submission.submittedQuestions = submittedQuestions || [];
    submission.status = 'submitted';
    submission.submittedAt = new Date();

    submission.revisionHistory.push({
      action: 'revised',
      byUserId: req.user.userId,
      byName: faculty?.name || req.user.username,
      note: 'Revised and resubmitted',
    });

    await submission.save();

    // Notify Exam Cell
    try {
      const examCellUsers = await User.find({ role: 'examcell' });
      for (const u of examCellUsers) {
        await sendNotification({
          recipientId: u._id,
          recipientRole: 'examcell',
          type: 'general',
          title: `QP Revised — ${submission.subjectId?.subjectName} by ${faculty?.name}`,
          message: `${faculty?.name} has revised and resubmitted the question paper for ${submission.subjectId?.subjectName}.`,
        });
      }
    } catch (e) { console.error('Notify exam cell error:', e.message); }

    res.status(200).json({ success: true, message: 'Question paper resubmitted successfully', data: submission });
  } catch (error) {
    console.error('Error in revise:', error);
    res.status(500).json({ success: false, message: 'Failed to revise', error: error.message });
  }
};

/**
 * GET /api/v1/qp-submissions/:id
 * Get single submission by ID
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }
    const submission = await QuestionPaperSubmission.findById(id)
      .populate('subjectId')
      .populate('facultyId', 'name employeeId department email');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error in getOne:', error);
    res.status(500).json({ success: false, message: 'Failed to get submission', error: error.message });
  }
};

// Legacy compatibility exports (kept for any older routes)
exports.assignToFaculty = exports.autoAssign;
exports.getAllSubmissions = exports.getOverview;
exports.getSubmissionById = exports.getOne;
exports.reviewSubmission = exports.review;
exports.getMyAssignmentById = exports.getMyAssignment;
exports.submitForReview = exports.submit;

