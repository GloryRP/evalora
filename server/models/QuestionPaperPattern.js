/**
 * QuestionPaperPattern Model
 * Stores question breakdowns and marks templates grouped by Semester and Exam Type
 */
const mongoose = require('mongoose');

const questionPatternSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
  },
  examType: {
    type: String,
    enum: ['internal1', 'internal2', 'external', 'makeup'],
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 50,
  },
  questions: [{
    questionNumber: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    maxMarks: {
      type: Number,
      required: true,
    }
  }]
}, {
  timestamps: true,
});

// Unique pattern per semester and exam type
questionPatternSchema.index({ semester: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('QuestionPaperPattern', questionPatternSchema);
