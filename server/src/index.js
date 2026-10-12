require('dotenv').config();
const express     = require('express');
const http        = require('http');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const mongoose    = require('mongoose');

const socketService = require('./services/socket');
const { verifySocketToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { startRequestExpiryJob, startMedicineExpiryJob } = require('./jobs/cronJobs');

// Routes
const donorRoutes       = require('./routes/donors');
const requestRoutes     = require('./routes/requests');
const hospitalRoutes    = require('./routes/hospitals');
const medicineRoutes    = require('./routes/medicines');
const reportRoutes      = require('./routes/reports');
const userRoutes        = require('./routes/users');
const uploadRoutes      = require('./routes/uploads');
const adminRoutes       = require('./routes/admin');
const locationRoutes    = require('./routes/locations');
const authRoutes        = require('./routes/auth');
const campRoutes        = require('./routes/camps');
const donationRoutes    = require('./routes/donations');
const leaderboardRoutes = require('./routes/leaderboard');
const pushRoutes        = require('./routes/push');

const app    = express();
const server = http.createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.VERCEL || (typeof origin === 'string' && origin.endsWith('.vercel.app'))) {
      return cb(null, true);
    }
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ─── Global rate limit ───────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/donors',       donorRoutes);
app.use('/api/requests',     requestRoutes);
app.use('/api/hospitals',    hospitalRoutes);
app.use('/api/medicines',    medicineRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api',              userRoutes);
app.use('/api/uploads',      uploadRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/locations',    locationRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/camps',        campRoutes);
app.use('/api/donations',    donationRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/push',         pushRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = socketService.init(server, corsOptions);
io.use(verifySocketToken);

io.on('connection', (socket) => {
  // If donor is logged in, join their personal room so they receive match notifications
  if (socket.data?.user?.uid) {
    socket.join(`donor:${socket.data.user.uid}`);
  }
  socket.on('disconnect', () => {});
});

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
async function start() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri && mongoUri.includes('127.0.0.1')) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('🧪 Using MongoDB Memory Server:', mongoUri);
    }
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected');

    startRequestExpiryJob();
    startMedicineExpiryJob();
    console.log('✅ Cron jobs started');

    const PORT = process.env.PORT || 4000;
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
      server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

app.server = server;
module.exports = app;
module.exports.app = app;
module.exports.server = server;
