/**
 * AgentRun Model
 * Tracks AI agent execution history with input/output data
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const agentRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  agentType: {
    type: String,
    required: true,
    enum: ['scheduling', 'hall_allocation', 'invigilator', 'orchestrator', 'evaluation'],
  },
  status: {
    type: String,
    required: true,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
  },
  outputData: {
    type: mongoose.Schema.Types.Mixed,
  },
  errorMessage: {
    type: String,
  },
  executionTimeMs: {
    type: Number,
  },
  triggeredBy: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
agentRunSchema.index({ createdAt: -1 });
agentRunSchema.index({ agentType: 1, status: 1 });

module.exports = mongoose.model('AgentRun', agentRunSchema);
