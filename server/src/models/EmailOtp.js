const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  hash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  resends: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL 10 minutes (600s)
});

// Index for quickly finding the active OTP for an email
emailOtpSchema.index({ email: 1 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
