const mongoose = require('mongoose');

/**
 * Department Schema - Department/Branch master data
 * departmentCode : Short unique code (e.g. "CSE", "CSDS", "ECE")
 * departmentName : Canonical full name — the SINGLE SOURCE OF TRUTH
 * aliases        : All known alternate spellings / legacy strings for this
 *                  department, used by resolveDepartment() to normalise
 *                  free-text values that arrive from older data
 * hodId / hodUserId / hodName : HOD references (unchanged)
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
  aliases: [{
    type: String,
    trim: true,
  }],
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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

