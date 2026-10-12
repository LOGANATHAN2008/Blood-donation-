const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  uid:              { type: String, required: true, index: true },
  endpoint:         { type: String, required: true, unique: true },
  keys: {
    p256dh:         { type: String, required: true },
    auth:           { type: String, required: true }
  },
  bloodGroups:      [{ type: String, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-'] }],
  state:            { type: String, default: null },
  district:         { type: String, default: null },
  lat:              { type: Number, default: null },
  lng:              { type: Number, default: null },
  urgencyFilter:    { type: String, enum: ['Critical', 'UrgentCritical', 'All'], default: 'All' },
  quietHours: {
    enabled:        { type: Boolean, default: false },
    start:          { type: String, default: '22:00' },
    end:            { type: String, default: '07:00' }
  },
  lastPushedAt:     { type: Date, default: null },
  pushCountThisHour:{ type: Number, default: 0 },
  hourResetAt:      { type: Date, default: Date.now },
  userAgent:        { type: String, default: null }
}, { timestamps: true });

pushSubscriptionSchema.index({ district: 1, state: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
