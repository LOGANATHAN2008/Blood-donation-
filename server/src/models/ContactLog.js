const mongoose = require('mongoose');

const contactLogSchema = new mongoose.Schema({
  requesterUid: { type: String, required: true, index: true },
  donorUid:     { type: String, required: true },
  donorId:      { type: mongoose.Schema.Types.ObjectId, required: true },
  ipAddress:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ContactLog', contactLogSchema);
