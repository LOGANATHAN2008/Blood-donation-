import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import LocationSelect from '../LocationSelect';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function QuickSearchCard() {
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [bloodGroup, setBloodGroup] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

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
      className="glass-card p-4 md:p-6 rounded-3xl shadow-glass-lg border border-white/20 dark:border-white/5 relative z-30 mx-4 md:mx-auto max-w-4xl backdrop-blur-xl bg-white/60 dark:bg-surface-dark/80"
    >
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Blood Group Select */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Blood Group (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.slice(0, 4).map(bg => (
              <button
                key={bg}
                onClick={() => setBloodGroup(bg === bloodGroup ? '' : bg)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                  bg === bloodGroup 
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md' 
                    : 'bg-white dark:bg-brand-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                }`}
              >
                {bg}
              </button>
            ))}
            <select 
              className="px-3 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-brand-950 border border-gray-200 dark:border-gray-700 cursor-pointer focus:ring-2 focus:ring-brand-500"
              value={BLOOD_GROUPS.slice(4).includes(bloodGroup) ? bloodGroup : ''}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="">More...</option>
              {BLOOD_GROUPS.slice(4).map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Select */}
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
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
        <div className="w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto h-[46px] px-8 rounded-full brand-gradient text-white font-bold shadow-lg hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Search size={18} />
            Find Donors
          </button>
        </div>
      </div>
    </motion.div>
  );
}
