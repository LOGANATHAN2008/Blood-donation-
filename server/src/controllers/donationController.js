const DonationRecord = require('../models/DonationRecord');
const Donor = require('../models/Donor');
const User = require('../models/User');
const { computeUserBadges } = require('../services/badgeService');
const { generateDonationCertificate } = require('../services/certificateService');
const { z } = require('zod');

const donationSchema = z.object({
  date: z.string(),
  bloodGroup: z.string().optional(),
  hospital: z.string().max(150).nullable().optional(),
  campId: z.string().nullable().optional(),
  campTitle: z.string().max(150).nullable().optional(),
  units: z.number().min(1).max(5).default(1),
  notes: z.string().max(300).nullable().optional()
});

async function getMyDonations(req, res, next) {
  try {
    const records = await DonationRecord.find({ uid: req.user.uid }).sort({ date: -1 });
    res.json(records);
  } catch (err) { next(err); }
}

async function addDonation(req, res, next) {
  try {
    const parsed = donationSchema.parse(req.body);
    const donor = await Donor.findOne({ uid: req.user.uid });
    const user = await User.findOne({ uid: req.user.uid });

    const bloodGroup = parsed.bloodGroup || donor?.bloodGroup || 'O+';
    const donorName = donor?.name || user?.name || 'Anonymous Donor';

    const record = await DonationRecord.create({
      uid: req.user.uid,
      donorId: donor ? donor._id : null,
      donorName,
      bloodGroup,
      date: new Date(parsed.date),
      hospital: parsed.hospital || null,
      campId: parsed.campId || null,
      campTitle: parsed.campTitle || null,
      units: parsed.units || 1,
      notes: parsed.notes || null,
      verificationStatus: 'pending'
    });

    res.status(201).json(record);
  } catch (err) { next(err); }
}

async function updateDonation(req, res, next) {
  try {
    const record = await DonationRecord.findOne({ _id: req.params.id, uid: req.user.uid });
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    if (record.verificationStatus === 'verified') {
      return res.status(400).json({ error: 'Verified donation records cannot be modified.' });
    }

    const parsed = donationSchema.partial().parse(req.body);
    if (parsed.date) record.date = new Date(parsed.date);
    if (parsed.hospital !== undefined) record.hospital = parsed.hospital;
    if (parsed.campTitle !== undefined) record.campTitle = parsed.campTitle;
    if (parsed.units) record.units = parsed.units;
    if (parsed.notes !== undefined) record.notes = parsed.notes;

    await record.save();
    res.json(record);
  } catch (err) { next(err); }
}

async function deleteDonation(req, res, next) {
  try {
    const record = await DonationRecord.findOne({ _id: req.params.id, uid: req.user.uid });
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    if (record.verificationStatus === 'verified') {
      return res.status(400).json({ error: 'Verified records cannot be deleted. Contact support.' });
    }
    await record.deleteOne();
    res.json({ message: 'Donation record deleted.' });
  } catch (err) { next(err); }
}

// Admin / Moderator verification queue
async function getPendingDonations(req, res, next) {
  try {
    const records = await DonationRecord.find({ verificationStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(records);
  } catch (err) { next(err); }
}

async function verifyDonation(req, res, next) {
  try {
    const { status, rejectionReason } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status.' });
    }

    const record = await DonationRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found.' });

    record.verificationStatus = status;
    record.verifiedBy = req.user.uid;
    record.verifiedAt = new Date();
    if (status === 'rejected') {
      record.rejectionReason = rejectionReason || 'Information could not be verified.';
    } else {
      record.rejectionReason = null;
      if (!record.certificateId) {
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        const timePart = Date.now().toString(36).toUpperCase();
        record.certificateId = `CERT-LC-${timePart}-${rand}`;
      }
    }

    await record.save();

    // Recompute badges and stats for the donor idempotently
    const badgeResult = await computeUserBadges(record.uid);

    res.json({ record, badgeResult });
  } catch (err) { next(err); }
}

// Download PDF Certificate
async function downloadCertificate(req, res, next) {
  try {
    const record = await DonationRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Donation record not found.' });
    if (record.verificationStatus !== 'verified') {
      return res.status(400).json({ error: 'Certificate is only available for verified donations.' });
    }

    // Ownership or admin check
    if (record.uid !== req.user.uid && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const user = await User.findOne({ uid: record.uid });
    const isMilestone = (user?.totalDonations || 1) >= 5;

    const pdfBytes = await generateDonationCertificate({
      donorName: record.donorName || user?.name || 'Valued Donor',
      date: record.date,
      bloodGroup: record.bloodGroup,
      units: record.units,
      donationCount: user?.totalDonations || 1,
      certificateId: record.certificateId,
      isMilestone
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate_${record.certificateId}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) { next(err); }
}

// Public verification for certificate QR code
async function verifyCertificatePublic(req, res, next) {
  try {
    const { id } = req.params;
    const record = await DonationRecord.findOne({ certificateId: id, verificationStatus: 'verified' });
    if (!record) {
      return res.status(404).json({ valid: false, error: 'Certificate not found or unverified.' });
    }

    // Strictly privacy safe: first name only, blood group, date, units, count
    const firstName = record.donorName ? record.donorName.trim().split(' ')[0] : 'Donor';
    const user = await User.findOne({ uid: record.uid });

    res.json({
      valid: true,
      certificateId: record.certificateId,
      firstName,
      bloodGroup: record.bloodGroup,
      date: record.date,
      units: record.units,
      donationCount: user?.totalDonations || 1,
      verifiedAt: record.verifiedAt
    });
  } catch (err) { next(err); }
}

module.exports = {
  getMyDonations,
  addDonation,
  updateDonation,
  deleteDonation,
  getPendingDonations,
  verifyDonation,
  downloadCertificate,
  verifyCertificatePublic
};
