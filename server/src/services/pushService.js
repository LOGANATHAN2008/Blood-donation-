const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Donor = require('../models/Donor');
const { canDonate, isDonorEligible } = require('../utils/bloodCompat');

// Initialize VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@Blood.loganathanm.in',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error('Failed to configure Web Push VAPID:', err.message);
  }
}

/**
 * Checks if current time falls within subscriber's quiet hours (HH:mm format)
 */
function isQuietTime(quietHours) {
  if (!quietHours || !quietHours.enabled) return false;
  try {
    const now = new Date();
    // Indian Standard Time (UTC+5:30)
    const istOffset = 5.5 * 60;
    const istDate = new Date(now.getTime() + (istOffset * 60 * 1000));
    const hours = istDate.getUTCHours().toString().padStart(2, '0');
    const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
    const current = `${hours}:${minutes}`;

    const { start = '22:00', end = '07:00' } = quietHours;
    if (start < end) {
      return current >= start && current <= end;
    } else {
      // Overnight (e.g. 22:00 to 07:00)
      return current >= start || current <= end;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Sends push payload to a single subscription, removing on 404 or 410.
 */
async function sendToSubscription(sub, payload) {
  const pushConfig = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth
    }
  };

  try {
    await webPush.sendNotification(pushConfig, JSON.stringify(payload));
    
    // Update rate count
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    if (!sub.hourResetAt || (now - new Date(sub.hourResetAt)) > oneHour) {
      sub.hourResetAt = now;
      sub.pushCountThisHour = 1;
    } else {
      sub.pushCountThisHour = (sub.pushCountThisHour || 0) + 1;
    }
    sub.lastPushedAt = now;
    await sub.save();
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`Pruning expired push subscription ${sub.endpoint}`);
      await PushSubscription.deleteOne({ _id: sub._id });
    } else {
      console.warn(`Web push delivery failed (${err.statusCode}):`, err.message);
    }
    return false;
  }
}

/**
 * Notify matching subscribers when a request is created or upgraded.
 */
async function notifyMatchingSubscribers(request) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    // Find active subscriptions in the same state or district
    const query = {
      $or: [
        { district: request.district },
        { state: request.state }
      ]
    };

    const subscriptions = await PushSubscription.find(query);
    if (!subscriptions.length) return;

    const requestUrgency = request.urgency || 'Urgent';

    // Group subscriptions by user for donor eligibility check
    const sentUsers = new Set();

    for (const sub of subscriptions) {
      // Avoid duplicate alerts to same user across devices if already processed
      if (sentUsers.has(sub.uid)) continue;

      // 1. Check blood compatibility: Can subscriber donate to request blood group?
      let matchesBlood = false;
      if (sub.bloodGroups && sub.bloodGroups.length > 0) {
        matchesBlood = sub.bloodGroups.some(donorBg => canDonate(donorBg, request.bloodGroup));
      } else {
        // default match if no group specified
        matchesBlood = true;
      }
      if (!matchesBlood) continue;

      // 2. Check Urgency filter
      if (sub.urgencyFilter === 'Critical' && requestUrgency !== 'Critical') continue;
      if (sub.urgencyFilter === 'UrgentCritical' && !['Critical', 'Urgent'].includes(requestUrgency)) continue;

      // 3. Respect Quiet Hours (except for Critical requests)
      if (requestUrgency !== 'Critical' && isQuietTime(sub.quietHours)) continue;

      // 4. Rate limiting: max 5 pushes per hour
      const now = new Date();
      const oneHour = 60 * 60 * 1000;
      if (sub.hourResetAt && (now - new Date(sub.hourResetAt)) < oneHour) {
        if ((sub.pushCountThisHour || 0) >= 5) continue;
      }

      // 5. Donor Availability and 90-day eligibility check
      const donor = await Donor.findOne({ uid: sub.uid });
      if (donor) {
        if (!donor.available) continue;
        if (!isDonorEligible(donor.lastDonationDate)) continue;
      }

      // 6. Build Privacy-Safe Payload (NO PHONE NUMBERS)
      const payload = {
        title: `🩸 ${requestUrgency.toUpperCase()}: ${request.bloodGroup} Needed`,
        body: `${request.bloodGroup} needed at ${request.hospital || 'Hospital'}, ${request.district || request.state}.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          url: `/requests`,
          requestId: request._id ? request._id.toString() : null
        }
      };

      await sendToSubscription(sub, payload);
      sentUsers.add(sub.uid);
    }
  } catch (err) {
    console.error('Error in notifyMatchingSubscribers:', err);
  }
}

module.exports = {
  sendToSubscription,
  notifyMatchingSubscribers,
  isQuietTime
};
