const mongoose = require('mongoose');

/**
 * Department Schema - Department/Branch master data
 * departmentCode: Short code for the department (e.g., "CSE", "ECE")
 * hodId: Reference to the User who is the Head of Department
 */
const departmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
  },
  departmentCode: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // HOD can be assigned later
  },
  hodUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  hodName: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
departmentSchema.index({ departmentCode: 1 });

module.exports = mongoose.model('Department', departmentSchema);
