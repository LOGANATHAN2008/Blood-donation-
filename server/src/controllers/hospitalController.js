const Hospital = require('../models/Hospital');
const socketService = require('../services/socket');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function listHospitals(req, res, next) {
  try {
    const { state, district, type, is24x7, search, page = 1, limit = 20, lat, lng } = req.query;
    const lim  = Math.min(50, Number(limit));
    const skip = (Math.max(1, Number(page)) - 1) * lim;

    let filter = { status: 'Approved', hidden: false };
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
    if (type)     filter.type     = type;
    if (is24x7)   filter.is24x7   = is24x7 === 'true';
    if (search)   filter.$text    = { $search: search };

    let hospitals = [];
    let total = 0;

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      try {
        const geoNearStage = {
          $geoNear: {
            near: { type: 'Point', coordinates: [userLng, userLat] },
            distanceField: 'distance',
            maxDistance: 100000, // 100 km
            spherical: true,
            query: filter
          }
        };
        
        const pipeline = [geoNearStage];
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Hospital.aggregate(countPipeline);
        total = countResult.length > 0 ? countResult[0].total : 0;
        
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: lim });
        
        const rawHospitals = await Hospital.aggregate(pipeline);
        hospitals = rawHospitals.map(h => ({
          ...h,
          distance: h.distance != null ? parseFloat((h.distance / 1000).toFixed(1)) : null
        }));
      } catch (geoErr) {
        // Fallback to manual haversine calculation
        const allMatching = await Hospital.find(filter).lean();
        const withDist = allMatching.map(h => {
          let dist = null;
          const hLat = h.lat || (h.location?.coordinates ? h.location.coordinates[1] : null);
          const hLng = h.lng || (h.location?.coordinates ? h.location.coordinates[0] : null);
          if (hLat && hLng) {
            dist = parseFloat(haversine(userLat, userLng, hLat, hLng).toFixed(1));
          }
          return { ...h, distance: dist };
        });

        withDist.sort((a, b) => {
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });

        total = withDist.length;
        hospitals = withDist.slice(skip, skip + lim);
      }
    } else {
      total = await Hospital.countDocuments(filter);
      const query = Hospital.find(filter);
      
      if (search) {
        query.sort({ score: { $meta: 'textScore' } });
      } else {
        query.sort({ createdAt: -1 });
      }
      
      hospitals = await query.skip(skip).limit(lim).lean();
    }

    res.json({ data: hospitals, total, page: Number(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
}

async function submitHospital(req, res, next) {
  try {
    const hospital = await Hospital.create({ ...req.body, uid: req.user.uid, status: 'Pending' });
    res.status(201).json(hospital);
  } catch (err) { next(err); }
}

async function getMyHospitals(req, res, next) {
  try {
    const hospitals = await Hospital.find({ uid: req.user.uid }).sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) { next(err); }
}

async function deleteHospital(req, res, next) {
  try {
    const h = await Hospital.findById(req.params.id);
    if (!h) return res.status(404).json({ error: 'Not found.' });
    if (h.uid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
    await h.deleteOne();
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

// Admin: approve / reject
async function approveHospital(req, res, next) {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected'
    if (!['Approved','Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const h = await Hospital.findByIdAndUpdate(req.params.id, { 
      status, 
      verified: status === 'Approved', 
      lastVerifiedAt: status === 'Approved' ? new Date() : null 
    }, { new: true });
    if (!h) return res.status(404).json({ error: 'Not found.' });
    if (status === 'Approved') {
      socketService.broadcast('hospital:approved', { id: h._id, name: h.name, district: h.district });
    }
    res.json(h);
  } catch (err) { next(err); }
}

// Admin: pending list
async function pendingHospitals(req, res, next) {
  try {
    const hospitals = await Hospital.find({ status: 'Pending' }).sort({ createdAt: 1 });
    res.json(hospitals);
  } catch (err) { next(err); }
}

async function reportWrongInfo(req, res, next) {
  try {
    const h = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $inc: { wrongInfoReports: 1 } },
      { new: true }
    );
    if (!h) return res.status(404).json({ error: 'Hospital not found.' });
    res.json({ message: 'Thank you for reporting. Our moderators will verify the hospital details.' });
  } catch (err) { next(err); }
}

module.exports = { listHospitals, submitHospital, getMyHospitals, deleteHospital, approveHospital, pendingHospitals, reportWrongInfo };
