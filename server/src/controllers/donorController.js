const Donor      = require('../models/Donor');
const ContactLog = require('../models/ContactLog');
const socketService = require('../services/socket');
const { isDonorEligible, nextEligibleDate } = require('../utils/bloodCompat');

/**
 * GET /api/donors
 * Public: lists donors with masked email, paginated.
 * Filters: bloodGroup, district, available
 */
async function listDonors(req, res, next) {
  try {
    const { search, state, bloodGroup, district, available, page = 1, limit = 20 } = req.query;
    const filter = { hidden: false };
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } },
        { district: { $regex: escaped, $options: 'i' } }
      ];
    }
    if (state) {
      filter.state = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (district) {
      const cleanDistrict = district.trim();
      const baseDistrict = cleanDistrict.replace(/\s+(Urban|Rural|District)$/i, '').trim();
      const escapedClean = cleanDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase = baseDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.district = { $regex: new RegExp(`^(${escapedClean}|${escapedBase})`, 'i') };
    }
    if (available !== undefined) filter.available = available === 'true';

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
    const lim  = Math.min(50, Number(limit));

    const isLoggedIn = !!req.user;

    const [donors, total] = await Promise.all([
      Donor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).select('-email'),
      Donor.countDocuments(filter),
    ]);

    // Annotate eligibility, lock status, phone & location on each donor
    const enriched = donors.map(d => {
      const obj = d.toObject();
      const eligible = isDonorEligible(obj.lastDonationDate);
      obj.eligible = eligible;
      if (!eligible) obj.eligibleFrom = nextEligibleDate(obj.lastDonationDate);

      obj.isLocked = !isLoggedIn;

      if (!isLoggedIn) {
        // Redact phone number and exact location for guests
        obj.phone = obj.phone ? (obj.phone.slice(0, 2) + '••••••' + obj.phone.slice(-2)) : '••••••••••';
        obj.exactCity = obj.city;
        obj.city = '🔒 Locked';
        obj.email = '***@***.com';
      }

      return obj;
    });

    res.json({ data: enriched, total, page: Number(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
}

/**
 * GET /api/donors/:id
 * Public: get single donor, phone & location locked unless authenticated.
 */
async function getDonor(req, res, next) {
  try {
    const isLoggedIn = !!req.user;
    const donor = await Donor.findById(req.params.id).select('-email');
    if (!donor || donor.hidden) return res.status(404).json({ error: 'Donor not found.' });
    const obj = donor.toObject();
    obj.eligible = isDonorEligible(obj.lastDonationDate);
    if (!obj.eligible) obj.eligibleFrom = nextEligibleDate(obj.lastDonationDate);
    
    obj.isLocked = !isLoggedIn;
    if (!isLoggedIn) {
      obj.phone = obj.phone ? (obj.phone.slice(0, 2) + '••••••' + obj.phone.slice(-2)) : '••••••••••';
      obj.exactCity = obj.city;
      obj.city = '🔒 Locked';
      obj.email = '***@***.com';
    }

    res.json(obj);
  } catch (err) { next(err); }
}

/**
 * GET /api/donors/:id/contact
 * Auth required: reveals full email & phone and logs the contact.
 */
async function getContact(req, res, next) {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor || donor.hidden) return res.status(404).json({ error: 'Donor not found.' });

    // Log contact
    await ContactLog.findOneAndUpdate(
      { requesterUid: req.user.uid, donorId: donor._id },
      { requesterUid: req.user.uid, donorUid: donor.uid, donorId: donor._id, ipAddress: req.ip },
      { upsert: true }
    );

    res.json({ email: donor.email, phone: donor.phone, name: donor.name });
  } catch (err) { next(err); }
}

/**
 * POST /api/donors
 * Auth required: create or update own donor profile.
 */
async function upsertDonor(req, res, next) {
  try {
    const { uid, email } = req.user;
    const phone = req.body.phone || req.user.dbUser?.phone || req.user.dbUser?.verifiedPhone || null;
    const data = { ...req.body, uid, email, phone, verified: true };

    const donor = await Donor.findOneAndUpdate(
      { uid },
      data,
      { upsert: true, new: true, runValidators: true }
    );

    socketService.broadcast('donor:created', { id: donor._id, bloodGroup: donor.bloodGroup, district: donor.district });
    socketService.emitStats().catch(() => {});
    res.status(201).json(donor);
  } catch (err) { next(err); }
}

