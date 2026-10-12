const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorUid: { type: String, required: true, index: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  snapshotBefore: { type: mongoose.Schema.Types.Mixed },
  snapshotAfter: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

// Create a compound index for fast filtering
auditLogSchema.index({ createdAt: -1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
