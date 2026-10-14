import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Hash, ChevronRight, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // steps: 'methods' | 'email-input' | 'email-otp'
  const [step, setStep] = useState('methods');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  // Redirect already-logged-in users
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Check if returning from Google redirect
  useEffect(() => {
    let cancelled = false;
    const checkRedirect = async () => {
      try {
        if (!auth || typeof getRedirectResult !== 'function') return;
        const result = await getRedirectResult(auth);
        if (cancelled || !result?.user) return;
        toast.success('Welcome, ' + (result.user.displayName || result.user.email) + '!');
        navigate('/', { replace: true });
      } catch (err) {
        if (!cancelled && err?.code !== 'auth/no-auth-event') {
          setError(firebaseErrMsg(err?.code));
        }
      }
    };
    checkRedirect();
    return () => { cancelled = true; };
  }, [navigate]);

  // OTP countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Firebase error messages
  const firebaseErrMsg = (code) => {
    const m = {
      'auth/popup-blocked': 'Popup blocked. Redirecting to Google…',
      'auth/unauthorized-domain': 'Domain not authorized in Firebase. Please contact support.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/account-exists-with-different-credential': 'Account exists with a different sign-in method.',
    };
    return m[code] || 'Sign-in failed. Please try again.';
  };

  // ── GOOGLE ──
  const loginWithGoogle = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const res = await signInWithPopup(auth, provider);
      if (res?.user) {
        toast.success('Welcome, ' + (res.user.displayName || res.user.email) + '!');
        navigate('/', { replace: true });
      }
    } catch (popupErr) {
      if (
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        // User closed popup — do nothing
      } else if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/unauthorized-domain' ||
        popupErr.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        toast('Redirecting to Google…', { icon: '🔄' });
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          setError(firebaseErrMsg(redirectErr.code));
        }
      } else {
        setError(firebaseErrMsg(popupErr.code));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL OTP SEND ──
  const sendEmailOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/email-otp/send', { email });
      setStep('email-otp');
      setOtp('');
      setTimer(60);
      toast.success('OTP sent to ' + email);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL OTP VERIFY ──
  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/email-otp/verify', { email, code: otp });
      if (res.data?.token) {
        try { await signInWithCustomToken(auth, res.data.token); } catch {}
      }
      toast.success('Logged in successfully!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-brand-50 to-surface dark:from-brand-900/10 dark:to-surface-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 space-y-6"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 drop-shadow-xl">
            <img src="/logo.png" alt="Life Connect Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-brand-gradient">Life Connect</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 'methods' && 'Welcome! Choose how to sign in'}
            {step === 'email-input' && 'Enter your email address'}
            {step === 'email-otp' && 'Check your inbox for the OTP'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'methods' && (
            <motion.div key="methods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">

              {/* Google */}
              <button
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm disabled:opacity-60"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Email OTP */}
              <button
                onClick={() => { setError(''); setStep('email-input'); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                <Mail className="w-5 h-5 text-gray-500" />
                Continue with Email
              </button>

            </motion.div>
          )}

          {step === 'email-input' && (
            <motion.form key="email-input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={sendEmailOtp} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value.toLowerCase().trim())}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin inline mr-1" />Sending OTP…</> : <>Send OTP <ChevronRight size={18} className="inline" /></>}
              </button>
              <button type="button" onClick={() => { setStep('methods'); setError(''); }} className="w-full text-center text-sm text-gray-400 flex items-center justify-center gap-1 mt-2">
                <ArrowLeft size={16} /> Back to options
              </button>
            </motion.form>
          )}

          {step === 'email-otp' && (
            <motion.form key="email-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={verifyEmailOtp} className="space-y-4">
              <div>
                <label className="label">6-Digit OTP</label>
                <p className="text-xs text-gray-500 mb-2">Sent to <strong>{email}</strong></p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input text-center tracking-widest text-xl font-bold"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
                {loading ? <><Loader2 size={16} className="animate-spin inline mr-1" />Verifying…</> : <><Hash size={18} className="inline mr-1" />Verify OTP</>}
              </button>

              <div className="flex flex-col gap-2 mt-4 text-center">
                {timer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in <span className="text-red-500 font-bold">{timer}s</span>
                  </p>
                ) : (
                  <button type="button" onClick={sendEmailOtp} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                    Resend OTP
                  </button>
                )}
                <button type="button" onClick={() => { setStep('email-input'); setOtp(''); setTimer(0); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Change email
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 pt-2">
          By signing in you agree to our terms. We never store passwords.
        </p>
      </motion.div>
    </div>
  );
}
