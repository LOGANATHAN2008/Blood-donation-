import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function StatCounter({ value, label, icon: Icon, suffix = '' }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end   = value || 0;
    const diff  = end - start;
    if (diff === 0) return;

    const duration = 1200;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = end;
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-2 text-center card-lift">
      {Icon && (
        <div className="p-3 rounded-full brand-gradient text-white shadow-md">
          <Icon size={22} />
        </div>
      )}
      <div className="text-3xl font-black text-brand-gradient tabular-nums">
        {displayed.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
