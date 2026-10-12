const Report       = require('../models/Report');
const BloodRequest = require('../models/BloodRequest');
const Medicine     = require('../models/Medicine');
const Hospital     = require('../models/Hospital');
const Donor        = require('../models/Donor');
const User         = require('../models/User');
const { deleteAsset } = require('../services/cloudinary');

const MODEL_MAP = { BloodRequest, Medicine, Hospital, Donor };

/**
 * POST /api/reports
 * Any authenticated user can report a post.
 */
async function createReport(req, res, next) {
  try {
    const { targetType, targetId, reason } = req.body;

    // Check the target exists
    const Model = MODEL_MAP[targetType];
    if (!Model) return res.status(400).json({ error: 'Invalid target type.' });
    const target = await Model.findById(targetId);
    if (!target) return res.status(404).json({ error: 'Target not found.' });

    try {
      await Report.create({ reporterUid: req.user.uid, targetType, targetId, reason });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'You have already reported this post.' });
      throw e;
    }

    // Increment report count on target
    await Model.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });

    // Auto-hide after 3 unique reports
    const refreshed = await Model.findById(targetId);
    if (refreshed && refreshed.reportCount >= 3 && !refreshed.hidden) {
      await Model.findByIdAndUpdate(targetId, { hidden: true });
    }

    res.status(201).json({ message: 'Report submitted. Thank you.' });
  } catch (err) { next(err); }
}

// ============ ADMIN ROUTES ============

async function listReports(req, res, next) {
  try {
    const reports = await Report.find({ reviewed: false }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) { next(err); }
}

async function resolveReport(req, res, next) {
  try {
    const { action } = req.body; // 'dismiss' | 'remove'
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (action === 'remove') {
      const Model = MODEL_MAP[report.targetType];
      if (Model) {
        const target = await Model.findById(report.targetId);
        if (target?.imagePublicId) await deleteAsset(target.imagePublicId);
        await Model.findByIdAndDelete(report.targetId);
      }
    } else {
      // Dismiss: unhide the target
      const Model = MODEL_MAP[report.targetType];
      if (Model) await Model.findByIdAndUpdate(report.targetId, { hidden: false });
    }

    // Mark all reports for this target as reviewed
    await Report.updateMany({ targetId: report.targetId }, { reviewed: true });
    res.json({ message: `Report ${action}d.` });
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) { next(err); }
}

async function blockUser(req, res, next) {
  try {
    const { blocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { blocked }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { createReport, listReports, resolveReport, listUsers, blockUser };
