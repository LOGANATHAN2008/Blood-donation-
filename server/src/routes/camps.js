const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/campController');

const campPostLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many camp submissions.' } });
const interestLimit = rateLimit({ windowMs: 1 * 60 * 1000, max: 30, message: { error: 'Too many requests.' } });

router.get('/', optionalAuth, ctrl.listCamps);
router.post('/', verifyToken, campPostLimit, ctrl.createCamp);
router.post('/:id/interest', verifyToken, interestLimit, ctrl.toggleInterest);
router.post('/:id/report', ctrl.reportCamp);
router.get('/pending', requireAdmin, ctrl.pendingCamps);
router.patch('/:id/approve', requireAdmin, ctrl.approveCamp);

module.exports = router;
