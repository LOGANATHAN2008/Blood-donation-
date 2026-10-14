import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Droplets, Hospital, Pill, User } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate } from 'framer-motion';

const TABS = [
  { href: '/',          icon: Home,      key: 'home' },
  { href: '/requests',  icon: Droplets,  key: 'request' },
  { href: '/hospitals', icon: Hospital,  key: 'hospitals' },
  { href: '/profile',   icon: User,      key: 'profile' },
];

export default function BottomTabBar() {
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  
  const activeIndex = TABS.findIndex(t => 
    location.pathname === t.href || (t.href !== '/' && location.pathname.startsWith(t.href))
  );
  const currentIdx = activeIndex === -1 ? 0 : activeIndex;

  const dragX = useMotionValue(0);
  const springConfig = { stiffness: 450, damping: 28, mass: 0.8 };
  const animatedX = useSpring(dragX, springConfig);
  
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth ? (containerWidth - 12) / TABS.length : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const isEmergency = location.pathname === '/emergency';

  useEffect(() => {
    const checkModal = () => {
      const hasModalClass = 
        document.body.classList.contains('modal-open') ||
        document.body.classList.contains('sos-open');
      const isOverflowHidden = document.body.style.overflow === 'hidden';
      setIsModalOpen(hasModalClass || isOverflowHidden);
    };

    checkModal();

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    const handleHide = () => setIsModalOpen(true);
    const handleShow = () => setIsModalOpen(false);
    window.addEventListener('lc:hide-bottom-nav', handleHide);
    window.addEventListener('lc:show-bottom-nav', handleShow);

    return () => {
      observer.disconnect();
      window.removeEventListener('lc:hide-bottom-nav', handleHide);
      window.removeEventListener('lc:show-bottom-nav', handleShow);
    };
  }, []);

  useEffect(() => {
    if (navRef.current) {
      setContainerWidth(navRef.current.offsetWidth);
      const handleResize = () => setContainerWidth(navRef.current.offsetWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (tabWidth) {
      animate(dragX, currentIdx * tabWidth, { type: 'spring', ...springConfig });
    }
  }, [currentIdx, tabWidth, dragX]);

  // Derived transform for the liquid stretch effect
  const remainder = useTransform(animatedX, x => {
    if (!tabWidth) return 0;
    const center = Math.round(x / tabWidth) * tabWidth;
    return x - center;
  });

  // Elastic stretch: expands horizontally and squishes vertically slightly during transit
  const scaleX = useTransform(remainder, [-tabWidth / 2, 0, tabWidth / 2], [1.35, 1, 1.35]);
  const scaleY = useTransform(remainder, [-tabWidth / 2, 0, tabWidth / 2], [0.85, 1, 0.85]);
  const indicatorX = useTransform(animatedX, x => x + 14);

  const handleDragEnd = (e, info) => {
    if (!tabWidth) return;
    const currentBaseX = currentIdx * tabWidth;
    // Add a velocity multiplier to predict the snap destination
    const projectedX = currentBaseX + info.offset.x + info.velocity.x * 0.15;
    
    let nextIdx = Math.round(projectedX / tabWidth);
    nextIdx = Math.max(0, Math.min(nextIdx, TABS.length - 1));
    
    if (nextIdx !== currentIdx) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
      navigate(TABS[nextIdx].href);
    } else {
      animate(dragX, currentBaseX, { type: 'spring', ...springConfig });
    }
  };

  const handleDrag = (e, info) => {
    const currentBaseX = currentIdx * tabWidth;
    const newX = currentBaseX + info.offset.x;
    // Bound the drag within the nav bar to prevent dragging out of bounds
    const boundedX = Math.max(-tabWidth / 3, Math.min(newX, (TABS.length - 1 + 0.33) * tabWidth));
    dragX.set(boundedX);
  };

  const shouldShow = !isEmergency && !isModalOpen;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.nav 
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="md:hidden fixed left-4 right-4 z-40 touch-none bottom-tab-bar" 
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          aria-label="Bottom navigation"
        >
          {/* Outer iOS Glass Pill */}
          <motion.div 
            ref={navRef}
            onPan={handleDrag}
            onPanEnd={handleDragEnd}
            className="relative grid grid-cols-4 items-center p-1.5 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.16)] bg-white/80 dark:bg-slate-900/85 backdrop-blur-3xl border border-white/40 dark:border-white/10"
            style={{
              WebkitBackdropFilter: 'blur(32px) saturate(200%)'
            }}
          >
            {/* Liquid Glass Active Indicator */}
            {tabWidth > 0 && (
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 dark:border-brand-400/30"
                style={{
                  width: tabWidth - 16, // 8px padding on each side
                  x: indicatorX, 
                  scaleX,
                  scaleY,
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5)',
                  transformOrigin: 'center center',
                  zIndex: 0
                }}
              />
            )}

            {/* Tab Items */}
            {TABS.map(({ href, icon: Icon, key }, idx) => {
              const active = currentIdx === idx;
              return (
                <div
                  key={href}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
                    navigate(href);
                  }}
                  className="relative z-10 flex flex-col items-center justify-center w-full h-[52px] cursor-pointer"
                >
                  <Icon 
                    size={24} 
                    className={`mb-1 transition-all duration-300 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400/80'}`} 
                    strokeWidth={active ? 2.5 : 2} 
                  />
                  <span className={`text-[10px] leading-none font-medium transition-colors duration-300 w-full text-center truncate px-0.5 ${active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400/80'}`}>
                    {t(key)}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
