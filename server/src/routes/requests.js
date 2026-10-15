const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { bloodRequestSchema } = require('../utils/validators');
const ctrl = require('../controllers/requestController');

const postLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many requests.' } });
const emergencyLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many emergency requests from this IP.' } });

// Emergency & Public endpoints
router.get('/', ctrl.listRequests);
router.post('/emergency', emergencyLimit, optionalAuth, ctrl.createEmergencyRequest);
router.get('/:id', ctrl.getRequestByIdOrCode);
router.patch('/:id/emergency-status', optionalAuth, ctrl.updateEmergencyStatus);
router.post('/:id/share', ctrl.recordShare);

// Standard endpoints
router.get('/mine', verifyToken, ctrl.myRequests);
router.post('/', verifyToken, postLimit, validate(bloodRequestSchema), ctrl.createRequest);
router.patch('/:id/status', verifyToken, ctrl.updateStatus);
router.delete('/:id', verifyToken, ctrl.deleteRequest);

module.exports = router;
