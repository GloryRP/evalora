/**
 * AnswerScript Model
 * Stores student answer script details, evaluator assignment, marks, and status
 */
const mongoose = require('mongoose');

const answerScriptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null,
  },
  status: {
    type: String,
    enum: ['uploaded', 'assigned', 'evaluated', 'published'],
    default: 'uploaded',
  },
  filePath: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    default: '',
  },
  marksObtained: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  questionMarks: [{
    questionNumber: { type: String, required: true },
    marksObtained: { type: Number, required: true }
  }],
  comments: {
    type: String,
    default: '',
  },
  evaluatedAt: {
    type: Date,
    default: null,
  },
  publishedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

// Ensure a student has only one answer script per exam
answerScriptSchema.index({ studentId: 1, examId: 1 }, { unique: true });
answerScriptSchema.index({ subjectId: 1 });
answerScriptSchema.index({ evaluatorId: 1, status: 1 });
answerScriptSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('AnswerScript', answerScriptSchema);
