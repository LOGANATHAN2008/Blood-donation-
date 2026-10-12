const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { reportSchema } = require('../utils/validators');
const ctrl = require('../controllers/reportController');

const reportLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { error: 'Too many reports.' } });

router.post('/', verifyToken, reportLimit, validate(reportSchema), ctrl.createReport);

module.exports = router;
