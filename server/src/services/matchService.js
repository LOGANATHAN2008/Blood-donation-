const Donor        = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const { getCompatibleDonors, isDonorEligible } = require('../utils/bloodCompat');
const socketService = require('./socket');

/**
 * Tamil Nadu district adjacency map for "nearby districts" matching.
 * Each district maps to its geographical neighbours.
 */
const NEARBY = {
  'Chennai':         ['Tiruvallur','Chengalpattu','Kanchipuram'],
  'Tiruvallur':      ['Chennai','Ranipet','Vellore','Kanchipuram'],
  'Chengalpattu':    ['Chennai','Kanchipuram','Villupuram','Ranipet'],
  'Kanchipuram':     ['Chennai','Tiruvallur','Chengalpattu','Ranipet'],
  'Ranipet':         ['Vellore','Kanchipuram','Tiruvannamalai','Tiruvallur'],
  'Vellore':         ['Ranipet','Tiruvannamalai','Krishnagiri','Tirupathur'],
  'Tiruvannamalai':  ['Villupuram','Vellore','Salem','Ranipet'],
  'Villupuram':      ['Cuddalore','Tiruvannamalai','Kallakurichi','Chengalpattu'],
  'Cuddalore':       ['Villupuram','Mayiladuthurai','Ariyalur'],
  'Mayiladuthurai':  ['Nagapattinam','Thanjavur','Tiruvarur','Cuddalore'],
  'Nagapattinam':    ['Tiruvarur','Mayiladuthurai'],
  'Tiruvarur':       ['Thanjavur','Mayiladuthurai','Nagapattinam','Pudukkottai'],
  'Thanjavur':       ['Tiruvarur','Pudukkottai','Tiruchirappalli','Mayiladuthurai'],
  'Tiruchirappalli': ['Thanjavur','Pudukkottai','Perambalur','Karur','Dindigul'],
  'Perambalur':      ['Tiruchirappalli','Ariyalur','Salem','Namakkal'],
  'Ariyalur':        ['Perambalur','Cuddalore','Thanjavur'],
  'Karur':           ['Tiruchirappalli','Dindigul','Namakkal','Erode'],
  'Dindigul':        ['Madurai','Theni','Karur','Tiruchirappalli','Sivaganga'],
  'Madurai':         ['Dindigul','Theni','Sivaganga','Virudhunagar','Ramanathapuram'],
  'Theni':           ['Madurai','Dindigul','Nilgiris'],
  'Virudhunagar':    ['Madurai','Ramanathapuram','Tenkasi','Thoothukudi'],
  'Thoothukudi':     ['Virudhunagar','Tirunelveli','Ramanathapuram'],
  'Tirunelveli':     ['Thoothukudi','Tenkasi','Kanyakumari'],
  'Tenkasi':         ['Tirunelveli','Virudhunagar'],
  'Kanyakumari':     ['Tirunelveli'],
  'Coimbatore':      ['Tiruppur','Erode','Nilgiris','Salem'],
  'Tiruppur':        ['Coimbatore','Erode','Karur'],
  'Erode':           ['Coimbatore','Tiruppur','Salem','Namakkal','Karur'],
  'Salem':           ['Erode','Namakkal','Krishnagiri','Dharmapuri','Tiruvannamalai','Perambalur'],
  'Namakkal':        ['Salem','Erode','Karur','Perambalur','Tiruchirappalli'],
  'Dharmapuri':      ['Krishnagiri','Salem'],
  'Krishnagiri':     ['Dharmapuri','Vellore','Salem','Tirupathur'],
  'Tirupathur':      ['Vellore','Krishnagiri'],
  'Nilgiris':        ['Coimbatore','Theni'],
  'Pudukkottai':     ['Thanjavur','Tiruchirappalli','Sivaganga','Tiruvarur'],
  'Sivaganga':       ['Madurai','Dindigul','Pudukkottai','Ramanathapuram'],
  'Ramanathapuram':  ['Madurai','Virudhunagar','Sivaganga','Thoothukudi'],
  'Kallakurichi':    ['Villupuram','Salem'],
};

