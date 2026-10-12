import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Hash, Heart, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 'methods' | 'email-input' | 'email-otp' | 'phone-input' | 'phone-otp'
  const [step, setStep] = useState('methods'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  
  const [confirmResult, setConfirmResult] = useState(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    // Handle redirect result
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          toast.success('Google login successful');
        }
      } catch (err) {
        if (err.code === 'auth/account-exists-with-different-credential') {
          setError('An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.');
        } else {
          setError('Google Sign-In failed during redirect.');
        }
      }
    };
    handleRedirect();
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  // --- GOOGLE ---
  const loginWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        toast.success('Google login successful');
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-closed-by-user') {
          setLoading(false);
          return;
        }
        if (popupErr.code === 'auth/popup-blocked' || /mobile|android|iphone/i.test(navigator.userAgent)) {
          // Fallback to redirect on mobile or if blocked
          await signInWithRedirect(auth, provider);
        } else if (popupErr.code === 'auth/account-exists-with-different-credential') {
          setError('An account already exists with the same email. Sign in using a provider associated with this email address.');
        } else {
          throw popupErr;
        }
      }
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- EMAIL OTP ---
  const sendEmailOtp = async (e) => {
    e.preventDefault();
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
      toast.success(`OTP sent to ${email}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/email-otp/verify', { email, code: otp });
      await signInWithCustomToken(auth, res.data.token);
      toast.success('Logged in successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // --- PHONE OTP (MOCKED / COMING SOON) ---
  const sendPhoneOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    toast('Phone login is coming soon!', { icon: '🚧' });
  };

  const verifyPhoneOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await confirmResult.confirm(otp);
      toast.success('Logged in successfully');
    } catch (err) {
      setError('Invalid OTP code');
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
          <div className="w-20 h-20 mx-auto mb-4 drop-shadow-xl animate-pulse">
            <img src="/logo.png" alt="Life Connect Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-brand-gradient">Life Connect</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 'methods' && 'Welcome! Choose a way to login'}
            {step === 'email-input' && 'Enter your email address'}
            {step === 'email-otp' && 'Enter the OTP sent to your email'}
            {step === 'phone-input' && 'Enter your mobile number'}
            {step === 'phone-otp' && 'Enter the OTP sent via SMS'}
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
              <button onClick={loginWithGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
              
              <button onClick={() => { setError(''); setStep('email-input'); }} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm">
                <Mail className="w-5 h-5 text-gray-500" />
                Continue with Email
              </button>

              <button onClick={() => { setError(''); setStep('phone-input'); }} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm">
                <Phone className="w-5 h-5 text-gray-500" />
                Continue with Phone
              </button>
            </motion.div>
          )}

          {step === 'email-input' && (
            <motion.form key="email-input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={sendEmailOtp} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value.toLowerCase().trim())} autoFocus required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP'} <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => setStep('methods')} className="w-full text-center text-sm text-gray-400 flex items-center justify-center gap-1 mt-2">
                <ArrowLeft size={16} /> Back to options
              </button>
            </motion.form>
          )}

          {step === 'email-otp' && (
            <motion.form key="email-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={verifyEmailOtp} className="space-y-4">
              <div>
                <label className="label">6-Digit OTP</label>
                <input type="text" inputMode="numeric" maxLength={6} className="input text-center tracking-widest text-xl font-bold" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus required autoComplete="one-time-code" />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
                <Hash size={18} /> {loading ? 'Verifying…' : 'Verify OTP'}
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
                
                <button type="button" onClick={() => { setStep('email-input'); setOtp(''); setTimer(0); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Change email
                </button>
              </div>
            </motion.form>
          )}

          {step === 'phone-input' && (
            <motion.form key="phone-input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={sendPhoneOtp} className="space-y-4">
              <div>
                <label className="label">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                  <input type="tel" className="input pl-11" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} autoFocus required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading || phone.length !== 10}>
                {loading ? 'Sending OTP…' : 'Send SMS OTP'} <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => setStep('methods')} className="w-full text-center text-sm text-gray-400 flex items-center justify-center gap-1 mt-2">
                <ArrowLeft size={16} /> Back to options
              </button>
              <div id="recaptcha-container"></div>
            </motion.form>
          )}

          {step === 'phone-otp' && (
            <motion.form key="phone-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={verifyPhoneOtp} className="space-y-4">
              <div>
                <label className="label">6-Digit OTP</label>
                <input type="text" inputMode="numeric" maxLength={6} className="input text-center tracking-widest text-xl font-bold" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus required autoComplete="one-time-code" />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
                <Hash size={18} /> {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              
              <div className="flex flex-col gap-2 mt-4 text-center">
                {timer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in <span className="text-red-500 font-bold">{timer}s</span>
                  </p>
                ) : (
                  <button type="button" onClick={sendPhoneOtp} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                    Resend OTP
                  </button>
                )}
                
                <button type="button" onClick={() => { setStep('phone-input'); setOtp(''); setTimer(0); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Change phone number
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
