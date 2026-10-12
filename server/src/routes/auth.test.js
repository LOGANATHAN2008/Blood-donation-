const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const admin = require('firebase-admin');

// Mock email service and firebase admin
jest.mock('../services/emailService', () => ({
  sendOtpEmail: jest.fn()
}));
const emailService = require('../services/emailService');

jest.mock('firebase-admin', () => ({
  auth: () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createCustomToken: jest.fn(),
  }),
}));

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

describe('Auth API (Email OTP)', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await EmailOtp.deleteMany({});
    jest.clearAllMocks();
  });

  describe('OTP Generate/Hash/Verify', () => {
    it('should generate, save hash, and verify successfully', async () => {
      // Send OTP
      const resSend = await request(app)
        .post('/api/auth/email-otp/send')
        .send({ email: 'test@example.com' });
      expect(resSend.statusCode).toBe(200);
      expect(emailService.sendOtpEmail).toHaveBeenCalledTimes(1);

      // Verify OTP is hashed in DB
      const otpRecord = await EmailOtp.findOne({ email: 'test@example.com' });
      expect(otpRecord).toBeTruthy();
      expect(otpRecord.hash).not.toBeNull();
      
      // Get the actual code from mock call
      const actualCode = emailService.sendOtpEmail.mock.calls[0][1];

      // Mock Firebase
      admin.auth().getUserByEmail.mockResolvedValue({ uid: 'mock-uid-123' });
      admin.auth().createCustomToken.mockResolvedValue('mock-custom-token');

      // Verify OTP
      const resVerify = await request(app)
        .post('/api/auth/email-otp/verify')
        .send({ email: 'test@example.com', code: actualCode });
      
      expect(resVerify.statusCode).toBe(200);
      expect(resVerify.body.token).toBe('mock-custom-token');

      // Verify OTP record is deleted after successful use
      const deletedRecord = await EmailOtp.findOne({ email: 'test@example.com' });
      expect(deletedRecord).toBeNull();
    });

    it('should lock out after max attempts', async () => {
      await request(app).post('/api/auth/email-otp/send').send({ email: 'lockout@example.com' });
      
      // Attempt 5 wrong codes
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/email-otp/verify')
          .send({ email: 'lockout@example.com', code: '000000' });
      }

      // 6th attempt should return 429
      const resLocked = await request(app)
        .post('/api/auth/email-otp/verify')
        .send({ email: 'lockout@example.com', code: '000000' });
      
      expect(resLocked.statusCode).toBe(429);
      expect(resLocked.body.error).toContain('Too many failed attempts');
    });

    it('should link same uid for existing Google email', async () => {
      await request(app).post('/api/auth/email-otp/send').send({ email: 'googleuser@gmail.com' });
      const code = emailService.sendOtpEmail.mock.calls[0][1];

      // Mock Firebase returning an existing user
      admin.auth().getUserByEmail.mockResolvedValue({ uid: 'existing-google-uid' });
      admin.auth().createCustomToken.mockResolvedValue('token-for-google-uid');

      const res = await request(app)
        .post('/api/auth/email-otp/verify')
        .send({ email: 'googleuser@gmail.com', code });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe('token-for-google-uid');
      expect(admin.auth().createUser).not.toHaveBeenCalled();
    });
  });
});
