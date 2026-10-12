const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/pushController');

const pushRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many push notification actions.' } });

router.get('/public-key', ctrl.getPublicKey);
router.get('/vapid-key', ctrl.getPublicKey);
router.post('/subscribe', verifyToken, pushRateLimit, ctrl.subscribe);
router.post('/unsubscribe', verifyToken, ctrl.unsubscribe);
router.get('/subscription', verifyToken, ctrl.getSubscription);
router.post('/test', verifyToken, pushRateLimit, ctrl.sendTestNotification);

module.exports = router;
