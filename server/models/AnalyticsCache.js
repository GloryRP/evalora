const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['department', 'institution', 'slow_learners'],
    required: true
  },
  semester: Number,
  academicYear: String,
  department: String, // null for institution-wide
  data: Object, // Full analytics output cached here
  computedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: Date // Set to computedAt + 24 hours
}, {
  timestamps: true
});

analyticsCacheSchema.index({ type: 1, semester: 1, academicYear: 1, department: 1 });

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
