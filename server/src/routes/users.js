const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const userCtrl   = require('../controllers/userController');
const reportCtrl = require('../controllers/reportController');
const hospitalCtrl = require('../controllers/hospitalController');

// User
router.get('/me',    verifyToken, userCtrl.getMe);
router.get('/me/export', verifyToken, userCtrl.exportMe);
router.patch('/me/settings', verifyToken, userCtrl.updateMe);
router.patch('/me/onboarding', verifyToken, userCtrl.completeOnboarding);
router.post('/me/sessions/revoke', verifyToken, userCtrl.revokeSessions);
router.get('/me/upload-signature', verifyToken, userCtrl.getUploadSignature);
router.delete('/me', verifyToken, userCtrl.deleteMe);

// Stats (public)
router.get('/stats', userCtrl.getStats);

// Admin
router.get('/admin/reports',           requireAdmin, reportCtrl.listReports);
router.patch('/admin/reports/:id',     requireAdmin, reportCtrl.resolveReport);
router.get('/admin/hospitals/pending', requireAdmin, hospitalCtrl.pendingHospitals);
router.patch('/admin/hospitals/:id',   requireAdmin, hospitalCtrl.approveHospital);
router.get('/admin/users',             requireAdmin, reportCtrl.listUsers);
router.patch('/admin/users/:id/block', requireAdmin, reportCtrl.blockUser);

module.exports = router;
