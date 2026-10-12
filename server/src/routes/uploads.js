const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { generateSignature } = require('../services/cloudinary');

const signLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many upload requests.' } });

/**
 * POST /api/uploads/sign
 * Auth required. Returns a signed upload signature for direct Cloudinary upload.
 */
router.post('/sign', verifyToken, signLimit, (req, res) => {
  const sig = generateSignature();
  res.json(sig);
});

module.exports = router;
