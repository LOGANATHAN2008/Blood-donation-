const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'global_config'
  maintenanceMode: { type: Boolean, default: false },
  signupsOpen: { type: Boolean, default: true },
  maxContactRevealsPerDay: { type: Number, default: 10 },
  requestAutoExpireHours: { type: Number, default: 48 },
  medicineMinExpiryDays: { type: Number, default: 14 },
  reportAutoHideThreshold: { type: Number, default: 5 },
  // Editable static pages content (JSON stringified map of lang -> content, or structured)
  contentAbout: { type: mongoose.Schema.Types.Mixed, default: {} },
  contentSafety: { type: mongoose.Schema.Types.Mixed, default: {} },
  contentFAQ: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
