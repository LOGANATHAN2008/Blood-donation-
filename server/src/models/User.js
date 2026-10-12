const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid:         { type: String, required: true, unique: true, index: true },
  email:       { type: String, default: null },
  emailVerified: { type: Boolean, default: false },
  name:        { type: String, required: true, maxlength: 40 },
  phone:       { type: String, default: null },
  verifiedPhone: { type: String, default: null },
  providers:   [{ type: String, default: ['phone'] }],
  onboardingComplete: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  profileCompletedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  photoUrl:    { type: String, default: null },
  photoId:     { type: String, default: null },
  state:       { type: String, default: null },
  district:    { type: String, default: null },
  city:        { type: String, default: null },
  dob:         { type: Date, default: null },
  gender:      { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say', null], default: null },
  
  // App preferences
  language:    { type: String, default: 'en' },
  theme:       { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  textSize:    { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  
  // Notification settings
  urgencyFilter: { type: String, enum: ['Critical', 'UrgentCritical', 'All'], default: 'All' },
  campReminders: { type: Boolean, default: true },
  medicineAlerts: { type: Boolean, default: true },
  pushOptIn:     { type: Boolean, default: false },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start:   { type: String, default: '22:00' }, // HH:mm
    end:     { type: String, default: '07:00' }
  },

  // Privacy & Security
  blockedUsers:  [{ type: String }], // array of UIDs
  pausedAccount: { type: Boolean, default: false },
  leaderboardOptIn: { type: Boolean, default: false }, // Default OFF per privacy requirements
  
  // Gamification & Donor Profile
  totalDonations: { type: Number, default: 0 },
  badges: [{ id: String, name: String, earnedAt: { type: Date, default: Date.now }, level: String, icon: String }],
  badgeLevel: { type: String, default: 'Bronze' },
  donorCardQrToken: { type: String, default: null, index: true },
  donorCardQrEnabled: { type: Boolean, default: true },

  // Referral System
  referralCode: { type: String, default: null, index: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  
  role:        { type: String, enum: ['user', 'moderator', 'admin', 'superadmin'], default: 'user' },
  blocked:     { type: Boolean, default: false }, // Admin blocked
  suspendedUntil: { type: Date, default: null },
  suspendReason:  { type: String, default: null },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
