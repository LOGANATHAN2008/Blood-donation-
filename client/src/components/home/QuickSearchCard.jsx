import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Navigation, Loader2 } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import LocationSelect from '../LocationSelect';
import api from '../../lib/api';
import toast from 'react-hot-toast';

import { detectLiveLocation } from '../../lib/liveLocation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function QuickSearchCard() {
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [bloodGroup, setBloodGroup] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [locating, setLocating] = useState(false);

  // Remember last choices
  useEffect(() => {
    const saved = localStorage.getItem('lifeconnect_last_search');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bg) setBloodGroup(parsed.bg);
        if (parsed.st) setState(parsed.st);
        if (parsed.dt) setDistrict(parsed.dt);
      } catch (e) {}
    }
  }, []);

  const handleLiveLocation = async () => {
    setLocating(true);
    const toastId = toast.loading('Detecting your live location...');

    try {
      const loc = await detectLiveLocation();
      if (loc.state) {
        setState(loc.state);
      }
      if (loc.district) {
        setDistrict(loc.district);
      }
      
      const locStr = [loc.district, loc.state].filter(Boolean).join(', ');
      if (locStr) {
        toast.success(`📍 Live Location: ${locStr}`, { id: toastId });
        localStorage.setItem('lifeconnect_last_search', JSON.stringify({ 
          bg: bloodGroup, 
          st: loc.state, 
          dt: loc.district 
        }));
      } else {
        toast.error('Could not detect district. Please select from dropdown.', { id: toastId });
      }
    } catch (err) {
      console.error('Location error:', err);
      toast.error(err.message || 'Could not detect live location. Please select manually.', { id: toastId });
    } finally {
      setLocating(false);
    }
  };

  const handleSearch = () => {
    localStorage.setItem('lifeconnect_last_search', JSON.stringify({ bg: bloodGroup, st: state, dt: district }));
    const params = new URLSearchParams();
    if (bloodGroup) params.set('bloodGroup', bloodGroup);
    if (district) params.set('district', district);
    navigate(`/donors?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-glass-lg border border-white/40 dark:border-white/10 mx-auto w-full max-w-4xl backdrop-blur-xl bg-white/90 dark:bg-surface-dark/95"
    >
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Blood Group Select */}
        <div className="w-full md:w-5/12">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Blood Group (Optional)
          </label>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {BLOOD_GROUPS.map(bg => (
              <button
                key={bg}
                type="button"
                onClick={() => setBloodGroup(bg === bloodGroup ? '' : bg)}
                className={`py-1.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center ${
                  bg === bloodGroup 
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md scale-105' 
                    : 'bg-white dark:bg-brand-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Location Select */}
        <div className="w-full md:w-5/12">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Location
            </label>
            <button
              type="button"
              onClick={handleLiveLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 px-2.5 py-1 rounded-full transition-all border border-brand-200 dark:border-brand-800/60 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Use current GPS live location"
            >
              {locating ? (
                <>
                  <Loader2 size={13} className="animate-spin text-brand-600 dark:text-brand-400" />
                  <span>Detecting GPS...</span>
                </>
              ) : (
                <>
                  <Navigation size={13} className="text-brand-600 dark:text-brand-400 fill-brand-600/20" />
                  <span>Use Live Location</span>
                </>
              )}
            </button>
          </div>
          <LocationSelect
            state={state}
            setState={setState}
            district={district}
            setDistrict={setDistrict}
            city=""
            setCity={() => {}}
            hideCity={true}
          />
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto mt-1 md:mt-0">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto h-[44px] sm:h-[46px] px-6 sm:px-8 rounded-xl sm:rounded-full brand-gradient text-white font-bold shadow-lg hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
          >
            <Search size={18} />
            Find Donors
          </button>
        </div>
      </div>
    </motion.div>
  );
}
