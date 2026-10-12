const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { hospitalSchema } = require('../utils/validators');
const ctrl = require('../controllers/hospitalController');

const postLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many hospital submissions.' } });

router.get('/',           ctrl.listHospitals);
router.get('/mine',       verifyToken, ctrl.getMyHospitals);
router.post('/',          verifyToken, postLimit, validate(hospitalSchema), ctrl.submitHospital);
router.post('/:id/report-wrong-info', ctrl.reportWrongInfo);
router.delete('/:id',     verifyToken, ctrl.deleteHospital);

module.exports = router;
