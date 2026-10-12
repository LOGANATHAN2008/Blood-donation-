import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { INDIA_DISTRICTS } from '../config/districts';

import api from '../lib/api';

export default function LeaderboardPage() {
  const { t } = useLang();
  const { user } = useAuth();

  const [timeRange, setTimeRange] = useState('allTime'); // 'allTime' | 'thisYear'
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          timeRange,
          limit: '50'
        });
        if (selectedState) params.append('state', selectedState);
        if (selectedDistrict) params.append('district', selectedDistrict);

        // Try via configured api client first, fallback to fetch
        try {
          const res = await api.get(`/leaderboard?${params.toString()}`);
          setLeaderboard(res.data?.data || []);
          return;
        } catch {
          // fallback to standard fetch with proxy
          const res = await fetch(`/api/leaderboard?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setLeaderboard(json.data || []);
            return;
          }
        }
        setLeaderboard([]);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeRange, selectedState, selectedDistrict]);

  const stateDistricts = selectedState && INDIA_DISTRICTS ? (INDIA_DISTRICTS[selectedState] || []) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
          🏆 Hall of Fame
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          {t('leaderboard')}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Honoring our verified life-savers who chose to inspire others. Anonymized and privacy-protected.
        </p>
      </div>

      {/* Opt-in Privacy Banner */}
      {user && !user.leaderboardOptIn && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div>
            <span className="font-bold">🔒 You are currently hidden from public rankings.</span>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Want your verified donations to appear here? Enable opt-in in your Settings.
            </p>
          </div>
          <Link
            to="/settings"
            className="px-3.5 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs whitespace-nowrap hover:bg-amber-700 transition"
          >
            Settings & Privacy
          </Link>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Time Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          <button
            onClick={() => setTimeRange('allTime')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              timeRange === 'allTime'
                ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('allTime')}
          </button>
          <button
            onClick={() => setTimeRange('thisYear')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              timeRange === 'thisYear'
                ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('thisYear')}
          </button>
        </div>

        {/* State / District Selects */}
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            className="py-1.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
          </select>

          {stateDistricts.length > 0 && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option value="">All Districts</option>
              {stateDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 p-6">
          <span className="text-4xl block mb-3">🛡️</span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {t('leaderboardEmpty')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {t('optInLeaderboardDesc')}
          </p>
          <Link
            to="/settings"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs shadow-md"
          >
            Opt In in Settings
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leaderboard.map((item, idx) => {
            const isTop3 = item.rank <= 3;
            const rankMedal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank || idx + 1}`;
            const name = typeof item.displayName === 'string' ? item.displayName : (typeof item.name === 'string' ? item.name : 'Anonymous Donor');
            const initial = name.charAt(0) || 'D';

            return (
              <div
                key={item.rank || idx}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isTop3
                    ? 'bg-gradient-to-r from-rose-50/60 to-white dark:from-rose-950/20 dark:to-gray-800/80 border-rose-300 dark:border-rose-900/50 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`text-base font-black w-8 text-center ${isTop3 ? 'text-2xl' : 'text-gray-400'}`}>
                    {rankMedal}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden flex-shrink-0">
                    {typeof item.photoUrl === 'string' && item.photoUrl ? (
                      <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                        {String(item.badgeLevel || 'Bronze')}
                      </span>
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {item.district ? `${item.district}, ${item.state || ''}` : item.state || 'India'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base md:text-lg font-black text-rose-600 dark:text-rose-400">
                    {String(item.count ?? 0)}
                  </span>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">
                    Donations
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
