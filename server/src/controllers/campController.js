const Camp = require('../models/Camp');
const socketService = require('../services/socket');
const { z } = require('zod');

const campSchema = z.object({
  title: z.string().min(3).max(120),
  organizer: z.string().min(2).max(120),
  date: z.string(),
  startTime: z.string().optional().default('09:00 AM'),
  endTime: z.string().optional().default('05:00 PM'),
  venue: z.string().min(3).max(250),
  state: z.string().min(2),
  district: z.string().min(2),
  city: z.string().optional().default(''),
  posterUrl: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  coordinates: z.object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional()
  }).optional()
});

async function listCamps(req, res, next) {
  try {
    const { state, district, thisWeek, startDate, endDate, lat, lng, page = 1, limit = 20 } = req.query;
    const lim = Math.min(50, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * lim;

    // Auto-hide past camps: only camps from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = {
      status: 'Approved',
      hidden: false,
      date: { $gte: today }
    };

    if (thisWeek === 'true') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      filter.date = { $gte: today, $lte: endOfWeek };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      else filter.date.$gte = today;
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    if (state && state.trim()) {
      filter.state = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }
    if (district && district.trim()) {
      filter.district = { $regex: new RegExp(`^${district.trim()}$`, 'i') };
    }

    const total = await Camp.countDocuments(filter);
    const camps = await Camp.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(lim)
      .lean();

    // Attach user interested status if token provided
    const userUid = req.user?.uid;
    const data = camps.map(camp => {
      let isInterested = false;
      if (userUid && Array.isArray(camp.interestedUids)) {
        isInterested = camp.interestedUids.includes(userUid);
      }
      // calculate distance if user lat/lng given and camp coordinates exist
      let distance = null;
      if (lat && lng && camp.coordinates?.lat && camp.coordinates?.lng) {
        const R = 6371;
        const dLat = (camp.coordinates.lat - parseFloat(lat)) * Math.PI / 180;
        const dLng = (camp.coordinates.lng - parseFloat(lng)) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 +
          Math.cos(parseFloat(lat)*Math.PI/180) * Math.cos(camp.coordinates.lat*Math.PI/180) *
          Math.sin(dLng/2)**2;
        distance = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
      }
      return {
        ...camp,
        isInterested,
        distance,
        interestedUids: undefined // hide other users' UIDs for privacy
      };
    });

    res.json({ data, total, page: Number(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
}

async function createCamp(req, res, next) {
  try {
    const parsed = campSchema.parse(req.body);
    const campData = {
      ...parsed,
      uid: req.user.uid,
      date: new Date(parsed.date),
      status: 'Pending'
    };
    if (parsed.coordinates?.lat && parsed.coordinates?.lng) {
      campData.location = {
        type: 'Point',
        coordinates: [parsed.coordinates.lng, parsed.coordinates.lat]
      };
    }
    const camp = await Camp.create(campData);
    res.status(201).json(camp);
  } catch (err) { next(err); }
}

async function toggleInterest(req, res, next) {
  try {
    const camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Camp not found.' });

    const uid = req.user.uid;
    const alreadyInterested = camp.interestedUids.includes(uid);

    if (alreadyInterested) {
      camp.interestedUids = camp.interestedUids.filter(u => u !== uid);
      camp.interestedCount = Math.max(0, (camp.interestedCount || 1) - 1);
    } else {
      camp.interestedUids.push(uid);
      camp.interestedCount = (camp.interestedCount || 0) + 1;
    }

    await camp.save();
    res.json({ isInterested: !alreadyInterested, count: camp.interestedCount });
  } catch (err) { next(err); }
}

async function reportCamp(req, res, next) {
  try {
    const camp = await Camp.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true }
    );
    if (!camp) return res.status(404).json({ error: 'Camp not found.' });
    if (camp.reportCount >= 5) {
      camp.hidden = true;
      await camp.save();
    }
    res.json({ message: 'Thank you for reporting. Our moderators will review.' });
  } catch (err) { next(err); }
}

async function approveCamp(req, res, next) {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const camp = await Camp.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!camp) return res.status(404).json({ error: 'Camp not found.' });

    if (status === 'Approved') {
      socketService.broadcast('camp:approved', {
        id: camp._id,
        title: camp.title,
        venue: camp.venue,
        district: camp.district,
        date: camp.date
      });
    }

    res.json(camp);
  } catch (err) { next(err); }
}

async function pendingCamps(req, res, next) {
  try {
    const camps = await Camp.find({ status: 'Pending' }).sort({ date: 1 });
    res.json(camps);
  } catch (err) { next(err); }
}

module.exports = {
  listCamps,
  createCamp,
  toggleInterest,
  reportCamp,
  approveCamp,
  pendingCamps
};
