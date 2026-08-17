const mongoose = require('mongoose');

/**
 * Faculty Schema - Extended profile for faculty/staff users
 * employeeId: Linked to User.username for authentication
 * subjectsAssigned: Array of Subject IDs this faculty teaches
 * designation: Job title (Professor, Assistant Professor, etc.)
 */
const facultySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
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
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    enum: {
      values: ['Head of Department', 'HOD', 'Head of Department (HOD)', 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant', 'Other'],
      message: '{VALUE} is not a valid designation'
    },
  },
  subjectsAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
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
facultySchema.index({ employeeId: 1 });
facultySchema.index({ department: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
