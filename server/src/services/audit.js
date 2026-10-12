const AuditLog = require('../models/AuditLog');

/**
 * Logs an administrative or sensitive action to the AuditLog.
 * @param {Object} params
 * @param {String} params.actorUid User ID of the person performing the action
 * @param {String} params.actorRole Role of the person performing the action
 * @param {String} params.action The action performed (e.g., 'BLOCK_USER', 'DELETE_HOSPITAL')
 * @param {String} params.targetType The type of entity being acted upon (e.g., 'User', 'Hospital', 'Settings')
 * @param {String} params.targetId The ID of the entity
 * @param {Object} [params.snapshotBefore] State of the entity before the action
 * @param {Object} [params.snapshotAfter] State of the entity after the action
 * @param {String} [params.ipAddress] Request IP address
 * @param {String} [params.userAgent] Request User-Agent
 */
async function logAudit({ actorUid, actorRole, action, targetType, targetId, snapshotBefore = null, snapshotAfter = null, ipAddress = null, userAgent = null }) {
  try {
    await AuditLog.create({
      actorUid,
      actorRole,
      action,
      targetType,
      targetId,
      snapshotBefore,
      snapshotAfter,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Express middleware helper to log the audit from req easily.
 * e.g., req.audit('BLOCK_USER', 'User', targetUid, before, after)
 */
function auditMiddleware(req, res, next) {
  req.audit = async (action, targetType, targetId, snapshotBefore = null, snapshotAfter = null) => {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');
    await logAudit({
      actorUid: req.user?.uid || 'UNKNOWN',
      actorRole: req.user?.role || 'unknown',
      action,
      targetType,
      targetId,
      snapshotBefore,
      snapshotAfter,
      ipAddress,
      userAgent
    });
  };
  next();
}

module.exports = { logAudit, auditMiddleware };
