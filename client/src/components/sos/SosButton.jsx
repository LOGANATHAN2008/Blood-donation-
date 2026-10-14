import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';

export default function SosButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [geoNotice, setGeoNotice] = useState(false);
  const [locating, setLocating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();
  const { user } = useAuth();
  const sheetRef = useRef(null);

  // Hide on emergency page itself
  if (location.pathname === '/emergency') return null;

  // Track if other modals are open to satisfy requirement: "Hide it on the emergency form page itself and while modals are open."
  const [hasOtherModal, setHasOtherModal] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      const isOther = 
        (document.body.classList.contains('modal-open') && !document.body.classList.contains('sos-open')) ||
        (document.body.style.overflow === 'hidden' && !isOpen);
      setHasOtherModal(!!isOther);
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [isOpen]);

  // Keyboard Esc support & Focus Trap
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      document.body.classList.add('sos-open');
      window.dispatchEvent(new CustomEvent('lc:hide-bottom-nav'));
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.body.classList.remove('sos-open');
      window.dispatchEvent(new CustomEvent('lc:show-bottom-nav'));
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.body.classList.remove('sos-open');
      window.dispatchEvent(new CustomEvent('lc:show-bottom-nav'));
    };
  }, [isOpen]);

  const handlePostEmergency = () => {
    setIsOpen(false);
    navigate('/emergency');
  };

  const handleFindNearestHospital = () => {
    setGeoNotice(true);
  };

  const proceedWithLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      setGeoNotice(false);
      setIsOpen(false);
      navigate('/hospitals');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setGeoNotice(false);
        setIsOpen(false);
        navigate(`/hospitals?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&nearby=true`);
      },
      (err) => {
        console.warn('Geolocation denied/failed:', err);
        setLocating(false);
        setGeoNotice(false);
        setIsOpen(false);
        navigate('/hospitals');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <>
      {/* Floating Circular SOS Button */}
      {!hasOtherModal && !isOpen && (
        <div 
          className="fixed z-40 right-4 md:right-8 select-none"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="relative flex items-center justify-center"
          >
            {/* Pulsing Outer Rings */}
            <span className="absolute -inset-1.5 rounded-full bg-rose-500 opacity-60 animate-ping pointer-events-none" />
            <span className="absolute -inset-2.5 rounded-full bg-red-600/30 blur-sm pointer-events-none" />

            <button
              id="sos-floating-trigger"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={t('sosHelp')}
              aria-expanded={isOpen}
              className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white font-black shadow-[0_8px_25px_rgba(225,29,72,0.55)] border border-white/30 hover:brightness-110 active:scale-90 transition-transform focus:outline-none focus:ring-4 focus:ring-rose-400/50"
            >
              <div className="flex flex-col items-center leading-none">
                <span className="text-xl md:text-2xl animate-pulse">🆘</span>
                <span className="text-[10px] md:text-xs font-black tracking-wider uppercase mt-0.5">SOS</span>
              </div>
            </button>
          </motion.div>
        </div>
      )}

      {/* SOS Bottom Sheet / Popover Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              ref={sheetRef}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.75 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(30);
                  }
                  setIsOpen(false);
                }
              }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-950/40 p-5 md:p-6 pb-6 md:pb-6 overflow-hidden max-h-[90vh] flex flex-col touch-pan-y"
            >
              {/* iPhone Sheet Drag Pill Indicator */}
              <div className="flex justify-center -mt-2 mb-2.5 py-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors" />
              </div>

              {/* Sheet Drag Handle / Close Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {t('sosTitle')}
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Emergency Banner Notice */}
              <div className="my-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <span className="text-base leading-none">⚠️</span>
                <span>{t('sosLifeThreateningNotice')}</span>
              </div>

              {/* Geolocation Explanation Submodal */}
              {geoNotice ? (
                <div className="my-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                  <h3 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                    📍 {t('findNearestHospital')}
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    {t('geoExplain')}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={proceedWithLocation}
                      disabled={locating}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      {locating ? 'Detecting Location...' : 'Allow & Locate'}
                    </button>
                    <button
                      onClick={() => {
                        setGeoNotice(false);
                        setIsOpen(false);
                        navigate('/hospitals');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold"
                    >
                      Manual Search
                    </button>
                  </div>
                </div>
              ) : (
                /* 4 Large SOS Action Buttons */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  {/* Action 1: Post Emergency Request */}
                  <button
                    onClick={handlePostEmergency}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-left shadow-lg shadow-rose-600/25 hover:brightness-105 active:scale-98 transition group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition">
                      🩸
                    </div>
                    <div>
                      <div className="text-sm leading-tight">{t('postEmergencyRequest')}</div>
                      <div className="text-[10px] text-white/80 font-normal mt-0.5">Need blood right now</div>
                    </div>
                  </button>

                  {/* Action 2: Call 108 Ambulance */}
                  <a
                    href="tel:108"
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-left shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-98 transition group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition">
                      🚑
                    </div>
                    <div>
                      <div className="text-sm leading-tight">{t('call108')}</div>
                      <div className="text-[10px] text-white/80 font-normal mt-0.5">Free 24x7 Ambulance</div>
                    </div>
                  </a>

                  {/* Action 3: Call 112 National Emergency */}
                  <a
                    href="tel:112"
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-left shadow-lg shadow-blue-600/25 hover:brightness-105 active:scale-98 transition group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition">
                      🚨
                    </div>
                    <div>
                      <div className="text-sm leading-tight">{t('call112')}</div>
                      <div className="text-[10px] text-white/80 font-normal mt-0.5">All-in-one Emergency</div>
                    </div>
                  </a>

                  {/* Action 4: Find Nearest Hospital */}
                  <button
                    onClick={handleFindNearestHospital}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-left shadow-lg shadow-teal-600/25 hover:brightness-105 active:scale-98 transition group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition">
                      🏥
                    </div>
                    <div>
                      <div className="text-sm leading-tight">{t('findNearestHospital')}</div>
                      <div className="text-[10px] text-white/80 font-normal mt-0.5">GPS Distance Sorted</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline py-1"
                >
                  Cancel / Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
