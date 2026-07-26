/**
 * QuestionPaper Model
 * Stores question breakdowns and marks allocation metadata for digital valuations
 * Supports slot-based OR structures.
 */
const mongoose = require('mongoose');

const slotOrSchema = new mongoose.Schema({
  questionNumber: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    default: '',
    trim: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0,
  }
});

const slotSchema = new mongoose.Schema({
  questionNumber: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    default: '',
    trim: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0,
  },
  or: {
    type: slotOrSchema,
    default: null
  }
});

// Backward compat
const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    default: '',
    trim: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0,
  }
});

const questionPaperSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    unique: true, // One question paper per scheduled exam
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved'],
    default: 'draft',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null,
  },
  fileName: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  slots: [slotSchema],
  questions: [questionSchema] // Backward compat
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
