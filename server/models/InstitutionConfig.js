/**
 * Institution Configuration Model
 * Stores college/university branding and timetable settings
 * Makes the system multi-tenant and institution-agnostic
 */
const mongoose = require('mongoose');

const institutionConfigSchema = new mongoose.Schema({
  // Institution Details
  institutionName: {
    type: String,
    required: true,
    default: 'Your Institution Name',
  },
  abbreviation: {
    type: String,
    default: 'YIN',
  },
  logo: {
    type: String, // URL to logo image
    default: null,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  phone: String,
  email: String,
  website: String,

  // Academic Details
  currentAcademicYear: {
    type: String,
    default: '2025-26',
  },
  currentSemester: {
    type: Number,
    default: 5,
    min: 1,
    max: 8,
  },
  academicYears: [{
    year: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    semesters: [{
      semesterNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 8,
      },
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: false,
      },
    }],
  }],
  // Legacy fields for backward compatibility
  academicYear: {
    type: String,
    default: '2025-26',
  },
  semesterStart: Date,
  semesterEnd: Date,

  // Timetable Configuration
  timetable: {
    // Header styling
    headerStyle: {
      bgColor: { type: String, default: '#1E3A5F' }, // Navy
      textColor: { type: String, default: '#FFFFFF' },
      fontSize: { type: String, default: '18px' },
    },
    // Table styling
    tableStyle: {
      borderColor: { type: String, default: '#000000' },
      headerBgColor: { type: String, default: '#f0f0f0' },
      rowBgColor: { type: String, default: '#ffffff' },
      alternateRowBgColor: { type: String, default: '#f9f9f9' },
      fontSize: { type: String, default: '11px' },
    },
    // Columns to display
    columns: {
      date: { type: Boolean, default: true },
      time: { type: Boolean, default: true },
      branch: { type: Boolean, default: true },
      subjectCode: { type: Boolean, default: true },
      subjectName: { type: Boolean, default: true },
      room: { type: Boolean, default: false },
      semester: { type: Boolean, default: false },
    },
    // Footer
    footerText: {
      type: String,
      default: 'This is an official document. Unauthorized reproduction is prohibited.',
    },
    signatureLabel: {
      type: String,
      default: 'Examination Controller',
    },
    signatureDesignation: {
      type: String,
      default: 'Exam Cell In-charge',
    },
  },

  // Branding Colors
  branding: {
    primaryColor: { type: String, default: '#1E3A5F' }, // Navy
    secondaryColor: { type: String, default: '#C9A227' }, // Gold
    backgroundColor: { type: String, default: '#FAFAF8' },
  },

  // Document Settings
  documentDefaults: {
    format: { type: String, enum: ['A4', 'Letter'], default: 'A4' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    marginTop: { type: String, default: '20mm' },
    marginBottom: { type: String, default: '20mm' },
    marginLeft: { type: String, default: '15mm' },
    marginRight: { type: String, default: '15mm' },
  },

  // Settings
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('InstitutionConfig', institutionConfigSchema);
