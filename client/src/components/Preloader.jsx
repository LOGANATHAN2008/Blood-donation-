import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../config/brand';

/**
 * Premium Preloader Component
 * Sequence: Logo reveal -> ECG Lines & Pulse -> Progress -> Shine -> Fly to Navbar (Shared Layout)
 */
export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading -> exiting

  useEffect(() => {
    // Simulate real loading signals
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase('exiting'), 400); // Small pause at 100%
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5; // increment
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Background Curtain: splits/slides away */}
      <motion.div
        className="fixed inset-0 z-[99998] bg-transparent pointer-events-none"
        exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
      />
      
      {/* Main Preloader Content */}
      <motion.div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center pointer-events-none"
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
      >
        <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
          
          {/* Radial Glow */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            exit={{ opacity: 0 }}
          />

          {/* Ripple Ring */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-brand-500/30 rounded-full"
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            exit={{ opacity: 0 }}
          />

          {/* SVG ECG Lines */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between px-8"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Left ECG */}
            <svg width="100" height="40" viewBox="0 0 100 40" className="opacity-50">
              <motion.path 
                d="M 0 20 L 30 20 L 40 5 L 50 35 L 60 20 L 100 20" 
                fill="none" 
                stroke={BRAND.colors.primary} 
                strokeWidth="2" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>
            {/* Right ECG */}
            <svg width="100" height="40" viewBox="0 0 100 40" className="opacity-50">
              <motion.path 
                d="M 100 20 L 70 20 L 60 5 L 50 35 L 40 20 L 0 20" 
                fill="none" 
                stroke={BRAND.colors.primary} 
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </motion.div>

          {/* Logo with bottom-to-top reveal mask and lub-dub scale */}
          <motion.div
            className="relative z-10 w-32 h-32 sm:w-40 sm:h-40"
            initial={{ scale: 0.92, clipPath: 'inset(100% 0 0 0)' }}
            animate={{ scale: [1, 1.05, 1], clipPath: 'inset(0% 0 0 0)' }}
            transition={{ 
              clipPath: { duration: 1, ease: [0.76, 0, 0.24, 1] },
              scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } 
            }}
          >
            <img 
              src="/brand/logo-512.webp" 
              alt={BRAND.fullName}
              className="w-full h-full object-contain drop-shadow-2xl relative"
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
            {/* Diagonal Shine Sweep */}
            <motion.div 
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 60%, transparent 80%)',
                maskImage: 'url(/brand/logo-512.webp)',
                WebkitMaskImage: 'url(/brand/logo-512.webp)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
              }}
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
          </motion.div>

          {/* Progress Bar & Text */}
          <motion.div 
            className="mt-12 flex flex-col items-center w-full px-8"
            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
          >
            <div className="flex justify-between w-full text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
              <span>{BRAND.name}</span>
              <span>{Math.min(progress, 100)}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </div>
            <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
              {BRAND.tagline}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
