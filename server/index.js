const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const examcellRoutes = require('./routes/examcell');
const institutionRoutes = require('./routes/institution');
const timetableRoutes = require('./routes/timetable');
const notificationsRoutes = require('./routes/notifications');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const hodRoutes = require('./routes/hod');
const resultsRoutes = require('./routes/results');
const principalRoutes = require('./routes/principal');
const qpSubmissionRoutes = require('./routes/qpSubmission');
const fileProxyRoutes = require('./routes/fileProxy');

const app = express();

// F7: Allowlist-based CORS — reads CLIENT_URL from env (default http://localhost:5173)
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://evalora-tan.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server calls (no Origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || DEFAULT_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Unknown origin: respond without the ACAO header (browser blocks it)
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Exam system backend is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
// File proxy MUST be registered before /examcell (which applies global verifyToken)
// so that ?token= query-param auth works for iframes
app.use('/api/v1/file-proxy', fileProxyRoutes);
app.use('/api/v1/examcell', examcellRoutes);
app.use('/api/v1/institution', institutionRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/hod', hodRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/principal', principalRoutes);
app.use('/api/v1/qp-submissions', qpSubmissionRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));