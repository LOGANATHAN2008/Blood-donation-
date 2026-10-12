import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import HospitalCard from '../HospitalCard';

export default function NearbyHospitalsTeaser() {
  const { t } = useLang();
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNearby() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: '3' });
        if (user?.district) params.append('district', user.district);
        if (user?.state) params.append('state', user.state);

        const res = await fetch(`/api/hospitals?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setHospitals(json.data || []);
        }
      } catch (err) {
        console.warn('Failed to load hospitals teaser:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNearby();
  }, [user?.district, user?.state]);

  if (!loading && hospitals.length === 0) return null;

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Emergency Facilities
          </span>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            {t('nearbyHospitals')}
          </h2>
        </div>
        <Link
          to="/hospitals"
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
        >
          View All Hospitals →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hospitals.map((h) => (
          <HospitalCard key={h._id} hospital={h} />
        ))}
      </div>
    </section>
  );
}
