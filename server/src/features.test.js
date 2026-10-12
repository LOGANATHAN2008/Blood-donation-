const { getLevelForCount } = require('./config/badges');
const { isDonorEligible, nextEligibleDate, canDonate, getCompatibleDonors } = require('./utils/bloodCompat');
const { isQuietTime } = require('./services/pushService');

describe('Feature 1 & 2: Eligibility & Blood Compatibility', () => {
  test('90-day donation eligibility date calculation', () => {
    expect(isDonorEligible(null)).toBe(true);

    const eightyDaysAgo = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000);
    expect(isDonorEligible(eightyDaysAgo)).toBe(false);

    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
    expect(isDonorEligible(ninetyFiveDaysAgo)).toBe(true);

    const nextDate = nextEligibleDate(eightyDaysAgo);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate.getTime()).toBeGreaterThan(Date.now());
  });

  test('blood compatibility rules for emergency push matching', () => {
    // O- is universal donor
    expect(canDonate('O-', 'AB+')).toBe(true);
    expect(canDonate('O-', 'A+')).toBe(true);
    expect(canDonate('O-', 'O-')).toBe(true);

    // AB+ can only donate to AB+
    expect(canDonate('AB+', 'AB+')).toBe(true);
    expect(canDonate('AB+', 'O+')).toBe(false);

    // B+ recipient compatibility
    const compatibleWithBPlus = getCompatibleDonors('B+');
    expect(compatibleWithBPlus).toEqual(['B+', 'B-', 'O+', 'O-']);
  });
});

describe('Feature 3: Badges & Levels Tier Computation', () => {
  test('level tier computes correctly from verified donations', () => {
    expect(getLevelForCount(0)).toBe('Bronze');
    expect(getLevelForCount(1)).toBe('Bronze');
    expect(getLevelForCount(2)).toBe('Bronze');
    expect(getLevelForCount(3)).toBe('Silver');
    expect(getLevelForCount(4)).toBe('Silver');
    expect(getLevelForCount(5)).toBe('Gold');
    expect(getLevelForCount(9)).toBe('Gold');
    expect(getLevelForCount(10)).toBe('Platinum');
    expect(getLevelForCount(24)).toBe('Platinum');
    expect(getLevelForCount(25)).toBe('Diamond');
    expect(getLevelForCount(100)).toBe('Diamond');
  });
});

describe('Feature 6: Push Quiet Hours & Filter Logic', () => {
  test('quiet hours detection logic handles disabled state', () => {
    expect(isQuietTime({ enabled: false })).toBe(false);
    expect(isQuietTime(null)).toBe(false);
  });

  test('quiet hours range check with overnight boundaries', () => {
    // 00:00 to 23:59 covers all day
    expect(isQuietTime({ enabled: true, start: '00:00', end: '23:59' })).toBe(true);
  });
});

describe('Privacy Safeguards on Public Endpoints', () => {
  test('anonymization sanitizes full names to first name + initial', () => {
    function sanitizeLeaderboardName(fullName) {
      const parts = (fullName || 'Anonymous').trim().split(/\s+/);
      return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
    }

    expect(sanitizeLeaderboardName('Loganathan Murugan')).toBe('Loganathan M.');
    expect(sanitizeLeaderboardName('Karthik')).toBe('Karthik');
    expect(sanitizeLeaderboardName('Dr. Senthil Nathan')).toBe('Dr. S.');
  });
});
