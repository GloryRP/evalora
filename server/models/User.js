const mongoose = require('mongoose');

/**
 * User Schema - Core authentication model for all user types
 * username: Either USN (for students) or Employee ID (for staff)
 * role: One of 6 roles - admin, examcell, faculty, student, hod, principal
 * isActive: Allows admin to disable accounts without deletion
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    uppercase: true, // Store all usernames in uppercase for consistency
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'examcell', 'faculty', 'student', 'hod', 'principal'],
      message: '{VALUE} is not a valid role'
    },
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
  email: {
    type: String,
    sparse: true, // Allows multiple null values
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFirstLogin: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Index for faster queries on username and role
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
