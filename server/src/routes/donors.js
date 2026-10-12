const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { donorSchema } = require('../utils/validators');
const ctrl = require('../controllers/donorController');

const postLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many requests.' } });

router.get('/',         optionalAuth, ctrl.listDonors);
router.get('/me',       verifyToken, ctrl.getMyDonor);
router.get('/card',     verifyToken, ctrl.getMyDonorCard);
router.get('/verify/:token', ctrl.verifyDonorByToken);
router.post('/card/regenerate-token', verifyToken, ctrl.regenerateQrToken);
router.patch('/card/toggle-qr', verifyToken, ctrl.toggleQrStatus);
router.post('/',        verifyToken, postLimit, validate(donorSchema), ctrl.upsertDonor);
router.patch('/me',     verifyToken, ctrl.updateDonor);
router.delete('/me',    verifyToken, ctrl.deleteDonor);
router.get('/:id',      optionalAuth, ctrl.getDonor);
router.get('/:id/contact', verifyToken, ctrl.getContact);

module.exports = router;
