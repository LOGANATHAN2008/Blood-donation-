const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  uid:             { type: String, required: true }, // organizer user id
  title:           { type: String, required: true, maxlength: 120 },
  organizer:       { type: String, required: true, maxlength: 120 },
  date:            { type: Date, required: true, index: true },
  startTime:       { type: String, default: '09:00 AM' },
  endTime:         { type: String, default: '05:00 PM' },
  venue:           { type: String, required: true, maxlength: 250 },
  state:           { type: String, required: true, index: true },
  district:        { type: String, required: true, index: true },
  city:            { type: String, default: '' },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  location: {
    type: { type: String, enum: ['Point'], required: false },
    coordinates: { type: [Number], required: false } // [lng, lat]
  },
  posterUrl:       { type: String, default: null },
  contactPhone:   { type: String, default: null },
  interestedCount: { type: Number, default: 0 },
  interestedUids:  [{ type: String }],
  status:          { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  hidden:          { type: Boolean, default: false },
  reportCount:     { type: Number, default: 0 }
}, { timestamps: true });

campSchema.index({ state: 1, district: 1, date: 1 });
campSchema.index({ status: 1, date: 1 });
campSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Camp', campSchema);
