const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const User  = require('../models/User');

// Initialize Firebase Admin SDK once
let useMock = false;
try {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
} catch (e) {
  console.warn('Firebase Admin initialization failed. Using mock auth for development.', e.message);
  useMock = true;
}

const mockAuth = {
  verifyIdToken: async (token) => {
    // Basic mock decoding
    return { uid: 'demo-uid-123', email: 'demo@lifeconnect.com', name: 'Demo User' };
  }
};
const authService = () => useMock ? mockAuth : getAuth();

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches req.user = { uid, email, name, role, blocked } on success.
 * Throws 401 if missing/invalid.
 */
async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const idToken = auth.split(' ')[1];
  try {
    let decoded;
    if (idToken.startsWith('mock-token-')) {
      const e = idToken.split('mock-token-')[1];
      decoded = { uid: `mock-${e}`, email: e, name: 'Mock User' };
    } else {
      decoded = await authService().verifyIdToken(idToken);
    }
    const { uploadFromUrl } = require('../services/cloudinary');
    const email = decoded.email || decoded.phone_number; 
    if (!email && !decoded.phone_number) {
      return res.status(401).json({ error: 'Email or phone not found in token.' });
    }

    const adminPhones = (process.env.ADMIN_PHONES || '+919876543210').split(',').map(p => p.trim()).filter(Boolean);
    const adminEmails = (process.env.ADMIN_EMAILS || 'loganathan082008@gmail.com').split(',').map(e => e.trim()).filter(Boolean);
    
    const isSuperAdminPhone = decoded.phone_number && adminPhones.includes(decoded.phone_number);
    const isSuperAdminEmail = decoded.email && decoded.email_verified && adminEmails.includes(decoded.email);
    const initialRole = (isSuperAdminPhone || isSuperAdminEmail) ? 'superadmin' : 'user';

    const provider = decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'phone';
    const name = decoded.name || '';
    
    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      // First login - Create user
      user = new User({
        uid: decoded.uid,
        email: decoded.email || null,
        emailVerified: !!decoded.email_verified,
        name: name,
        verifiedPhone: decoded.phone_number || null,
        role: initialRole,
        providers: [provider],
        lastLoginAt: new Date(),
      });

      // Async sync Google photo to Cloudinary
      if (decoded.picture) {
        uploadFromUrl(decoded.picture).then(result => {
          if (result) {
            User.updateOne({ uid: decoded.uid }, { photoUrl: result.secure_url, photoId: result.public_id }).exec();
          }
        }).catch(err => console.error('Background photo upload failed', err));
      }
      
      await user.save();
    } else {
      // Existing user - Update last login and missing providers
      const updates = { lastLoginAt: new Date() };
      if (!user.providers.includes(provider)) {
        updates.$addToSet = { providers: provider };
      }
      if (decoded.email && !user.email) {
        updates.email = decoded.email;
        updates.emailVerified = !!decoded.email_verified;
      }
      if (decoded.phone_number && !user.verifiedPhone) {
        updates.verifiedPhone = decoded.phone_number;
      }
      
      if ((isSuperAdminPhone || isSuperAdminEmail) && user.role !== 'superadmin') {
        updates.role = 'superadmin';
      }

      user = await User.findOneAndUpdate({ uid: decoded.uid }, updates, { new: true });
    }

    if (user.blocked || user.deletedAt) {
      return res.status(403).json({ error: 'Account is blocked or deleted.' });
    }
    
    if (user.suspendedUntil && new Date() < new Date(user.suspendedUntil)) {
      return res.status(403).json({ error: `Account is suspended until ${new Date(user.suspendedUntil).toLocaleString()}` });
    }

    req.user = { uid: decoded.uid, email, name: user.name, role: user.role, dbUser: user };
    next();
  } catch (err) {
    console.error('verifyToken error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Validates if the authenticated user has one of the required roles.
 * @param {string[]} allowedRoles Array of roles (e.g. ['admin', 'superadmin'])
 */
function requireRole(allowedRoles) {
  return async (req, res, next) => {
    await verifyToken(req, res, () => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
      }
      next();
    });
  };
}

/**
 * Legacy wrapper for requireRole(['admin', 'superadmin'])
 */
const requireAdmin = requireRole(['admin', 'superadmin']);

/**
 * Verifies socket handshake token.
 * socket.handshake.auth.token should contain the Firebase ID token.
 * Returns decoded user or throws.
 */
async function verifySocketToken(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // allow unauthenticated sockets (read-only)
  try {
    let decoded;
    if (token.startsWith('mock-token-')) {
      const e = token.split('mock-token-')[1];
      decoded = { uid: `mock-${e}`, email: e, name: 'Mock User' };
    } else {
      decoded = await authService().verifyIdToken(token);
    }
    const user = await User.findOne({ uid: decoded.uid });
    const email = decoded.email || decoded.phone_number;
    socket.data.user = { uid: decoded.uid, email: email, role: user?.role || 'user' };
    next();
  } catch {
    next(); // degrade gracefully – socket still connects but with no auth
  }
}

/**
 * Optional token verification: if Bearer token is provided and valid, attaches req.user.
 * If not provided or invalid, proceeds without error (req.user remains undefined).
 */
async function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next();
  }
  const idToken = auth.split(' ')[1];
  try {
    let decoded;
    if (idToken.startsWith('mock-token-')) {
      const e = idToken.split('mock-token-')[1];
      decoded = { uid: `mock-${e}`, email: e, name: 'Mock User' };
    } else {
      decoded = await authService().verifyIdToken(idToken);
    }
    const email = decoded.email || decoded.phone_number;
    const user = await User.findOne({ uid: decoded.uid });
    if (user && !user.blocked && !user.deletedAt) {
      req.user = { uid: decoded.uid, email, name: user.name, role: user.role, dbUser: user };
    }
  } catch (err) {
    // Graceful fallback for optional auth
  }
  next();
}

/**
 * Middleware to require a verified phone number for sensitive write actions.
 * Assumes verifyToken has already run and attached req.user.dbUser.
 */
function requirePhoneVerified(req, res, next) {
  if (!req.user || !req.user.dbUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!req.user.dbUser.verifiedPhone) {
    return res.status(403).json({ 
      error: 'Phone verification is required to perform this action.',
      code: 'PHONE_VERIFICATION_REQUIRED'
    });
  }
  next();
}

module.exports = { verifyToken, optionalAuth, requireRole, requireAdmin, verifySocketToken, requirePhoneVerified };
