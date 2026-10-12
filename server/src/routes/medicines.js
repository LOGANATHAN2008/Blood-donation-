const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { medicineSchema } = require('../utils/validators');
const ctrl = require('../controllers/medicineController');

const postLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many medicine posts.' } });

router.get('/',              ctrl.listMedicines);
router.get('/mine',          verifyToken, ctrl.getMyMedicines);
router.get('/:id',           ctrl.getMedicine);
router.post('/',             verifyToken, postLimit, validate(medicineSchema), ctrl.createMedicine);
router.patch('/:id',         verifyToken, ctrl.updateMedicine);
router.delete('/:id',        verifyToken, ctrl.deleteMedicine);
router.post('/:id/reserve',  verifyToken, ctrl.reserveMedicine);
router.post('/:id/give',     verifyToken, ctrl.markGiven);

module.exports = router;
