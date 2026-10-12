const User = require('../models/User');
const Donor = require('../models/Donor');
const DonationRecord = require('../models/DonationRecord');
const { BADGES, getLevelForCount } = require('../config/badges');
const socketService = require('./socket');

/**
 * Recomputes badges and levels idempotently for a user from their verified donation records.
 * Emits socket notification on new badge unlock.
 * @param {string} uid
 * @returns {Promise<{ totalDonations: number, level: string, newBadges: Array }>}
 */
async function computeUserBadges(uid) {
  const user = await User.findOne({ uid });
  if (!user) return null;

  const verifiedRecords = await DonationRecord.find({ uid, verificationStatus: 'verified' });
  const totalVerified = verifiedRecords.length;

  const existingBadgeIds = new Set((user.badges || []).map(b => b.id));
  const newBadges = [];

  // Check count-based badges
  for (const badgeDef of BADGES) {
    if (badgeDef.type === 'count' && totalVerified >= badgeDef.countRequired) {
      if (!existingBadgeIds.has(badgeDef.id)) {
        const earned = {
          id: badgeDef.id,
          name: badgeDef.name,
          level: badgeDef.name,
          icon: badgeDef.icon,
          earnedAt: new Date()
        };
        newBadges.push(earned);
        user.badges.push(earned);
        existingBadgeIds.add(badgeDef.id);
      }
    }
  }

  // Check Camp Supporter badge
  const hasCampDonation = verifiedRecords.some(r => r.campId || r.campTitle);
  if (hasCampDonation && !existingBadgeIds.has('camp_supporter')) {
    const campBadge = BADGES.find(b => b.id === 'camp_supporter');
    const earned = {
      id: campBadge.id,
      name: campBadge.name,
      level: campBadge.name,
      icon: campBadge.icon,
      earnedAt: new Date()
    };
    newBadges.push(earned);
    user.badges.push(earned);
    existingBadgeIds.add('camp_supporter');
  }

  // Update total donations and level
  user.totalDonations = totalVerified;
  const newLevel = getLevelForCount(totalVerified);
  user.badgeLevel = newLevel;

  await user.save();

  // Also sync Donor document if one exists
  await Donor.updateOne({ uid }, { totalDonations: totalVerified });

  // If new badges were unlocked, emit socket event
  if (newBadges.length > 0) {
    try {
      const io = socketService.getIO();
      if (io) {
        io.to(`donor:${uid}`).emit('badge:unlocked', {
          badges: newBadges,
          level: newLevel,
          totalDonations: totalVerified
        });
      }
    } catch (e) {
      console.warn('Socket emit badge unlock warning:', e.message);
    }
  }

  return {
    totalDonations: totalVerified,
    level: newLevel,
    newBadges,
    allBadges: user.badges
  };
}

module.exports = { computeUserBadges };
