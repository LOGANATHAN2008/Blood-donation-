export const BADGES = [
  {
    id: 'first_drop',
    name: 'First Drop',
    description: 'Completed your 1st verified blood donation',
    countRequired: 1,
    type: 'count',
    icon: '🩸',
    color: 'from-rose-500 to-red-600'
  },
  {
    id: 'regular_hero',
    name: 'Regular Hero',
    description: 'Completed 3 verified blood donations',
    countRequired: 3,
    type: 'count',
    icon: '🥈',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Completed 5 verified blood donations',
    countRequired: 5,
    type: 'count',
    icon: '🏅',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'life_saver',
    name: 'Life Saver',
    description: 'Completed 10 verified blood donations',
    countRequired: 10,
    type: 'count',
    icon: '⭐',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'community_hero',
    name: 'Community Hero',
    description: 'Completed 25 verified blood donations',
    countRequired: 25,
    type: 'count',
    icon: '👑',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'emergency_responder',
    name: 'Emergency Responder',
    description: 'Responded to a critical request',
    type: 'special',
    icon: '🚨',
    color: 'from-rose-500 to-red-700'
  },
  {
    id: 'camp_supporter',
    name: 'Camp Supporter',
    description: 'Attended an approved blood donation camp',
    type: 'special',
    icon: '⛺',
    color: 'from-amber-500 to-yellow-600'
  }
];

export const LEVELS = [
  { name: 'Bronze', minDonations: 0, maxDonations: 2, icon: '🥉', nextAt: 3 },
  { name: 'Silver', minDonations: 3, maxDonations: 4, icon: '🥈', nextAt: 5 },
  { name: 'Gold', minDonations: 5, maxDonations: 9, icon: '🥇', nextAt: 10 },
  { name: 'Platinum', minDonations: 10, maxDonations: 24, icon: '💎', nextAt: 25 },
  { name: 'Diamond', minDonations: 25, maxDonations: 9999, icon: '👑', nextAt: null }
];

export function getLevelDetails(count = 0) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (count >= LEVELS[i].minDonations) {
      const current = LEVELS[i];
      const next = LEVELS[i + 1] || null;
      let progressPercent = 100;
      if (next) {
        const span = next.minDonations - current.minDonations;
        const currSpan = count - current.minDonations;
        progressPercent = Math.min(100, Math.round((currSpan / span) * 100));
      }
      return {
        level: current.name,
        icon: current.icon,
        nextLevel: next ? next.name : null,
        nextDonationsRequired: next ? next.minDonations - count : 0,
        progressPercent
      };
    }
  }
  return {
    level: 'Bronze',
    icon: '🥉',
    nextLevel: 'Silver',
    nextDonationsRequired: 3,
    progressPercent: 0
  };
}
