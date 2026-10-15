const PushSubscription = require('../models/PushSubscription');
const { sendToSubscription } = require('../services/pushService');
const { z } = require('zod');

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  }),
  bloodGroups: z.array(z.string()).optional(),
  state: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  urgencyFilter: z.enum(['Critical', 'UrgentCritical', 'All']).optional().default('All'),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().default('22:00'),
    end: z.string().default('07:00')
  }).optional()
});

const DEFAULT_VAPID_PUBLIC_KEY = 'BKKXKxYRtEEy0gq3ZGa6xpbxA21QMKDYooi8vREkLMCP08lWweU3Y6XD0DMKHayYC9JytRbS_0YDGVoxaMVSxHc';

async function getPublicKey(req, res) {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY
  });
}

async function subscribe(req, res, next) {
  try {
    const parsed = subSchema.parse(req.body);
    const userAgent = req.headers['user-agent'] || '';

    const sub = await PushSubscription.findOneAndUpdate(
      { endpoint: parsed.endpoint },
      {
        uid: req.user.uid,
        endpoint: parsed.endpoint,
        keys: parsed.keys,
        bloodGroups: parsed.bloodGroups || [],
        state: parsed.state || req.user.dbUser?.state,
        district: parsed.district || req.user.dbUser?.district,
        urgencyFilter: parsed.urgencyFilter,
        quietHours: parsed.quietHours || { enabled: false, start: '22:00', end: '07:00' },
        userAgent
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, subscription: sub });
  } catch (err) { next(err); }
}

async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint, uid: req.user.uid });
    } else {
      await PushSubscription.deleteMany({ uid: req.user.uid });
    }
    res.json({ success: true, message: 'Unsubscribed from alerts.' });
  } catch (err) { next(err); }
}

async function getSubscription(req, res, next) {
  try {
    const subs = await PushSubscription.find({ uid: req.user.uid });
    res.json({ subscriptions: subs });
  } catch (err) { next(err); }
}

async function sendTestNotification(req, res, next) {
  try {
    const subs = await PushSubscription.find({ uid: req.user.uid });
    if (!subs.length) {
      return res.status(400).json({ error: 'No active device subscription found for your account.' });
    }

    const testPayload = {
      title: '🩸 Test Alert - Life Connect',
      body: 'Web Push alerts are configured and working properly on your device!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: '/settings',
        test: true
      }
    };

    let sentCount = 0;
    for (const sub of subs) {
      const sent = await sendToSubscription(sub, testPayload);
      if (sent) sentCount++;
    }

    res.json({ success: true, sentCount, total: subs.length });
  } catch (err) { next(err); }
}

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
  getSubscription,
  sendTestNotification
};
