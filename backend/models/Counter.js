const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  prefix: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Counter', counterSchema);

