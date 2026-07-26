/**
 * Hall Model
 * Represents exam halls with capacity and facilities
 */
const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  hallName: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  building: {
    type: String,
    trim: true,
  },
  floor: {
    type: String,
    trim: true,
  },
  facilities: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Hall', hallSchema);
