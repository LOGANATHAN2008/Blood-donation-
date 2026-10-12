import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import { useLang } from '../context/LangContext';

export default function QrVerifyPage() {
  const { token } = useParams();
  const { t } = useLang();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyToken() {
      try {
        setLoading(true);
        const res = await fetch(`/api/donors/verify/${token}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.error || 'Verification record not found or has been disabled by the donor.');
        }
      } catch (err) {
        setError('Network error while checking verification.');
      } finally {
        setLoading(false);
      }
    }

    if (token) verifyToken();
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl text-center">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🩸</span>
          <div className="text-left">
            <div className="text-sm font-black tracking-wide text-rose-600 dark:text-rose-500 uppercase">
              {BRAND.fullName}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              Official Donor Verification System
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-gray-500">Authenticating credential token...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center text-2xl mx-auto">
              ✕
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-xs mx-auto">
              {error}
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-block px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 transition"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Checkmark */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✓
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase mb-2">
                <span>🛡️</span>
                <span>{t('verifiedDonor')}</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {data.firstName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Active member since {data.memberSince ? new Date(data.memberSince).getFullYear() : 'recent'}
              </p>
            </div>

            {/* Blood Drop Box */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-around">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold block">
                  Blood Group
                </span>
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {data.bloodGroup}
                </span>
              </div>
              <div className="h-10 w-px bg-rose-200 dark:bg-rose-800" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold block">
                  Verified Donations
                </span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {data.totalDonations}
                </span>
              </div>
            </div>

            {/* Privacy Compliance Callout */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 text-left leading-relaxed">
              🔒 <strong className="text-gray-700 dark:text-gray-300">Privacy Protection:</strong> In accordance with healthcare privacy standards, exact donor address, phone numbers, date of birth, and identity records are never exposed on public verification pages.
            </div>

            <Link
              to="/"
              className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-md transition hover:brightness-105"
            >
              Explore {BRAND.fullName}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
