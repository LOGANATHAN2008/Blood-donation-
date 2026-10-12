const BADGES = [
  {
    id: 'first_drop',
    name: 'First Drop',
    description: 'Completed your 1st verified blood donation',
    countRequired: 1,
    type: 'count',
    icon: '🩸',
    color: 'from-red-400 to-rose-600'
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
    description: 'Responded to a critical emergency request',
    type: 'special',
    icon: '🚨',
    color: 'from-rose-500 to-red-700'
  },
  {
    id: 'camp_supporter',
    name: 'Camp Supporter',
    description: 'Attended and donated at an approved blood camp',
    type: 'special',
    icon: '⛺',
    color: 'from-amber-500 to-yellow-600'
  }
];

const LEVELS = [
  { name: 'Bronze', minDonations: 0, maxDonations: 2, icon: '🥉' },
  { name: 'Silver', minDonations: 3, maxDonations: 4, icon: '🥈' },
  { name: 'Gold', minDonations: 5, maxDonations: 9, icon: '🥇' },
  { name: 'Platinum', minDonations: 10, maxDonations: 24, icon: '💎' },
  { name: 'Diamond', minDonations: 25, maxDonations: 9999, icon: '👑' }
];

function getLevelForCount(count) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (count >= LEVELS[i].minDonations) {
      return LEVELS[i].name;
    }
  }
  return 'Bronze';
}

module.exports = { BADGES, LEVELS, getLevelForCount };
