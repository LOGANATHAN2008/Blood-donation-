let io;

function init(httpServer, corsOptions) {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/**
 * Emit an event to all connected clients.
 */
function broadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

/**
 * Emit a stat:update event with current live counts.
 * Requires MongoDB models to be available.
 */
async function emitStats() {
  const Donor        = require('../models/Donor');
  const BloodRequest = require('../models/BloodRequest');
  const Medicine     = require('../models/Medicine');
  const [donors, requests, medicines] = await Promise.all([
    Donor.countDocuments({ available: true, hidden: false }),
    BloodRequest.countDocuments({ status: 'Active', hidden: false }),
    Medicine.countDocuments({ status: 'Available', hidden: false }),
  ]);
  broadcast('stats:update', { donors, requests, medicines });
}

module.exports = { init, getIO, broadcast, emitStats };
