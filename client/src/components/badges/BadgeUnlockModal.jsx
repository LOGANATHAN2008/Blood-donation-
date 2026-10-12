import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function BadgeUnlockModal({ badge, onClose }) {
  useEffect(() => {
    if (badge) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E11D48', '#FB7185', '#F59E0B', '#10B981', '#6366F1']
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 text-center shadow-2xl border border-rose-500/30"
        >
          <div className="text-5xl animate-bounce mb-3">🎉</div>
          <div className="text-4xl mb-2">{badge.icon || '🏅'}</div>
          <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
            New Badge Unlocked!
          </span>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mt-3 mb-1">
            {badge.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            {badge.description || 'Congratulations on saving lives and achieving this badge!'}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 hover:brightness-105 active:scale-95 transition"
          >
            Awesome! 🩸
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
