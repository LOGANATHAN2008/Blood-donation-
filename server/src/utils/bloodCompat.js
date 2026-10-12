/**
 * Blood group compatibility rules.
 * compatibleDonors[recipient] = array of donor groups that can donate to recipient.
 */
const COMPAT = {
  'A+':  ['A+','A-','O+','O-'],
  'A-':  ['A-','O-'],
  'B+':  ['B+','B-','O+','O-'],
  'B-':  ['B-','O-'],
  'O+':  ['O+','O-'],
  'O-':  ['O-'],
  'AB+': ['A+','A-','B+','B-','O+','O-','AB+','AB-'],
  'AB-': ['A-','B-','AB-','O-'],
};

/**
 * Returns the set of blood groups compatible (able to donate) with a given recipient group.
 * @param {string} recipientGroup
 * @returns {string[]}
 */
function getCompatibleDonors(recipientGroup) {
  return COMPAT[recipientGroup] || [];
}

/**
 * Returns true if donorGroup can donate to recipientGroup.
 */
function canDonate(donorGroup, recipientGroup) {
  return (COMPAT[recipientGroup] || []).includes(donorGroup);
}

const ELIGIBILITY_DAYS = 90;

/**
 * Returns true if the donor is eligible (last donation was >= 90 days ago or never donated).
 */
function isDonorEligible(lastDonationDate) {
  if (!lastDonationDate) return true;
  const daysSince = (Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= ELIGIBILITY_DAYS;
}

/**
 * Returns the earliest date when the donor becomes eligible again.
 */
function nextEligibleDate(lastDonationDate) {
  if (!lastDonationDate) return null;
  const d = new Date(lastDonationDate);
  d.setDate(d.getDate() + ELIGIBILITY_DAYS);
  return d;
}

module.exports = { COMPAT, getCompatibleDonors, canDonate, isDonorEligible, nextEligibleDate, ELIGIBILITY_DAYS };
