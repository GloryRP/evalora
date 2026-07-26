/**
 * HallAllocation Model
 * Maps students to exam halls with seat assignments
 */
const mongoose = require('mongoose');

const hallAllocationSchema = new mongoose.Schema({
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
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
  },
  benchNumber: {
    type: Number,
  },
  seatPosition: {
    type: String,
    enum: ['left', 'right'],
  },
}, {
  timestamps: true,
});

// Ensure unique seat assignment per exam-hall combination
hallAllocationSchema.index({ examId: 1, hallId: 1, seatNumber: 1 }, { unique: true });
// Ensure student is not double-booked
hallAllocationSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('HallAllocation', hallAllocationSchema);
