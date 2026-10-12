const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/donationController');

const donationLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: 'Too many donation record requests.' } });

router.get('/my', verifyToken, ctrl.getMyDonations);
router.post('/', verifyToken, donationLimit, ctrl.addDonation);
router.patch('/:id', verifyToken, ctrl.updateDonation);
router.delete('/:id', verifyToken, ctrl.deleteDonation);

router.get('/pending', requireAdmin, ctrl.getPendingDonations);
router.patch('/:id/verify', requireAdmin, ctrl.verifyDonation);
router.get('/:id/certificate', verifyToken, ctrl.downloadCertificate);

// Public certificate validation
router.get('/verify-cert/:id', ctrl.verifyCertificatePublic);

module.exports = router;
