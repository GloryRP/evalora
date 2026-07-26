/**
 * InvigilatorAssignment Model
 * Assigns faculty as invigilators for exams
 */
const mongoose = require('mongoose');

const invigilatorAssignmentSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true,
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  role: {
    type: String,
    enum: ['chief', 'assistant', 'invigilator'],
    default: 'invigilator',
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Ensure faculty is not double-booked
invigilatorAssignmentSchema.index({ examId: 1, facultyId: 1 });

module.exports = mongoose.model('InvigilatorAssignment', invigilatorAssignmentSchema);
