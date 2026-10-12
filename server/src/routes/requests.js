const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { bloodRequestSchema } = require('../utils/validators');
const ctrl = require('../controllers/requestController');

const postLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many requests.' } });

router.get('/',              ctrl.listRequests);
router.get('/mine',          verifyToken, ctrl.myRequests);
router.post('/',             verifyToken, postLimit, validate(bloodRequestSchema), ctrl.createRequest);
router.patch('/:id/status',  verifyToken, ctrl.updateStatus);
router.delete('/:id',        verifyToken, ctrl.deleteRequest);

module.exports = router;