/**
 * PATCH /api/donors/me
 * Auth required: update own donor profile.
 */
async function updateDonor(req, res, next) {
  try {
    const donor = await Donor.findOneAndUpdate(
      { uid: req.user.uid },
      req.body,
      { new: true, runValidators: true }
    );
    if (!donor) return res.status(404).json({ error: 'Donor profile not found. Create one first.' });
    socketService.broadcast('donor:updated', { id: donor._id, available: donor.available });
    socketService.emitStats().catch(() => {});
    res.json(donor);
  } catch (err) { next(err); }
}

/**
 * DELETE /api/donors/me
 * Auth required: soft-delete own donor profile.
 */
async function deleteDonor(req, res, next) {
  try {
    await Donor.findOneAndDelete({ uid: req.user.uid });
    socketService.emitStats().catch(() => {});
    res.json({ message: 'Donor profile deleted.' });
  } catch (err) { next(err); }
}

/**
 * GET /api/donors/me
 * Auth required: get own donor profile (with unmasked email).
 */
async function getMyDonor(req, res, next) {
  try {
    const donor = await Donor.findOne({ uid: req.user.uid });
    if (!donor) return res.status(404).json({ error: 'No donor profile found.' });
    const obj = donor.toObject();
    obj.eligible = isDonorEligible(obj.lastDonationDate);
    if (!obj.eligible) obj.eligibleFrom = nextEligibleDate(obj.lastDonationDate);
    res.json(obj);
  } catch (err) { next(err); }
}

const crypto = require('crypto');

/**
 * GET /api/donors/card
 * Auth required: get donor card data including donorId and qrToken
 */
async function getMyDonorCard(req, res, next) {
  try {
    let donor = await Donor.findOne({ uid: req.user.uid });
    if (!donor) return res.status(404).json({ error: 'No donor profile found.' });

    let updated = false;
    if (!donor.donorId) {
      donor.donorId = 'BD-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      updated = true;
    }
    if (!donor.qrToken) {
      donor.qrToken = crypto.randomBytes(16).toString('hex');
      updated = true;
    }
    if (updated) {
      await donor.save();
    }

    const obj = donor.toObject();
    obj.eligible = isDonorEligible(obj.lastDonationDate);
    obj.nextEligibleDate = nextEligibleDate(obj.lastDonationDate);

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    obj.verifyUrl = `${clientUrl}/verify/${donor.qrToken}`;

    res.json(obj);
  } catch (err) { next(err); }
}

/**
 * GET /api/donors/verify/:token
 * Public: verifies donor token, strictly returning only safe non-PII details.
 */
async function verifyDonorByToken(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ valid: false, error: 'Token required.' });

    const donor = await Donor.findOne({ qrToken: token, hidden: false });
    if (!donor || donor.qrEnabled === false) {
      return res.status(404).json({ valid: false, error: 'Donor verification link is invalid or disabled.' });
    }

    const firstName = (donor.name || 'Donor').trim().split(/\s+/)[0];
    res.json({
      valid: true,
      firstName,
      bloodGroup: donor.bloodGroup,
      verified: true,
      totalDonations: donor.totalDonations || 0,
      memberSince: donor.createdAt
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/donors/card/regenerate-token
 * Auth required: regenerates public QR verification token
 */
async function regenerateQrToken(req, res, next) {
  try {
    const newToken = crypto.randomBytes(16).toString('hex');
    const donor = await Donor.findOneAndUpdate(
      { uid: req.user.uid },
      { qrToken: newToken, qrEnabled: true },
      { new: true }
    );
    if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    res.json({
      qrToken: newToken,
      qrEnabled: donor.qrEnabled,
      verifyUrl: `${clientUrl}/verify/${newToken}`
    });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/donors/card/toggle-qr
 * Auth required: enables or disables QR code verification
 */
async function toggleQrStatus(req, res, next) {
  try {
    const { enabled } = req.body;
    const donor = await Donor.findOneAndUpdate(
      { uid: req.user.uid },
      { qrEnabled: !!enabled },
      { new: true }
    );
    if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });
    res.json({ qrEnabled: donor.qrEnabled });
  } catch (err) { next(err); }
}

module.exports = {
  listDonors,
  getDonor,
  getContact,
  upsertDonor,
  updateDonor,
  deleteDonor,
  getMyDonor,
  getMyDonorCard,
  verifyDonorByToken,
  regenerateQrToken,
  toggleQrStatus
};

