const cron = require('node-cron');
const BloodRequest = require('../models/BloodRequest');
const Medicine     = require('../models/Medicine');
const { deleteAsset } = require('../services/cloudinary');
const socketService = require('../services/socket');

/**
 * Every 5 minutes: expire blood requests past neededBy.
 */
function startRequestExpiryJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await BloodRequest.updateMany(
        { status: 'Active', neededBy: { $lte: new Date() } },
        { status: 'Expired' }
      );
      if (result.modifiedCount > 0) {
        console.log(`[CRON] Expired ${result.modifiedCount} blood requests`);
        socketService.broadcast('request:expired', { count: result.modifiedCount });
        socketService.emitStats().catch(() => {});
      }
    } catch (err) {
      console.error('[CRON] requestExpiry error:', err.message);
    }
  });
}

/**
 * Every hour: mark medicines as Expired if expiryDate has passed.
 * Also delete their Cloudinary image.
 */
function startMedicineExpiryJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await Medicine.find({
        status: { $in: ['Available', 'Reserved'] },
        expiryDate: { $lte: new Date() },
      }).select('_id imagePublicId');

      if (!expired.length) return;

      // Delete cloudinary images concurrently
      await Promise.all(expired.map(m => deleteAsset(m.imagePublicId)));

      const ids = expired.map(m => m._id);
      await Medicine.updateMany({ _id: { $in: ids } }, { status: 'Expired', imageUrl: null, imagePublicId: null });

      console.log(`[CRON] Marked ${expired.length} medicines as expired`);
      expired.forEach(m => socketService.broadcast('medicine:removed', { id: m._id }));
      socketService.emitStats().catch(() => {});
    } catch (err) {
      console.error('[CRON] medicineExpiry error:', err.message);
    }
  });
}

module.exports = { startRequestExpiryJob, startMedicineExpiryJob };
