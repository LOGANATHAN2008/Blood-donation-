const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BloodRequest = require('../models/BloodRequest');
const socketService = require('../services/socket');
const { matchDonors } = require('../services/matchService');
const { notifyMatchingSubscribers } = require('../services/pushService');

let districtsMap = null;
try {
  districtsMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/indiaDistricts.json'), 'utf8'));
} catch (e) {
  districtsMap = {};
}

function resolveLocation(city, state, district) {
  let resolvedState = (state || '').trim();
  let resolvedDistrict = (district || '').trim();
  const cleanCity = (city || '').trim();

  if (!resolvedDistrict && cleanCity && districtsMap) {
    for (const [st, dists] of Object.entries(districtsMap)) {
      const match = dists.find(d => d.toLowerCase() === cleanCity.toLowerCase());
      if (match) {
        resolvedDistrict = match;
        if (!resolvedState) resolvedState = st;
        break;
      }
    }
  }

  if (!resolvedDistrict) resolvedDistrict = cleanCity || 'Chennai';
  if (!resolvedState) resolvedState = 'Tamil Nadu';

  return { state: resolvedState, district: resolvedDistrict, city: cleanCity || resolvedDistrict };
}

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * GET /api/requests
 * Public: list active requests sorted by urgency then time.
 */
async function listRequests(req, res, next) {
  try {
    const { search, state, bloodGroup, district, urgency, page = 1, limit = 20 } = req.query;
    const filter = {
      status: 'Active',
      hidden: false,
      neededBy: { $gte: new Date() },
    };
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { patientName: { $regex: escaped, $options: 'i' } },
        { hospital: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } },
        { note: { $regex: escaped, $options: 'i' } },
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
    if (urgency)    filter.urgency     = urgency;

    const urgencyOrder = { Critical: 0, Urgent: 1, Normal: 2 };
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
    const lim  = Math.min(50, Number(limit));

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .sort({ urgency: 1, createdAt: -1 }) // urgency enum sorts alphabetically; we rely on JS sort
        .skip(skip).limit(lim),
      BloodRequest.countDocuments(filter),
    ]);

    // Sort by urgency weight
    const sorted = requests.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    res.json({ data: sorted, total, page: Number(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
}

/**
 * POST /api/requests
 * Auth required.
 */
async function createRequest(req, res, next) {
  try {
    const { uid } = req.user;

    // Block duplicate active requests
    const existing = await BloodRequest.findOne({
      uid,
      patientName: req.body.patientName,
      hospital:    req.body.hospital,
      bloodGroup:  req.body.bloodGroup,
      status:      'Active',
    });
    if (existing) {
      return res.status(409).json({ error: 'A similar active request already exists.' });
    }

    const shortCode = generateShortCode();
    const request = await BloodRequest.create({ ...req.body, uid, shortCode });

    // Auto-match in background (don't await to keep response fast)
    matchDonors(request).catch(err => console.error('matchDonors error:', err));
    notifyMatchingSubscribers(request).catch(err => console.error('notifyMatchingSubscribers error:', err));

    socketService.broadcast('request:created', { id: request._id, shortCode: request.shortCode, bloodGroup: request.bloodGroup, district: request.district });
    socketService.emitStats().catch(() => {});
    res.status(201).json(request);
  } catch (err) { next(err); }
}

/**
 * POST /api/requests/emergency
 * Public (with rate limiting): Rapid emergency creation without mandatory login.
 */
async function createEmergencyRequest(req, res, next) {
  try {
    const {
      patientName,
      bloodGroup,
      component = 'whole_blood',
      units = 1,
      hospitalName,
      hospital,
      hospitalArea = '',
      city,
      state,
      district,
      urgency = 'critical',
      neededBy,
      contactName = '',
      contactPhone,
      note = '',
      showPhoneOnImage = false,
      lang = 'en',
    } = req.body;

    if (!patientName || !bloodGroup || !contactPhone || !city) {
      return res.status(400).json({ error: 'patientName, bloodGroup, city, and contactPhone are required.' });
    }

    const cleanPhone = String(contactPhone).replace(/\D/g, '').replace(/^91/, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const loc = resolveLocation(city, state, district);
    const shortCode = generateShortCode();
    const editToken = generateToken();

    const urgencyMap = {
      critical: 'Critical',
      today: 'Urgent',
      within_3_days: 'Normal',
      Critical: 'Critical',
      Urgent: 'Urgent',
      Normal: 'Normal',
    };
    const mappedUrgency = urgencyMap[urgency] || 'Critical';

    let neededByDate;
    if (neededBy) {
      neededByDate = new Date(neededBy);
    } else {
      neededByDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const newRequest = await BloodRequest.create({
      uid: req.user?.uid || `guest_${shortCode.toLowerCase()}`,
      shortCode,
      patientName: patientName.trim(),
      bloodGroup,
      component,
      units: Math.min(10, Math.max(1, Number(units) || 1)),
      hospital: (hospitalName || hospital || 'City Hospital').trim(),
      hospitalArea: (hospitalArea || '').trim(),
      city: loc.city,
      district: loc.district,
      state: loc.state,
      urgency: mappedUrgency,
      isEmergency: true,
      neededBy: neededByDate,
      contactName: (contactName || '').trim(),
      contactPhone: cleanPhone,
      note: (note || '').trim(),
      showPhoneOnImage: !!showPhoneOnImage,
      lang: lang || 'en',
      status: 'Active',
      editToken,
    });

    // Auto-match in background
    matchDonors(newRequest).catch(err => console.error('matchDonors error:', err));
    notifyMatchingSubscribers(newRequest).catch(err => console.error('notifyMatchingSubscribers error:', err));

    socketService.broadcast('request:created', {
      id: newRequest._id,
      shortCode: newRequest.shortCode,
      bloodGroup: newRequest.bloodGroup,
      district: newRequest.district,
      hospital: newRequest.hospital,
      urgency: newRequest.urgency,
      isEmergency: true,
    });
    socketService.emitStats().catch(() => {});

    res.status(201).json({
      id: newRequest.shortCode,
      _id: newRequest._id,
      shortCode: newRequest.shortCode,
      editToken,
      bloodGroup: newRequest.bloodGroup,
      component: newRequest.component,
      units: newRequest.units,
      patientName: newRequest.patientName,
      hospitalName: newRequest.hospital,
      hospitalArea: newRequest.hospitalArea,
      city: newRequest.city,
      district: newRequest.district,
      state: newRequest.state,
      neededBy: newRequest.neededBy.toISOString(),
      urgency: urgency,
      contactName: newRequest.contactName,
      contactPhone: newRequest.contactPhone,
      note: newRequest.note,
      showPhoneOnImage: newRequest.showPhoneOnImage,
      lang: newRequest.lang,
      status: 'open',
      createdAt: newRequest.createdAt.toISOString(),
      expiresAt: new Date(newRequest.neededBy.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      shareCount: 0,
      viewCount: 0,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/requests/:id
 * Public: Get single blood request by MongoDB ID or short code.
 */
async function getRequestByIdOrCode(req, res, next) {
  try {
    const { id } = req.params;
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { shortCode: id.toUpperCase() }] };
    } else {
      query = { shortCode: id.toUpperCase() };
    }

    const request = await BloodRequest.findOneAndUpdate(
      query,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Blood request not found.' });
    }

    const urgencyMapReverse = {
      Critical: 'critical',
      Urgent: 'today',
      Normal: 'within_3_days',
    };

    const statusMapReverse = {
      Active: 'open',
      Fulfilled: 'fulfilled',
      Cancelled: 'expired',
      Expired: 'expired',
    };

    res.json({
      id: request.shortCode || request._id.toString(),
      _id: request._id,
      shortCode: request.shortCode,
      bloodGroup: request.bloodGroup,
      component: request.component || 'whole_blood',
      units: request.units,
      patientName: request.patientName,
      hospitalName: request.hospital,
      hospital: request.hospital,
      hospitalArea: request.hospitalArea || '',
      city: request.city,
      district: request.district,
      state: request.state,
      neededBy: request.neededBy?.toISOString(),
      urgency: urgencyMapReverse[request.urgency] || 'critical',
      rawUrgency: request.urgency,
      contactName: request.contactName,
      contactPhone: request.contactPhone,
      note: request.note,
      showPhoneOnImage: !!request.showPhoneOnImage,
      lang: request.lang || 'en',
      status: statusMapReverse[request.status] || 'open',
      rawStatus: request.status,
      createdAt: request.createdAt?.toISOString(),
      expiresAt: new Date(new Date(request.neededBy).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      shareCount: request.shareCount || 0,
      viewCount: request.viewCount || 0,
    });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/requests/:id/emergency-status
 * Update emergency status using editToken or authenticated UID/admin.
 */
async function updateEmergencyStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, editToken } = req.body;
    const token = editToken || req.headers['x-edit-token'];

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { shortCode: id.toUpperCase() }] };
    } else {
      query = { shortCode: id.toUpperCase() };
    }

    const request = await BloodRequest.findOne(query).select('+editToken');
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    const isOwnerByToken = token && request.editToken && token === request.editToken;
    const isOwnerByUid = req.user && (req.user.uid === request.uid || req.user.role === 'admin');

    if (!isOwnerByToken && !isOwnerByUid) {
      return res.status(403).json({ error: 'Invalid or missing edit token.' });
    }

    const normalizedStatus = (status === 'fulfilled' || status === 'Fulfilled') ? 'Fulfilled' : 'Cancelled';
    request.status = normalizedStatus;
    await request.save();

    socketService.broadcast('request:updated', { id: request._id, shortCode: request.shortCode, status: normalizedStatus });
    socketService.emitStats().catch(() => {});

    res.json({
      success: true,
      id: request.shortCode || request._id,
      status: normalizedStatus === 'Fulfilled' ? 'fulfilled' : 'expired',
      rawStatus: normalizedStatus,
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/requests/:id/share
 * Increment share counter for an emergency request.
 */
async function recordShare(req, res, next) {
  try {
    const { id } = req.params;
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { shortCode: id.toUpperCase() }] };
    } else {
      query = { shortCode: id.toUpperCase() };
    }

    const request = await BloodRequest.findOneAndUpdate(query, { $inc: { shareCount: 1 } }, { new: true });
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    res.json({ success: true, shareCount: request.shareCount });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/requests/:id/status
 * Auth required: requester can mark Fulfilled or Cancelled.
 */
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.uid !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    request.status = status;
    await request.save();
    socketService.broadcast('request:updated', { id: request._id, shortCode: request.shortCode, status });
    socketService.emitStats().catch(() => {});
    res.json(request);
  } catch (err) { next(err); }
}

/**
 * GET /api/requests/mine
 * Auth required.
 */
async function myRequests(req, res, next) {
  try {
    const requests = await BloodRequest.find({ uid: req.user.uid }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { next(err); }
}

/**
 * DELETE /api/requests/:id
 * Auth required: own or admin.
 */
async function deleteRequest(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found.' });
    if (request.uid !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    await request.deleteOne();
    socketService.broadcast('request:updated', { id: request._id, shortCode: request.shortCode, status: 'Deleted' });
    socketService.emitStats().catch(() => {});
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

module.exports = {
  listRequests,
  createRequest,
  createEmergencyRequest,
  getRequestByIdOrCode,
  updateEmergencyStatus,
  recordShare,
  updateStatus,
  myRequests,
  deleteRequest,
};
