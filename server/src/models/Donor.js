const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  uid:              { type: String, required: true, unique: true, index: true },
  name:             { type: String, required: true, maxlength: 40 },
  email:            { type: String, required: true }, // verified from email OTP
  phone:            { type: String, default: null },
  bloodGroup:       { type: String, required: true, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-'], index: true },
  state:            { type: String, required: true, index: true },
  district:         { type: String, required: true, index: true },
  city:             { type: String, required: true },
  age:              { type: Number, required: true, min: 18, max: 65 },
  lastDonationDate: { type: Date, default: null },
  available:        { type: Boolean, default: true, index: true },
  
  // Settings
  contactVisibility: { type: String, enum: ['everyone', 'approve', 'hidden'], default: 'everyone' },
  preferredDistance: { type: String, enum: ['5', '10', '25', 'state'], default: '25' },
  nightWeekendAvail: { type: Boolean, default: false },

  consent:          { type: Boolean, required: true },
  verified:         { type: Boolean, default: true }, // email verified
  hidden:           { type: Boolean, default: false }, // admin hidden after reports
  reportCount:      { type: Number, default: 0 },

  // Digital Donor Card & Public Verification
  donorId:          { type: String, default: null }, // e.g. BD-8A3F12
  qrToken:          { type: String, default: null, index: true },
  qrEnabled:        { type: Boolean, default: true },
  totalDonations:   { type: Number, default: 0 },
}, { timestamps: true });

donorSchema.index({ bloodGroup: 1, district: 1 });
donorSchema.index({ bloodGroup: 1, available: 1 });

module.exports = mongoose.model('Donor', donorSchema);
