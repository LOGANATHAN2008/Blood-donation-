import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';

export default function LeaderboardTeaser() {
  const { t } = useLang();
  const [topHeroes, setTopHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeaser() {
      try {
        const res = await fetch('/api/leaderboard?limit=3');
        if (res.ok) {
          const json = await res.json();
          setTopHeroes(json.data || []);
        }
      } catch (err) {
        console.warn('Leaderboard teaser error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeaser();
  }, []);

  if (!loading && topHeroes.length === 0) return null;

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-rose-950/20 via-gray-900/10 to-transparent border border-rose-500/20 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {t('leaderboard')}
          </h3>
        </div>
        <Link
          to="/leaderboard"
          className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topHeroes.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-sm"
          >
            <span className="text-xl">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-gray-900 dark:text-white truncate">
                {item.displayName}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {item.district || item.state || 'Hero'}
              </div>
            </div>
            <div className="text-right">
              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                {item.count}
              </span>
              <span className="text-[9px] text-gray-400 block uppercase">Drops</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
