const User     = require('../models/User');
const Donor    = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const Medicine = require('../models/Medicine');
const Report   = require('../models/Report');
const ContactLog = require('../models/ContactLog');
const { deleteAsset } = require('../services/cloudinary');

/**
 * GET /api/users/me
 * Auth required.
 */
const crypto = require('crypto');

/**
 * GET /api/users/me
 * Auth required.
 */
async function getMe(req, res, next) {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Generate referralCode if not yet set
    if (!user.referralCode) {
      user.referralCode = 'LC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await user.save();
    }
    
    const userObj = user.toObject();

    // Calculate profileStatus
    const hasPhone = !!(userObj.verifiedPhone || userObj.phone);
    const profileStatus = {
      hasName: !!userObj.name && userObj.name.trim().length > 0,
      hasDob: !!userObj.dob,
      hasGender: !!userObj.gender,
      hasPhone: hasPhone,
      hasEmail: !!userObj.email,
    };
    profileStatus.isComplete = Boolean(
      userObj.profileCompleted || 
      userObj.onboardingComplete || 
      (profileStatus.hasName && profileStatus.hasDob && profileStatus.hasGender && hasPhone)
    );
    
    res.json({ ...userObj, profileStatus });
  } catch (err) { next(err); }
}

const { getAuth } = require('firebase-admin/auth');
const { userSettingsSchema, onboardingSchema } = require('../utils/validators');

/**
 * PATCH /api/users/me/settings
 * Update settings across User and Donor profiles.
 */
async function updateMe(req, res, next) {
  try {
    const data = userSettingsSchema.parse(req.body);
    const { uid } = req.user;

    // Split fields for User and Donor
    const userUpdate = {};
    const donorUpdate = {};

    const userFields = [
      'name', 'photoUrl', 'photoId', 'state', 'district', 'city', 'dob', 'gender',
      'language', 'theme', 'textSize', 'urgencyFilter', 'campReminders', 'medicineAlerts',
      'pushOptIn', 'quietHours', 'pausedAccount', 'phone', 'leaderboardOptIn', 'donorCardQrEnabled'
    ];
    
    const donorFields = [
      'bloodGroup', 'available', 'lastDonationDate', 'contactVisibility', 'preferredDistance', 'nightWeekendAvail'
    ];

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      if (userFields.includes(key)) userUpdate[key] = val;
      if (donorFields.includes(key)) donorUpdate[key] = val;
      
      // Some shared fields should sync to Donor
      if (['name', 'district', 'city'].includes(key)) donorUpdate[key] = val;
      if (key === 'donorCardQrEnabled') donorUpdate.qrEnabled = val;
    }

    if (userUpdate.phone) {
      userUpdate.verifiedPhone = userUpdate.phone;
    }

    const [user, donor] = await Promise.all([
      User.findOneAndUpdate({ uid }, { $set: userUpdate }, { new: true }),
      Object.keys(donorUpdate).length > 0 
        ? Donor.findOneAndUpdate({ uid }, { $set: donorUpdate }, { new: true }) 
        : null
    ]);

    res.json({ user, donor });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/users/me
 * Delete account and all associated data, including Firebase user.
 */
async function deleteMe(req, res, next) {
  try {
    const { uid } = req.user;

    // Delete medicine images from Cloudinary
    const medicines = await Medicine.find({ uid }).select('imagePublicId');
    await Promise.all(medicines.map(m => deleteAsset(m.imagePublicId)));

    // Delete all user data
    await Promise.all([
      Donor.deleteOne({ uid }),
      BloodRequest.deleteMany({ uid }),
      Medicine.deleteMany({ uid }),
      Report.deleteMany({ reporterUid: uid }),
      ContactLog.deleteMany({ requesterUid: uid }),
      User.deleteOne({ uid })
    ]);

    try {
      await getAuth().deleteUser(uid);
    } catch (e) {
      console.error('Firebase user deletion failed:', e.message);
    }

    res.json({ message: 'Account and all data deleted.' });
  } catch (err) { next(err); }
}

/**
 * GET /api/stats
 * Public: live counts.
 */
async function getStats(req, res, next) {
  try {
    const [donors, requests, medicines] = await Promise.all([
      Donor.countDocuments({ available: true, hidden: false }),
      BloodRequest.countDocuments({ status: 'Active', hidden: false }),
      Medicine.countDocuments({ status: 'Available', hidden: false }),
    ]);
    res.json({ donors, requests, medicines });
  } catch (err) { next(err); }
}

/**
 * GET /api/users/me/export
 * Export all user data as JSON
 */
async function exportMe(req, res, next) {
  try {
    const { uid } = req.user;
    
    const [user, donor, requests, medicines, reports, contacts] = await Promise.all([
      User.findOne({ uid }).lean(),
      Donor.findOne({ uid }).lean(),
      BloodRequest.find({ uid }).lean(),
      Medicine.find({ uid }).lean(),
      Report.find({ reporterUid: uid }).lean(),
      ContactLog.find({ requesterUid: uid }).lean()
    ]);

    res.json({ user, donor, requests, medicines, reports, contacts });
  } catch (err) { next(err); }
}

/**
 * POST /api/users/me/sessions/revoke
 * Logs the user out of all devices by revoking Firebase refresh tokens.
 */
async function revokeSessions(req, res, next) {
  try {
    const { uid } = req.user;
    await getAuth().revokeRefreshTokens(uid);
    res.json({ message: 'All active sessions revoked successfully. Other devices will be logged out shortly.' });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/users/me/profile
 * Completes the onboarding process.
 */
async function completeOnboarding(req, res, next) {
  try {
    const data = onboardingSchema.parse(req.body);
    const { uid } = req.user;

    const updateFields = {
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      state: data.state,
      district: data.district,
      city: data.city,
    };
    
    if (data.photoUrl !== undefined) updateFields.photoUrl = data.photoUrl;
    if (data.photoId !== undefined) updateFields.photoId = data.photoId;
    if (data.phone !== undefined) {
      updateFields.phone = data.phone;
      updateFields.verifiedPhone = data.phone;
    }
    
    // Mark profile completed & onboarding complete so it NEVER pops up again
    updateFields.onboardingComplete = true;
    updateFields.profileCompleted = true;
    updateFields.profileCompletedAt = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: updateFields },
      { new: true }
    );

    const profileStatus = {
      hasName: true,
      hasDob: true,
      hasGender: true,
      hasPhone: true,
      hasEmail: !!updatedUser.email,
      isComplete: true,
    };

    res.json({ ...updatedUser.toObject(), profileStatus });
  } catch (err) { next(err); }
}

const { generateSignature } = require('../services/cloudinary');

/**
 * GET /api/users/me/upload-signature
 * Returns Cloudinary signed upload parameters.
 */
async function getUploadSignature(req, res, next) {
  try {
    const params = generateSignature({ folder: 'lifeconnect/profiles' });
    res.json(params);
  } catch (err) { next(err); }
}

module.exports = { getMe, updateMe, deleteMe, exportMe, getStats, revokeSessions, getUploadSignature, completeOnboarding };
