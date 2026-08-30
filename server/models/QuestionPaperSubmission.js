/**
 * QuestionPaperSubmission Model
 * Tracks the automated workflow: Exam Cell auto-assigns → Faculty submits →
 * Exam Cell reviews ALL submissions per subject → selects ONE final paper →
 * Others are archived with notifications.
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const submittedQuestionSchema = new Schema({
  qNo: { type: String },
  questionText: { type: String, default: '' },
  marks: { type: Number },
  isOrQuestion: { type: Boolean, default: false },
  orGroupId: { type: String },
  unit: { type: String, default: '' },
  bloomsLevel: {
    type: String,
    enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    default: 'Understand',
  },
  co: { type: String, default: '' }, // Course Outcome mapping
}, { _id: true });

const patternQuestionSchema = new Schema({
  qNo: { type: String },
  maxMarks: { type: Number },
  isOrQuestion: { type: Boolean, default: false },
  orGroupId: { type: String },
}, { _id: false });

const revisionHistorySchema = new Schema({
  action: { type: String },
  byUserId: { type: Schema.Types.ObjectId },
  byName: { type: String },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

// ─── Main Schema ──────────────────────────────────────────────────────────────

const questionPaperSubmissionSchema = new Schema({
  // Which exam series this is for (optional reference)
  examSeriesId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: false,
  },
  academicYear: {
    type: String,
    default: '2025-26',
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },

  // Faculty who is submitting
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  facultyUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  // Template structure (copied from QPTemplate pattern at assignment time)
  patternRef: {
    examType: { type: String },
    totalMarks: { type: Number },
    questions: [patternQuestionSchema],
  },

  // Deadline set by Exam Cell
  deadline: { type: Date, required: true },

  // Actual question content filled by faculty
  submittedQuestions: [submittedQuestionSchema],

  // Status workflow
  status: {
    type: String,
    enum: [
      'assigned',          // Auto-assigned, faculty not opened yet
      'draft',             // Faculty opened and saving
      'submitted',         // Faculty submitted for review
      'under_review',      // Exam Cell opened it
      'revision_requested', // Sent back with feedback
      'selected',          // THIS submission chosen as final
      'archived',          // Not selected (another was chosen)
      'rejected',          // Completely rejected
    ],
    default: 'assigned',
  },

  // Is this the FINAL selected paper?
  isSelected: { type: Boolean, default: false },

  // Review details
  reviewNote: { type: String },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },

  // Selection details
  selectedAt: { type: Date },
  selectedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Revision history
  revisionHistory: [revisionHistorySchema],

  // Timestamps
  assignedAt: { type: Date, default: Date.now },
  firstOpenedAt: { type: Date },
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for fast lookup
questionPaperSubmissionSchema.index({ subjectId: 1, status: 1 });
questionPaperSubmissionSchema.index({ facultyId: 1, status: 1 });
questionPaperSubmissionSchema.index({ academicYear: 1, subjectId: 1 });
// Unique: one faculty per subject per examType per academicYear
questionPaperSubmissionSchema.index(
  { subjectId: 1, facultyId: 1, academicYear: 1, 'patternRef.examType': 1 },
  { unique: true }
);

// ─── Pre-save ─────────────────────────────────────────────────────────────────
questionPaperSubmissionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('QuestionPaperSubmission', questionPaperSubmissionSchema);
