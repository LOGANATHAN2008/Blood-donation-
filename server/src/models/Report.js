const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterUid: { type: String, required: true },
  targetType:  { type: String, enum: ['BloodRequest','Medicine','Hospital','Donor'], required: true },
  targetId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reason:      { type: String, required: true, maxlength: 300 },
  reviewed:    { type: Boolean, default: false },
}, { timestamps: true });

// Unique per reporter+target so one user can't report the same post twice
reportSchema.index({ reporterUid: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
