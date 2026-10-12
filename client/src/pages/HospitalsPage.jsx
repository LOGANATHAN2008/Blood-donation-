import { useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X, MapPin, Search } from 'lucide-react';
import HospitalCard from '../components/HospitalCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ReportModal';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { HOSPITAL_TYPES } from '../lib/constants';
import LocationSelect from '../components/LocationSelect';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function HospitalsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters]   = useState({ search: '', state: '', district: '', type: '', is24x7: '' });
  const [searchInput, setSearchInput] = useState('');
  const [nearMe, setNearMe]     = useState(null);
  const [reportTarget, setReport] = useState(null);
  const [form, setForm] = useState({ name: '', type: '', state: '', district: '', address: '', phone: '', lat: '', lng: '', is24x7: false });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ['hospitals', filters, nearMe],
    queryFn: ({ pageParam = 1 }) => {
      const qs = new URLSearchParams({ page: pageParam, limit: 20 });
      if (filters.search)   qs.set('search', filters.search);
      if (filters.state)    qs.set('state', filters.state);
      if (filters.district) qs.set('district', filters.district);
      if (filters.type)     qs.set('type', filters.type);
      if (filters.is24x7)   qs.set('is24x7', filters.is24x7);
      if (nearMe) { qs.set('lat', nearMe.lat); qs.set('lng', nearMe.lng); }
      return api.get(`/hospitals?${qs}`).then(r => r.data);
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });

  const hospitals = data?.pages.flatMap(p => p.data) || [];

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/hospitals', {
      ...d,
      lat: d.lat ? parseFloat(d.lat) : null,
      lng: d.lng ? parseFloat(d.lng) : null,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Hospital submitted for verification!');
      qc.invalidateQueries({ queryKey: ['hospitals'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const getNearMe = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Showing hospitals near you');
      },
      () => toast.error('Location access denied')
    );
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, search: searchInput }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-black">🏥 {t('hospitals')}</h1>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={getNearMe} className="btn-secondary py-2 text-sm w-full">
            <MapPin size={16} /> {t('nearMe')}
          </button>
          {user ? (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 text-sm w-full">
              {showForm ? <X size={18} /> : <Plus size={18} />}
              Submit
            </button>
          ) : (
            <Link to="/auth" className="btn-primary py-2 text-sm w-full text-center">Login</Link>
          )}
        </div>
      </div>

      {/* eRaktKosh link */}
      <a
        href="https://eraktkosh.mohfw.gov.in/eraktkoshPortal/#/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
          <span>🩸</span>
          <span>Also check <strong>eRaktKosh</strong></span>
        </span>
        <span className="text-xs sm:text-sm text-red-600/80 dark:text-red-400/80 font-medium">
          — Government blood bank directory →
        </span>
      </a>

      {/* Submit form */}
      {showForm && user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Submit Hospital / Blood Bank</h2>
          <p className="text-sm text-gray-500 mb-4">Your submission will be reviewed by our team and shown with a "Verified" badge after approval.</p>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">{t('hospitalName')}</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('type')}</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                <option value="">Select…</option>
                {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location Details</label>
              <div className="mt-1">
                <LocationSelect
                  state={form.state}
                  setState={s => setForm(f => ({ ...f, state: s, district: '' }))}
                  district={form.district}
                  setDistrict={d => setForm(f => ({ ...f, district: d }))}
                  city={form.city}
                  setCity={c => setForm(f => ({ ...f, city: c }))}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('address')}</label>
              <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('phone')}</label>
              <input type="tel" className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="is24x7" checked={form.is24x7} onChange={e => setForm(f => ({ ...f, is24x7: e.target.checked }))} className="w-5 h-5 rounded text-brand-500" />
              <label htmlFor="is24x7" className="font-medium text-sm">{t('is24x7')}</label>
            </div>
            <div>
              <label className="label">Latitude (optional)</label>
              <input type="number" step="0.0001" min="8" max="14" className="input" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 11.0168" />
            </div>
            <div>
              <label className="label">Longitude (optional)</label>
              <input type="number" step="0.0001" min="76" max="80.5" className="input" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g. 76.9558" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : t('submitHospital')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Search hospitals by name..." 
            className="input pl-10 w-full"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <Search className="absolute left-3 top-[13px] text-gray-400" size={18} />
        </div>
        
        <div className="grid grid-cols-2 md:flex gap-2 w-full">
          <LocationSelect
            state={filters.state}
            setState={s => setFilters(f => ({ ...f, state: s, district: '' }))}
            district={filters.district}
            setDistrict={d => setFilters(f => ({ ...f, district: d }))}
            hideCity
          />
          <select className="input text-sm w-full md:w-auto" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input text-sm w-full col-span-2 md:col-span-1 md:w-auto" value={filters.is24x7} onChange={e => setFilters(f => ({ ...f, is24x7: e.target.value }))}>
            <option value="">All Hours</option>
            <option value="true">24×7 Only</option>
          </select>
          {nearMe && (
            <button onClick={() => setNearMe(null)} className="btn-ghost col-span-2 md:col-span-1 py-2 text-sm text-brand-500 w-full md:w-auto justify-center">
              <X size={16} /> Clear Location
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState type="hospitals" title="Failed to load hospitals" action={<button onClick={refetch} className="btn-primary py-2">Retry</button>} />
      ) : hospitals.length === 0 ? (
        <EmptyState 
          type="hospitals" 
          title={t('emptyHospitals')} 
          message="Submit a hospital to help the community." 
          action={
            (filters.state || filters.district || filters.search || filters.type || filters.is24x7) ? (
              <button 
                onClick={() => setFilters({ search: '', state: '', district: '', type: '', is24x7: '' })} 
                className="btn-secondary py-2 px-5 text-sm rounded-xl mt-2"
              >
                Clear Filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map(h => <HospitalCard key={h._id} hospital={h} onReport={(id) => setReport({ id, type: 'Hospital' })} />)}
          </div>
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="btn-secondary py-2 px-8"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      <ReportModal open={!!reportTarget} targetId={reportTarget?.id} targetType={reportTarget?.type} onClose={() => setReport(null)} />
    </div>
  );
}
