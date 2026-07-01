const mongoose = require('mongoose');

/**
 * Subject Schema - Course/Subject master data
 * subjectCode: Unique identifier for the subject (e.g., "CS101")
 * semester: Which semester this subject is taught in
 * credits: Academic credits for the subject
 */
const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8'],
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6'],
  },
}, {
  timestamps: true,
});

// Index for faster queries
subjectSchema.index({ subjectCode: 1 });
subjectSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
