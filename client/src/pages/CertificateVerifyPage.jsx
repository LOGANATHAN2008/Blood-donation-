import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export default function CertificateVerifyPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyCert() {
      try {
        setLoading(true);
        const res = await fetch(`/api/donations/verify-cert/${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          setError('Certificate not found or unverified.');
        }
      } catch (err) {
        setError('Network error validating certificate.');
      } finally {
        setLoading(false);
      }
    }

    if (id) verifyCert();
  }, [id]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">📜</span>
          <div className="text-left">
            <div className="text-sm font-black text-rose-600 dark:text-rose-500 uppercase">
              {BRAND.fullName}
            </div>
            <div className="text-[11px] text-gray-500">
              Certificate Authenticity Registry
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-gray-500">Checking official certificate registry...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center text-2xl mx-auto">
              ✕
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invalid Certificate</h2>
            <p className="text-xs text-red-600 max-w-xs mx-auto">{error}</p>
            <div className="pt-2">
              <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                Go to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase mb-2">
                <span>🛡️</span>
                <span>Officially Verified Certificate</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {data.firstName}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Certificate ID: {data.certificateId}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Donation Date</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {new Date(data.date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Blood Group</span>
                <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                  {data.bloodGroup} ({data.units || 1} Unit)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-500 text-left">
              🔒 <strong>Authenticity confirmed:</strong> This donation was validated by medical coordinators and registered in the Life Connect donation database.
            </div>

            <Link
              to="/"
              className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-md"
            >
              Explore {BRAND.fullName}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
