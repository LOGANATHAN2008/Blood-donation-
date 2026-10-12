const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  uid:          { type: String, required: true, index: true }, // requester
  patientName:  { type: String, required: true, maxlength: 80 },
  bloodGroup:   { type: String, required: true, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-'], index: true },
  units:        { type: Number, required: true, min: 1, max: 10 },
  hospital:     { type: String, required: true, maxlength: 120 },
  state:        { type: String, required: true, index: true },
  district:     { type: String, required: true, index: true },
  city:         { type: String, required: true },
  urgency:      { type: String, enum: ['Normal','Urgent','Critical'], default: 'Normal', index: true },
  isEmergency:  { type: Boolean, default: false, index: true },
  emergencyTimeWindow: { type: String, enum: ['2_hours', '12_hours', 'tomorrow', null], default: null },
  neededBy:     { type: Date, required: true, index: true },
  contactName:  { type: String },
  contactPhone: { type: String, required: true },
  note:         { type: String, maxlength: 500 },
  status:       { type: String, enum: ['Active','Fulfilled','Cancelled','Expired'], default: 'Active', index: true },
  hidden:       { type: Boolean, default: false },
  reportCount:  { type: Number, default: 0 },
}, { timestamps: true });

bloodRequestSchema.index({ status: 1, neededBy: 1 });
bloodRequestSchema.index({ bloodGroup: 1, district: 1, status: 1 });
// TTL index: Mongoose doesn't auto-expire on arbitrary field via TTL easily; we use a cron instead.
// But we add a sparse index for fast expiry queries.
bloodRequestSchema.index({ neededBy: 1, status: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
