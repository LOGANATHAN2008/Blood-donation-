import React, { useState, useEffect, useRef } from 'react';
import { INDIA_STATES } from '../lib/indiaStates';
import api from '../lib/api';
import { Search, X, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global cache for districts per state to avoid network requests on re-render
const districtCache = new Map();

function LocationSelectComponent({ state, setState, district, setDistrict, city, setCity, hideCity, disableAutoLoad = false }) {
  const [districts, setDistricts] = useState(() => (state && districtCache.get(state)) || []);
  const [loading, setLoading] = useState(false);
  const [showStateOptions, setShowStateOptions] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  
  const stateRef = useRef(null);

  // Load last choice from localStorage if not provided (only if disableAutoLoad is false)
  useEffect(() => {
    if (disableAutoLoad) return;
    if (!state && !district && !city) {
      const savedState = localStorage.getItem('lastState');
      const savedDistrict = localStorage.getItem('lastDistrict');
      const savedCity = localStorage.getItem('lastCity');
      if (savedState) setState(savedState);
      if (savedDistrict) setDistrict(savedDistrict);
      if (savedCity && setCity) setCity(savedCity);
    }
  }, [disableAutoLoad]);

  // Save to localStorage when changed (only if disableAutoLoad is false)
  useEffect(() => {
    if (disableAutoLoad) return;
    if (state) localStorage.setItem('lastState', state);
    if (district) localStorage.setItem('lastDistrict', district);
    if (city) localStorage.setItem('lastCity', city);
  }, [state, district, city, disableAutoLoad]);

  useEffect(() => {
    if (!state) {
      setDistricts([]);
      if (district) setDistrict('');
      return;
    }

    if (districtCache.has(state)) {
      setDistricts(districtCache.get(state));
      return;
    }

    let isMounted = true;
    setLoading(true);
    api.get(`/locations/districts?state=${encodeURIComponent(state)}`)
      .then(r => {
        if (!isMounted) return;
        const list = r.data.data || [];
        districtCache.set(state, list);
        setDistricts(list);
      })
      .catch(() => {
        if (!isMounted) return;
        setDistricts(['Other']);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [state]); // Only re-run when state itself changes, NEVER on setDistrict reference change!

  // Click outside listener for state dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateRef.current && !stateRef.current.contains(event.target)) {
        setShowStateOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = INDIA_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  return (
    <div className="flex flex-col sm:flex-row gap-3 relative">
      
      {/* State Dropdown */}
      <div className="relative flex-1" ref={stateRef}>
        <div 
          className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer shadow-sm focus-within:ring-2 focus-within:ring-brand-500"
          onClick={() => setShowStateOptions(!showStateOptions)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin size={16} className="text-gray-400 shrink-0" />
            <span className={`text-sm truncate ${!state ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
              {state || 'Select State...'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {state && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setState(''); setDistrict(''); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showStateOptions ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <AnimatePresence>
          {showStateOptions && (
            <>
              {/* Mobile overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 sm:hidden"
                onClick={() => setShowStateOptions(false)}
              />
              
              {/* Dropdown / Bottom Sheet */}
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-[calc(100%+8px)] left-0 w-full sm:w-[300px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[350px]"
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3 sm:hidden" />
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Search state..." 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-y-auto p-1 scrollbar-thin flex-1">
                  {filteredStates.length > 0 ? (
                    filteredStates.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setState(s); setShowStateOptions(false); setStateSearch(''); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${state === s ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        {s}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No states found</div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <select
        className="px-3 py-2 sm:py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 shadow-sm"
        value={district || ''}
        onChange={(e) => setDistrict(e.target.value)}
        disabled={!state || loading}
      >
        <option value="" className="bg-white dark:bg-gray-800 text-gray-500">{loading ? 'Loading districts...' : 'Select District'}</option>
        {districts.map((d) => (
          <option key={d} value={d} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{d}</option>
        ))}
      </select>

      {!hideCity && (
        <input
          type="text"
          placeholder="City / Area"
          className="px-3 py-2 sm:py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
          value={city || ''}
          onChange={(e) => setCity(e.target.value)}
        />
      )}
    </div>
  );
}

const LocationSelect = React.memo(LocationSelectComponent);
export default LocationSelect;
