const mongoose = require('mongoose');

/**
 * Student Schema - Extended profile for student users
 * usn: Linked to User.username for authentication
 * semester: Current semester the student is enrolled in
 */
const studentSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: [true, 'USN is required'],
    unique: true,
    trim: true,
    uppercase: true,
    ref: 'User', // References User.username (not _id)
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
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
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
  },
}, {
  timestamps: true,
});

// Index for faster queries
studentSchema.index({ usn: 1 });
studentSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Student', studentSchema);
