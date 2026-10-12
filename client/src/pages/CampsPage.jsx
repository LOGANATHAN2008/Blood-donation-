import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CampCard from '../components/camps/CampCard';
import { INDIA_DISTRICTS } from '../config/districts';

export default function CampsPage() {
  const { t } = useLang();
  const { user, token } = useAuth();
  const socket = useSocket();

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thisWeek, setThisWeek] = useState(false);
  const [selectedState, setSelectedState] = useState(user?.state || '');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || '');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newCamp, setNewCamp] = useState({
    title: '',
    organizer: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: '',
    state: user?.state || 'Tamil Nadu',
    district: user?.district || 'Chennai',
    city: '',
    posterUrl: ''
  });

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (thisWeek) params.append('thisWeek', 'true');
      if (selectedState) params.append('state', selectedState);
      if (selectedDistrict) params.append('district', selectedDistrict);

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/camps?${params.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setCamps(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load camps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [thisWeek, selectedState, selectedDistrict, token]);

  // Realtime Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNewCamp = () => {
      fetchCamps();
    };
    socket.on('camp:approved', handleNewCamp);
    return () => socket.off('camp:approved', handleNewCamp);
  }, [socket]);

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please sign in to organize a camp.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCamp)
      });
      if (res.ok) {
        toast.success('Camp submitted! It will appear once approved by admin.');
        setShowSubmitModal(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit camp.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const stateDistricts = selectedState && INDIA_DISTRICTS ? (INDIA_DISTRICTS[selectedState] || []) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            ⛺ Community Drives
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            {t('upcomingCamps')}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover authorized blood camps near you. Add to your calendar or register interest.
          </p>
        </div>

        <button
          onClick={() => {
            if (!token) {
              toast.error('Please sign in to register a camp.');
              return;
            }
            setShowSubmitModal(true);
          }}
          className="self-start md:self-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95"
        >
          + Organize a Camp
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setThisWeek(!thisWeek)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              thisWeek
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            🗓️ {t('thisWeek')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {(selectedState || selectedDistrict || thisWeek) && (
            <button
              onClick={() => {
                setSelectedState('');
                setSelectedDistrict('');
                setThisWeek(false);
              }}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Camp Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : camps.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 p-6">
          <span className="text-4xl block mb-3">⛺</span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {t('noCampsFound')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            Try resetting your district filter or organize a camp with your local NGO / institution!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {camps.map((camp) => (
            <CampCard key={camp._id} camp={camp} onUpdated={fetchCamps} />
          ))}
        </div>
      )}

      {/* Organize Camp Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Register Blood Donation Camp
            </h3>

            <form onSubmit={handleCreateCamp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Camp Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Blood Donation Drive 2026"
                  value={newCamp.title}
                  onChange={(e) => setNewCamp({ ...newCamp, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Organizer Organization / Club *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lions Club / SRM Hospital"
                  value={newCamp.organizer}
                  onChange={(e) => setNewCamp({ ...newCamp, organizer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newCamp.date}
                    onChange={(e) => setNewCamp({ ...newCamp, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newCamp.startTime}
                    onChange={(e) => setNewCamp({ ...newCamp, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">End Time</label>
                  <input
                    type="text"
                    value={newCamp.endTime}
                    onChange={(e) => setNewCamp({ ...newCamp, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Full Venue Address *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Hall / College Auditorium, Street, Landmark"
                  value={newCamp.venue}
                  onChange={(e) => setNewCamp({ ...newCamp, venue: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newCamp.state}
                    onChange={(e) => setNewCamp({ ...newCamp, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={newCamp.district}
                    onChange={(e) => setNewCamp({ ...newCamp, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Poster Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newCamp.posterUrl}
                  onChange={(e) => setNewCamp({ ...newCamp, posterUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
