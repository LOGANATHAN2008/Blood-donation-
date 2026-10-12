const Medicine = require('../models/Medicine');
const { deleteAsset } = require('../services/cloudinary');
const socketService   = require('../services/socket');

const SIX_MONTHS_MS  = 6  * 30 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS_MS  = 60 * 24 * 60 * 60 * 1000;

function expiryLabel(expiryDate) {
  const diff = new Date(expiryDate) - Date.now();
  if (diff <= 0)            return 'expired';
  if (diff <= SIXTY_DAYS_MS) return 'expiring-soon'; // rejected on create
  if (diff <= SIX_MONTHS_MS) return 'expiring-6mo';
  return 'ok';
}

async function listMedicines(req, res, next) {
  try {
    const { search, state, district, page = 1, limit = 20 } = req.query;
    const filter = { status: 'Available', hidden: false, expiryDate: { $gt: new Date() } };
    
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { strength: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } },
        { pickupNotes: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (state) {
      filter.state = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }
    if (district) {
      const cleanDistrict = district.trim();
      const baseDistrict = cleanDistrict.replace(/\s+(Urban|Rural|District)$/i, '').trim();
      const escapedClean = cleanDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase = baseDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.district = { $regex: new RegExp(`^(${escapedClean}|${escapedBase})`, 'i') };
    }

    const lim  = Math.min(50, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * lim;

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Medicine.countDocuments(filter),
    ]);

    const enriched = medicines.map(m => {
      const o = m.toObject();
      o.expiryLabel = expiryLabel(o.expiryDate);
      return o;
    });

    res.json({ data: enriched, total, page: Number(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
}

async function getMedicine(req, res, next) {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m || m.hidden) return res.status(404).json({ error: 'Not found.' });
    const o = m.toObject();
    o.expiryLabel = expiryLabel(o.expiryDate);
    res.json(o);
  } catch (err) { next(err); }
}

async function createMedicine(req, res, next) {
  try {
    const expiryDate = new Date(req.body.expiryDate);
    // Reject if expired or expiring within 60 days
    if (expiryDate - Date.now() <= SIXTY_DAYS_MS) {
      return res.status(400).json({ error: 'Medicine expiring within 60 days cannot be listed.' });
    }

    const medicine = await Medicine.create({ ...req.body, uid: req.user.uid });
    socketService.broadcast('medicine:created', { id: medicine._id, district: medicine.district });
    socketService.emitStats().catch(() => {});
    res.status(201).json(medicine);
  } catch (err) { next(err); }
}

async function updateMedicine(req, res, next) {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found.' });
    if (m.uid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
    Object.assign(m, req.body);
    await m.save();
    socketService.broadcast('medicine:updated', { id: m._id, status: m.status });
    res.json(m);
  } catch (err) { next(err); }
}

async function deleteMedicine(req, res, next) {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found.' });
    if (m.uid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
    await deleteAsset(m.imagePublicId);
    await m.deleteOne();
    socketService.broadcast('medicine:removed', { id: req.params.id });
    socketService.emitStats().catch(() => {});
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

async function getMyMedicines(req, res, next) {
  try {
    const medicines = await Medicine.find({ uid: req.user.uid }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) { next(err); }
}

/**
 * POST /api/medicines/:id/reserve
 * Atomic reserve: Available -> Reserved. Only one user can reserve.
 */
async function reserveMedicine(req, res, next) {
  try {
    const m = await Medicine.findOneAndUpdate(
      { _id: req.params.id, status: 'Available' },
      { status: 'Reserved', reservedByUid: req.user.uid },
      { new: true }
    );
    if (!m) return res.status(409).json({ error: 'Medicine is no longer available.' });
    socketService.broadcast('medicine:updated', { id: m._id, status: 'Reserved' });
    res.json(m);
  } catch (err) { next(err); }
}

/**
 * POST /api/medicines/:id/give
 * Owner marks as Given after handover.
 */
async function markGiven(req, res, next) {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found.' });
    if (m.uid !== req.user.uid) return res.status(403).json({ error: 'Forbidden.' });
    m.status = 'Given';
    await m.save();
    socketService.broadcast('medicine:removed', { id: m._id });
    socketService.emitStats().catch(() => {});
    res.json(m);
  } catch (err) { next(err); }
}

module.exports = { listMedicines, getMedicine, createMedicine, updateMedicine, deleteMedicine, getMyMedicines, reserveMedicine, markGiven };
