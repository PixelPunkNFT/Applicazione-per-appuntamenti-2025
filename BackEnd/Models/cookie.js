const mongoose = require('mongoose');

const cookieSchema = mongoose.Schema({
  technical: {
    type: Boolean,
    required: true,
    default: true
  },
  analytics: {
    type: Boolean,
    required: true
  },
  marketing: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  userIp: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Cookie', cookieSchema);
