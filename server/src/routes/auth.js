const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiter for email sending
const emailSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  message: { error: 'Too many OTP requests from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/email-otp/send', emailSendLimiter, authCtrl.sendEmailOtp);
router.post('/email-otp/verify', authCtrl.verifyEmailOtp);
router.post('/phone-otp/send', authCtrl.sendPhoneOtp);
router.post('/phone-otp/verify', authCtrl.verifyPhoneOtp);

module.exports = router;
