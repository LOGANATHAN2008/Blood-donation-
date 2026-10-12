import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { BLOOD_GROUPS } from '../../lib/constants';

const BloodDrop3D = lazy(() => import('./BloodDrop3D').catch(() => {
  // If 3D chunk fails to load, return a dummy component that throws to trigger suspense fallback or just renders null
  return { default: () => null };
}));

const COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export default function BloodDropVisual() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeGroupIndex, setActiveGroupIndex] = useState(4); // Start with O+
  
  const activeGroup = BLOOD_GROUPS[activeGroupIndex];
  const compatibleWith = COMPATIBILITY[activeGroup] || [];

  // Low-end device / WebGL availability check
  const isLowEnd = 
    (typeof navigator !== 'undefined' && (
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || 
      (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
      (navigator.connection && navigator.connection.saveData)
    ));

  // Fallback if 3D is disabled for perf/motion
  const forceFallback = isLowEnd || prefersReducedMotion;

  const cycleGroup = () => {
    setActiveGroupIndex(prev => (prev + 1) % BLOOD_GROUPS.length);
  };

  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  const fallbackDrop = (
    <motion.div 
      className="relative z-10 w-48 h-48 md:w-64 md:h-64 cursor-pointer"
      animate={{ y: prefersReducedMotion ? 0 : [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      style={{
        x: prefersReducedMotion ? 0 : -mousePosition.x,
        y: prefersReducedMotion ? 0 : -mousePosition.y,
      }}
      onClick={cycleGroup}
      role="button"
      aria-label={`Animated blood drop. Current group: ${activeGroup}`}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d64" />
              <stop offset="100%" stopColor="#A3122B" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path 
            d="M100 15 C 100 15 40 80 40 130 C 40 165 65 190 100 190 C 135 190 160 165 160 130 C 160 80 100 15 100 15 Z" 
            fill="url(#dropGrad)" 
            filter="url(#glow)"
          />
          <clipPath id="dropClip">
            <path d="M100 15 C 100 15 40 80 40 130 C 40 165 65 190 100 190 C 135 190 160 165 160 130 C 160 80 100 15 100 15 Z" />
          </clipPath>
          <g clipPath="url(#dropClip)">
            <motion.path
              d="M-50 120 Q 25 100 100 120 T 250 120 L 250 200 L -50 200 Z"
              fill="#7A0C1F"
              opacity="0.5"
              animate={{ x: prefersReducedMotion ? 0 : [-50, 0, -50] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
            <motion.path
              d="M-50 130 Q 25 150 100 130 T 250 130 L 250 200 L -50 200 Z"
              fill="#3B0610"
              opacity="0.3"
              animate={{ x: prefersReducedMotion ? 0 : [0, -50, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            />
          </g>
          <path 
            d="M65 100 C 65 60 90 35 100 25 C 90 40 75 70 75 100 C 75 115 80 125 90 135 C 75 120 65 110 65 100 Z" 
            fill="white" 
            opacity="0.3" 
          />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none translate-y-8">
         <div className="bg-white/90 backdrop-blur dark:bg-brand-900/90 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full font-black shadow-lg text-sm border border-brand-100 dark:border-brand-800">
            {activeGroup}
         </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-500/20 dark:bg-brand-600/20 blur-[100px] rounded-full" />

      {forceFallback ? (
        fallbackDrop
      ) : (
        <div className="relative z-10 w-[120%] h-[120%]">
          {/* We expand the wrapper so the 3D particles don't get cut off */}
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center scale-[0.833]">{fallbackDrop}</div>}>
            <BloodDrop3D activeGroup={activeGroup} onClick={cycleGroup} inView={isInView} />
          </Suspense>
        </div>
      )}

      {/* Orbiting Blood Group Chips */}
      {BLOOD_GROUPS.map((group, i) => {
        const angle = (i / BLOOD_GROUPS.length) * Math.PI * 2;
        const radius = 140;
        const isCompatible = compatibleWith.includes(group);
        
        return (
          <motion.div
            key={group}
            className="absolute z-20 pointer-events-none"
            initial={{ rotate: 0 }}
            animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            <motion.div
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold border transition-all duration-500
                ${isCompatible 
                  ? 'bg-brand-500 text-white border-brand-400 scale-110 shadow-lg shadow-brand-500/50' 
                  : 'bg-white/80 dark:bg-brand-900/80 backdrop-blur text-gray-400 dark:text-gray-500 border-gray-200 dark:border-brand-800 opacity-60'}
              `}
              style={{
                transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`,
              }}
              animate={{ rotate: prefersReducedMotion ? 0 : -360 }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            >
              {group}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
