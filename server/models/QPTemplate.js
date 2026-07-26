/**
 * QPTemplate Model
 * Stores the GLOBAL default question paper template per exam type.
 * Each "slot" is one question position that may have an OR alternative.
 * Exceptional subjects (MCQ, 1-credit, lab-only) are stored as overrides.
 */
const mongoose = require('mongoose');

// A single question slot (main question or OR alternative)
const slotOrSchema = new mongoose.Schema({
  questionNumber: { type: String, required: true, trim: true },
  maxMarks: { type: Number, required: true, min: 0 },
});

const slotSchema = new mongoose.Schema({
  questionNumber: { type: String, required: true, trim: true },
  maxMarks: { type: Number, required: true, min: 0 },
  or: { type: slotOrSchema, default: null },  // optional OR alternative
});

// Backward-compat question row (from old schema)
const questionRowSchema = new mongoose.Schema({
  questionNumber: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  maxMarks: { type: Number, required: true, min: 0 },
});

const exceptionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  reason: { type: String, default: '' },
  maxMarks: { type: Number, required: true },
  slots: [slotSchema],          // new slot-based structure
  questions: [questionRowSchema], // kept for backward compat
});

const qpTemplateSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ['internal1', 'internal2', 'external', 'makeup'],
    required: true,
    unique: true,
  },
  maxMarks: { type: Number, required: true, default: 50 },
  slots: [slotSchema],          // new slot-based structure
  questions: [questionRowSchema], // kept for backward compat
  exceptions: [exceptionSchema],
}, { timestamps: true });

module.exports = mongoose.model('QPTemplate', qpTemplateSchema);
