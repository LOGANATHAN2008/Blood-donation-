const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../services/audit');
// Controllers (to be created)
// const adminDashboardCtrl = require('../controllers/adminDashboardController');
// const adminUserCtrl = require('../controllers/adminUserController');

// All admin routes require at least 'moderator' role (specific endpoints will enforce higher roles)
// and have access to req.audit()
router.use(requireRole(['moderator', 'admin', 'superadmin']), auditMiddleware);

// -- Dashboard & Stats --
// router.get('/stats', adminDashboardCtrl.getStats);

// -- Users --
// router.get('/users', adminUserCtrl.listUsers);
// router.get('/users/:uid', adminUserCtrl.getUserDetail);
// router.patch('/users/:uid/suspend', requireRole(['admin', 'superadmin']), adminUserCtrl.suspendUser);
// router.patch('/users/:uid/role', requireRole(['superadmin']), adminUserCtrl.changeRole);

module.exports = router;
