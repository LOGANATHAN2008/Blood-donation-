import { useState, useEffect } from 'react';
import { BADGES, getLevelDetails } from '../../config/badges';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import BadgeUnlockModal from './BadgeUnlockModal';
import { useSocket } from '../../context/SocketContext';

export default function BadgeShelf({ totalDonations = 0, userBadges = [] }) {
  const { t } = useLang();
  const socket = useSocket();
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState(null);

  const levelInfo = getLevelDetails(totalDonations);
  const earnedMap = new Map((userBadges || []).map(b => [b.id, b]));

  // Listen to live socket badge unlock
  useEffect(() => {
    if (!socket) return;
    const handleUnlock = (data) => {
      if (data?.badges && data.badges.length > 0) {
        setUnlockedBadgeModal(data.badges[0]);
      }
    };
    socket.on('badge:unlocked', handleUnlock);
    return () => socket.off('badge:unlocked', handleUnlock);
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Badge Unlock Modal with Confetti */}
      <BadgeUnlockModal
        badge={unlockedBadgeModal}
        onClose={() => setUnlockedBadgeModal(null)}
      />

      {/* Level Progress Banner */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-rose-950 text-white shadow-xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-white/10">{levelInfo.icon}</span>
            <div>
              <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider block">
                Current Level
              </span>
              <h3 className="text-xl md:text-2xl font-black">
                {levelInfo.level} Tier
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-rose-400">{totalDonations}</span>
            <span className="text-xs text-gray-400 block">Verified Donations</span>
          </div>
        </div>

        {/* Progress Bar */}
        {levelInfo.nextLevel ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Progress to {levelInfo.nextLevel} Tier</span>
              <span>{levelInfo.nextDonationsRequired} more donation(s) needed</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-bold">
            👑 Maximum Tier Reached! You are a legendary community savior.
          </div>
        )}
      </div>

      {/* Badges Shelf Grid */}
      <div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>🏅</span>
          <span>{t('badges')}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {BADGES.map((b) => {
            const isEarned = earnedMap.has(b.id);
            const earnedInfo = earnedMap.get(b.id);

            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  isEarned
                    ? 'bg-white dark:bg-gray-800 border-rose-300 dark:border-rose-900/60 shadow-md shadow-rose-500/10'
                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2.5 transition ${
                    isEarned
                      ? `bg-gradient-to-tr ${b.color} text-white shadow-md shadow-rose-500/20`
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 grayscale'
                  }`}
                >
                  {isEarned ? b.icon : '🔒'}
                </div>

                <div>
                  <h5 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                    {b.name}
                  </h5>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {b.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 w-full text-[10px]">
                  {isEarned ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">
                      {b.type === 'count' ? `${b.countRequired} donations` : 'Special Event'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
