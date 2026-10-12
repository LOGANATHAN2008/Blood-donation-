const EmailOtp = require('../models/EmailOtp');
const User = require('../models/User');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getAuth } = require('firebase-admin/auth');
const { z } = require('zod');

// Validation schema
const emailSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase().trim()),
});

exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = emailSchema.parse(req.body);
    
    // Check blocked disposable domains (simple example)
    const domain = email.split('@')[1];
    const blockedDomains = ['tempmail.com', '10minutemail.com'];
    if (blockedDomains.includes(domain)) {
      return res.status(400).json({ error: 'Disposable email domains are not allowed.' });
    }

    // Rate limits (5 sends per hour logic should be via express-rate-limit middleware on this route)
    
    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Hash it
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(otpCode, salt);

    // Upsert EmailOtp
    await EmailOtp.findOneAndUpdate(
      { email },
      { hash, attempts: 0, resends: 1, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    await emailService.sendOtpEmail(email, otpCode);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    console.error('sendEmailOtp error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email: rawEmail, code } = req.body;
    if (!rawEmail || !code || code.length !== 6) {
      return res.status(400).json({ error: 'Email and 6-digit code are required.' });
    }
    const email = rawEmail.toLowerCase().trim();

    const otpRecord = await EmailOtp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or invalid.' });
    }

    if (otpRecord.attempts >= (process.env.OTP_MAX_ATTEMPTS || 5)) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
    }

    // Verify hash with constant-time comparison
    const isValid = await bcrypt.compare(code, otpRecord.hash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    // OTP is valid. Delete it (single use)
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    // Firebase flow: Find or create user
    let firebaseUser;
    try {
      firebaseUser = await getAuth().getUserByEmail(email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        firebaseUser = await getAuth().createUser({
          email,
          emailVerified: true
        });
      } else {
        throw err;
      }
    }

    // Generate Custom Token
    const customToken = await getAuth().createCustomToken(firebaseUser.uid);

    res.json({ token: customToken });
  } catch (error) {
    console.error('verifyEmailOtp error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
