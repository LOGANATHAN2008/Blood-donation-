import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';
import { BRAND } from '../../config/brand';

export default function InstallBanner() {
  const { t } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // 2. Check iOS Safari
    const ua = window.navigator.userAgent;
    const isAppleMobile = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isAppleMobile);

    // 3. Track visits: only show on 2nd visit or later
    const visits = Number(localStorage.getItem('lc-visits') || 0) + 1;
    localStorage.setItem('lc-visits', visits);

    // 4. Check 14-day dismissal
    const dismissedUntil = localStorage.getItem('lc-pwa-dismissed-until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      // Still within 14 day dismissal
      // But allow manual trigger
    } else if (visits >= 2) {
      setIsVisible(true);
    }

    // 5. Capture beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (visits >= 2 && (!dismissedUntil || Date.now() >= Number(dismissedUntil))) {
        setIsVisible(true);
      }
    };

    // 6. Listen for manual click trigger from footer or settings
    const handleManualTrigger = () => {
      if (isAppleMobile) {
        setShowIOSGuide(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') setIsVisible(false);
          setDeferredPrompt(null);
        });
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('lc:prompt-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('lc:prompt-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Dismiss for 14 days
    localStorage.setItem('lc-pwa-dismissed-until', Date.now() + 14 * 24 * 60 * 60 * 1000);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-16 md:top-auto md:bottom-6 left-4 right-4 md:left-auto md:right-28 md:max-w-sm z-50 p-3 md:p-3.5 rounded-2xl bg-gray-950/90 dark:bg-black/90 text-white backdrop-blur-2xl border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.35)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-rose-500 flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-red-600/30">
                🩸
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs leading-snug text-white truncate">
                  {t('installApp')}
                </h4>
                <p className="text-[11px] text-gray-300 line-clamp-1">
                  Offline access • 1-tap SOS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="py-1.5 px-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 uppercase tracking-wide"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs flex items-center justify-center transition"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Instruction Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-800"
            >
              <div className="text-3xl mb-2">📱</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                Install on iOS / Safari
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                To install {BRAND.fullName} to your home screen:
              </p>
              <ol className="text-xs text-left space-y-2 mb-6 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-600">1.</span>
                  <span>Tap the <strong>Share</strong> button (⎋) in Safari bottom bar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-600">2.</span>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-600">3.</span>
                  <span>Tap <strong>Add</strong> at top right corner</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
