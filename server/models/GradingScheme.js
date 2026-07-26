const mongoose = require('mongoose');

const gradingSchemeSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: true,
    default: 'VTU 2015 Scheme'
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  },
  gradeTable: [
    {
      minPercentage: Number,
      maxPercentage: Number,
      grade: String,
      gradePoint: Number,
      description: String
    }
  ],
  passMarkPercentage: {
    type: Number,
    default: 40
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GradingScheme', gradingSchemeSchema);
