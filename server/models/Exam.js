/**
 * Exam Model
 * Represents scheduled exams with status workflow
 */
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  examType: {
    type: String,
    enum: ['internal1', 'internal2', 'external', 'makeup'],
    default: 'internal1',
  },
  componentType: {
    type: String,
    enum: ['theory', 'lab'],
    default: 'theory',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'completed', 'cancelled'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
examSchema.index({ examDate: 1, startTime: 1 });
examSchema.index({ semester: 1, status: 1 });

module.exports = mongoose.model('Exam', examSchema);