/**
 * Auto-match donors for a blood request.
 * Returns same-district matches first, then nearby districts.
 * Emits socket events to online matched donors.
 */
async function matchDonors(bloodRequest) {
  const compatibleGroups = getCompatibleDonors(bloodRequest.bloodGroup);
  if (!compatibleGroups.length) return [];

  const now = new Date();
  const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // Fetch all compatible + available donors in the entire state to let preference filtering handle the rest
  const candidates = await Donor.find({
    bloodGroup: { $in: compatibleGroups },
    available:  true,
    hidden:     false,
    $or: [
      { lastDonationDate: null },
      { lastDonationDate: { $lte: cutoff } },
    ],
  }).select('-email').lean();

  if (!candidates.length) return [];

  // Fetch User settings for these donors
  const User = require('../models/User'); // inline require to avoid circular deps if any
  const uids = candidates.map(c => c.uid);
  const users = await User.find({ uid: { $in: uids } }).lean();
  const userMap = users.reduce((acc, u) => ({ ...acc, [u.uid]: u }), {});

  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMinStr = `${currentHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const isNightOrWeekend = currentHour >= 21 || currentHour < 6 || currentDay === 0 || currentDay === 6;
  const isReqCritical = bloodRequest.urgency === 'Critical';

  const nearbyDistricts = NEARBY[bloodRequest.district] || [];

  const filtered = candidates.filter(donor => {
    const user = userMap[donor.uid];
    if (!user || user.pausedAccount) return false;

    // 1. Urgency Filter
    if (user.urgencyFilter === 'Critical' && !isReqCritical) return false;
    if (user.urgencyFilter === 'UrgentCritical' && !['Critical', 'Urgent'].includes(bloodRequest.urgency)) return false;

    // 2. Quiet Hours (Critical always bypasses)
    if (user.quietHours?.enabled && !isReqCritical) {
      const { start, end } = user.quietHours;
      const isQuiet = start <= end 
        ? (currentMinStr >= start && currentMinStr <= end)
        : (currentMinStr >= start || currentMinStr <= end);
      if (isQuiet) return false;
    }

    // 3. Night/Weekend Availability (Critical always bypasses)
    if (isNightOrWeekend && !donor.nightWeekendAvail && !isReqCritical) return false;

    // 4. Preferred Distance Heuristic
    const isSameCity = donor.city.toLowerCase() === bloodRequest.city?.toLowerCase();
    const isSameDistrict = donor.district === bloodRequest.district;
    const isNearbyDistrict = nearbyDistricts.includes(donor.district);

    const pref = donor.preferredDistance || '25';
    if (pref === '5' && !isSameCity) return false;
    if (pref === '10' && !isSameDistrict) return false;
    if (pref === '25' && !isSameDistrict && !isNearbyDistrict) return false;
    // 'state' includes all, so it passes

    return true;
  });

  // Sort: same district first
  const sorted = filtered.sort((a, b) => {
    const aLocal = a.district === bloodRequest.district ? 0 : 1;
    const bLocal = b.district === bloodRequest.district ? 0 : 1;
    return aLocal - bLocal;
  });

  // Emit socket event to matched donors (if they're online)
  const io = (() => { try { return socketService.getIO(); } catch { return null; } })();
  if (io) {
    const matchPayload = {
      requestId:   bloodRequest._id,
      bloodGroup:  bloodRequest.bloodGroup,
      hospital:    bloodRequest.hospital,
      district:    bloodRequest.district,
      urgency:     bloodRequest.urgency,
      neededBy:    bloodRequest.neededBy,
    };
    sorted.forEach(donor => {
      io.to(`donor:${donor.uid}`).emit('request:matched', matchPayload);
    });
    // Also broadcast to all
    io.emit('request:created', {
      id: bloodRequest._id,
      bloodGroup: bloodRequest.bloodGroup,
      urgency: bloodRequest.urgency,
      district: bloodRequest.district,
    });
  }

  return sorted.slice(0, 20); // return top 20
}

module.exports = { matchDonors };
