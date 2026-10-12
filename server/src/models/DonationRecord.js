const mongoose = require('mongoose');

const donationRecordSchema = new mongoose.Schema({
  uid:                { type: String, required: true, index: true },
  donorId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', default: null },
  donorName:          { type: String, required: true },
  bloodGroup:         { type: String, required: true },
  date:               { type: Date, required: true, index: true },
  hospital:           { type: String, default: null },
  campId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Camp', default: null },
  campTitle:          { type: String, default: null },
  units:              { type: Number, default: 1, min: 1, max: 5 },
  notes:              { type: String, maxlength: 300, default: null },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending', 
    index: true 
  },
  verifiedBy:         { type: String, default: null },
  verifiedAt:         { type: Date, default: null },
  rejectionReason:    { type: String, default: null },
  certificateId:      { type: String, unique: true, sparse: true, index: true },
}, { timestamps: true });

donationRecordSchema.index({ uid: 1, date: -1 });
donationRecordSchema.index({ verificationStatus: 1, date: -1 });

module.exports = mongoose.model('DonationRecord', donationRecordSchema);
