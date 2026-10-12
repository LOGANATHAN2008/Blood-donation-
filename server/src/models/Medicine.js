const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  uid:              { type: String, required: true, index: true },
  name:             { type: String, required: true, maxlength: 120 },
  strength:         { type: String, maxlength: 50, default: '' },
  quantity:         { type: String, required: true, maxlength: 50 },
  expiryDate:       { type: Date, required: true, index: true },
  state:            { type: String, required: true, index: true },
  district:         { type: String, required: true, index: true },
  city:             { type: String, required: true },
  contactPhone:     { type: String, required: true },
  pickupNotes:      { type: String, maxlength: 300, default: '' },
  imageUrl:         { type: String, default: null },
  imagePublicId:    { type: String, default: null },
  status:           { type: String, enum: ['Available','Reserved','Given','Expired','Removed'], default: 'Available', index: true },
  reservedByUid:    { type: String, default: null },
  hidden:           { type: Boolean, default: false },
  reportCount:      { type: Number, default: 0 },
  // Safety confirmations stored
  checkedSealed:       { type: Boolean, required: true },
  checkedNotExpired:   { type: Boolean, required: true },
  checkedNotControlled:{ type: Boolean, required: true },
  checkedNotInjection: { type: Boolean, required: true },
}, { timestamps: true });

medicineSchema.index({ status: 1, district: 1 });
medicineSchema.index({ expiryDate: 1, status: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
