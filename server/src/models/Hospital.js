const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  uid:      { type: String, required: true }, // submitter or 'system'
  name:     { type: String, required: true, maxlength: 120 },
  type:     { type: String, enum: ['Government Hospital','Private Hospital','Blood Bank','Trauma Center','Medical College'], required: true },
  state:    { type: String, required: true, default: 'Tamil Nadu', index: true },
  district: { type: String, required: true, index: true },
  address:  { type: String, required: true, maxlength: 300 },
  phone:    { type: String, required: true },
  lat:      { type: Number, default: null },
  lng:      { type: Number, default: null },
  location: {
    type: { type: String, enum: ['Point'], required: false },
    coordinates: { type: [Number], required: false } // [lng, lat]
  },
  is24x7:   { type: Boolean, default: false },
  status:   { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending', index: true },
  hidden:   { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 }, // For general abuse
  
  // Pipeline fields
  source: { type: String, default: 'user' },
  sourceId: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  importedAt: { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
  wrongInfoReports: { type: Number, default: 0 }, // specifically for data inaccuracies
}, { timestamps: true });

// Indexes for search and geo queries
hospitalSchema.index({ district: 1, type: 1 });
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
