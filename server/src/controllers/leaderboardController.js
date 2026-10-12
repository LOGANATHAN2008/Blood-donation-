const User = require('../models/User');
const DonationRecord = require('../models/DonationRecord');

async function getLeaderboard(req, res, next) {
  try {
    const { timeRange = 'allTime', state, district, limit = 50 } = req.query;

    const baseUserFilter = {
      leaderboardOptIn: true,
      blocked: false,
      deletedAt: null
    };

    if (state && state.trim()) {
      baseUserFilter.state = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }
    if (district && district.trim()) {
      baseUserFilter.district = { $regex: new RegExp(`^${district.trim()}$`, 'i') };
    }

    if (timeRange === 'thisYear') {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      // Find all opted in users
      const optedInUsers = await User.find(baseUserFilter).select('uid name state district photoUrl badgeLevel').lean();
      if (!optedInUsers.length) {
        return res.json({ data: [], total: 0 });
      }

      const userUids = optedInUsers.map(u => u.uid);

      // Aggregate verified donations for this year
      const donationsThisYear = await DonationRecord.aggregate([
        {
          $match: {
            uid: { $in: userUids },
            verificationStatus: 'verified',
            date: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: '$uid',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: Number(limit) }
      ]);

      const countMap = new Map(donationsThisYear.map(d => [d._id, d.count]));
      const userMap = new Map(optedInUsers.map(u => [u.uid, u]));

      const ranked = donationsThisYear
        .filter(d => d.count > 0)
        .map((d, index) => {
          const user = userMap.get(d._id);
          const parts = (user?.name || 'Anonymous').trim().split(/\s+/);
          const displayName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];

          return {
            rank: index + 1,
            displayName,
            count: d.count,
            state: user?.state || null,
            district: user?.district || null,
            photoUrl: user?.photoUrl || null,
            badgeLevel: user?.badgeLevel || 'Bronze'
          };
        });

      return res.json({ data: ranked, total: ranked.length });
    } else {
      // All time
      baseUserFilter.totalDonations = { $gt: 0 };

      const users = await User.find(baseUserFilter)
        .select('name state district photoUrl badgeLevel totalDonations')
        .sort({ totalDonations: -1 })
        .limit(Number(limit))
        .lean();

      const ranked = users.map((u, index) => {
        const parts = (u.name || 'Anonymous').trim().split(/\s+/);
        const displayName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];

        return {
          rank: index + 1,
          displayName,
          count: u.totalDonations || 0,
          state: u.state || null,
          district: u.district || null,
          photoUrl: u.photoUrl || null,
          badgeLevel: u.badgeLevel || 'Bronze'
        };
      });

      return res.json({ data: ranked, total: ranked.length });
    }
  } catch (err) { next(err); }
}

module.exports = { getLeaderboard };
