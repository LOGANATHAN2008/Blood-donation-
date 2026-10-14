import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X, Filter, Search } from 'lucide-react';
import RequestCard from '../components/RequestCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ReportModal';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, URGENCY_LEVELS } from '../lib/constants';
import LocationSelect from '../components/LocationSelect';
import BloodGroupSelector from '../components/BloodGroupSelector';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function getMinDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString().slice(0, 16);
}

export default function RequestsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState({ bloodGroup: '', state: '', district: '', urgency: '' });
  const [page, setPage]         = useState(1);
  const [reportTarget, setReport] = useState(null);
  const [form, setForm] = useState({
    patientName: '', bloodGroup: '', units: 1, hospital: '', state: '', district: '', city: '',
    urgency: 'Normal', neededBy: '', contactPhone: '', note: '',
  });

  const qs = new URLSearchParams({ page, limit: 12 });
  if (search)             qs.set('search', search);
  if (filters.bloodGroup) qs.set('bloodGroup', filters.bloodGroup);
  if (filters.state)      qs.set('state', filters.state);
  if (filters.district)   qs.set('district', filters.district);
  if (filters.urgency)    qs.set('urgency', filters.urgency);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['requests', search, filters, page],
    queryFn: () => api.get(`/requests?${qs}`).then(r => r.data),
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/requests', { ...data, units: Number(data.units), neededBy: new Date(data.neededBy).toISOString() }).then(r => r.data),
    onSuccess: (result) => {
      toast.success('Blood request posted!');
      qc.invalidateQueries({ queryKey: ['requests'] });
      setShowForm(false);
      setForm({ patientName: '', bloodGroup: '', units: 1, hospital: '', state: '', district: '', city: '', urgency: 'Normal', neededBy: '', contactPhone: '', note: '' });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientName || !form.bloodGroup || !form.hospital || !form.state || !form.district || !form.city || !form.neededBy || !form.contactPhone) {
      toast.error('Please fill all required fields.');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black">🩸 {t('request')}</h1>
        {user ? (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Post a Request'}
          </button>
        ) : (
          <Link to="/auth" className="btn-primary py-2">Login to Post</Link>
        )}
      </div>

      {/* Create form */}
      {showForm && user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Blood Request Details</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('patientName')}</label>
              <input className="input" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} required />
            </div>
            <div className="sm:col-span-2">
              <BloodGroupSelector
                label={t('bloodGroup')}
                value={form.bloodGroup}
                onChange={v => setForm(f => ({ ...f, bloodGroup: v }))}
                required
              />
            </div>
            <div>
              <label className="label">{t('units')} (1–10)</label>
              <input type="number" className="input" min={1} max={10} value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('urgency')}</label>
              <select className="input" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                {URGENCY_LEVELS.map(u => <option key={u} value={u}>{t(u)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('hospital')}</label>
              <input className="input" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} required />
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
            <div>
              <label className="label">{t('neededBy')}</label>
              <input type="datetime-local" className="input" value={form.neededBy} min={getMinDateTime()} onChange={e => setForm(f => ({ ...f, neededBy: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('contactPhone')}</label>
              <input type="tel" inputMode="numeric" className="input" maxLength={10} value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('note')} (optional)</label>
              <textarea className="input resize-none" rows={2} maxLength={500} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Posting…' : t('submitRequest')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search blood requests by patient, hospital, or city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10 pr-9 w-full bg-white/90 dark:bg-gray-800/90 shadow-sm"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto" value={filters.bloodGroup} onChange={e => { setFilters(f => ({ ...f, bloodGroup: e.target.value })); setPage(1); }}>
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <LocationSelect
            state={filters.state}
            setState={s => { setFilters(f => ({ ...f, state: s, district: '' })); setPage(1); }}
            district={filters.district}
            setDistrict={d => { setFilters(f => ({ ...f, district: d })); setPage(1); }}
            hideCity
          />
          <select className="input w-auto" value={filters.urgency} onChange={e => { setFilters(f => ({ ...f, urgency: e.target.value })); setPage(1); }}>
            <option value="">All Urgency</option>
            {URGENCY_LEVELS.map(u => <option key={u} value={u}>{t(u)}</option>)}
          </select>
          {(search || filters.bloodGroup || filters.state || filters.district || filters.urgency) && (
            <button
              onClick={() => { setSearch(''); setFilters({ bloodGroup: '', state: '', district: '', urgency: '' }); setPage(1); }}
              className="btn-ghost py-2 text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <X size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState type="requests" title="Failed to load requests" action={<button onClick={refetch} className="btn-primary py-2">Retry</button>} />
      ) : !data?.data?.length ? (
        <EmptyState type="requests" title={t('emptyRequests')} message="Post a blood request and we'll help find matching donors." />
      ) : (
        <>
          <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.data || []).map(r => (
              <RequestCard
                key={r._id}
                request={r}
                showActions
                onStatusChange={() => qc.invalidateQueries({ queryKey: ['requests'] })}
                onReport={(id) => setReport({ id, type: 'BloodRequest' })}
              />
            ))}
          </div>
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4">← Prev</button>
              <span className="text-sm text-gray-500">{page} / {data.pages}</span>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-secondary py-2 px-4">Next →</button>
            </div>
          )}
        </>
      )}

      <ReportModal open={!!reportTarget} targetId={reportTarget?.id} targetType={reportTarget?.type} onClose={() => setReport(null)} />
    </div>
  );
}
