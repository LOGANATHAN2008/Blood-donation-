const BloodRequest = require('../models/BloodRequest');
const socketService = require('../services/socket');
const { matchDonors } = require('../services/matchService');
const { notifyMatchingSubscribers } = require('../services/pushService');

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

    const request = await BloodRequest.create({ ...req.body, uid });

    // Auto-match in background (don't await to keep response fast)
    matchDonors(request).catch(err => console.error('matchDonors error:', err));
    notifyMatchingSubscribers(request).catch(err => console.error('notifyMatchingSubscribers error:', err));

    socketService.broadcast('request:created', { id: request._id, bloodGroup: request.bloodGroup, district: request.district });
    socketService.emitStats().catch(() => {});
    res.status(201).json(request);
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
    socketService.broadcast('request:updated', { id: request._id, status });
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
    socketService.broadcast('request:updated', { id: request._id, status: 'Deleted' });
    socketService.emitStats().catch(() => {});
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listRequests, createRequest, updateStatus, myRequests, deleteRequest };
