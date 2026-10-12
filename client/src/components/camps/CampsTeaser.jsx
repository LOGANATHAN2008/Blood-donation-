import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import CampCard from './CampCard';

export default function CampsTeaser() {
  const { t } = useLang();
  const { user, token } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeaser() {
      try {
        const params = new URLSearchParams({ limit: '3' });
        if (user?.state) params.append('state', user.state);
        if (user?.district) params.append('district', user.district);

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/camps?${params.toString()}`, { headers });
        if (res.ok) {
          const json = await res.json();
          setCamps(json.data || []);
        }
      } catch (err) {
        console.warn('Camps teaser failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTeaser();
  }, [user?.state, user?.district, token]);

  if (!loading && camps.length === 0) return null;

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Drives Near You
          </span>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            {t('upcomingCamps')}
          </h2>
        </div>
        <Link
          to="/campaigns"
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
        >
          View All ({camps.length}) →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {camps.map((camp) => (
          <CampCard key={camp._id} camp={camp} />
        ))}
      </div>
    </section>
  );
}
