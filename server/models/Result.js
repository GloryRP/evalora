const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
  examId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exam' 
  },
  subjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject' 
  },
  subjectCode: String,
  subjectName: String,
  credits: Number,
  maxMarks: Number,
  marksObtained: Number,
  percentage: Number,
  grade: String, // O, A+, A, B+, B, C, P, F
  gradePoint: Number, // 10, 9, 8, 7, 6, 5, 4, 0
  gradePointsEarned: Number, // gradePoint * credits
  isPassed: Boolean,
  result: { 
    type: String, 
    enum: ['PASS', 'FAIL'] 
  }
});

const resultSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  usn: { type: String, required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  department: { type: String, required: true },

  subjectResults: [subjectResultSchema],

  // Computed fields
  totalCredits: Number,
  totalGradePoints: Number,
  sgpa: Number,
  cgpa: Number,
  overallResult: { 
    type: String, 
    enum: ['PASS', 'FAIL', 'WITHHELD'] 
  },

  // Publishing
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  publishedAt: { type: Date },
  publishedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  // Metadata
  computedAt: { type: Date },
  computedBy: { 
    type: String, 
    default: 'GPA_AGENT' 
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound unique index
resultSchema.index({ studentId: 1, semester: 1, academicYear: 1 }, { unique: true });
resultSchema.index({ usn: 1 });
resultSchema.index({ department: 1, semester: 1, academicYear: 1 });
resultSchema.index({ department: 1, overallResult: 1 });
resultSchema.index({ sgpa: -1 });

module.exports = mongoose.model('Result', resultSchema);
