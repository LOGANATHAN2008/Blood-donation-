import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X, AlertTriangle, Info, Search } from 'lucide-react';
import MedicineCard from '../components/MedicineCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ReportModal';
import ImageUploader from '../components/ImageUploader';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import LocationSelect from '../components/LocationSelect';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const MIN_EXPIRY = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export default function MedicinePage() {
  const { t } = useLang();
  const { user, dbUser } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [reportTarget, setReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [image, setImage]       = useState(null);
  const [form, setForm] = useState({
    name: '', strength: '', quantity: '', expiryDate: '', state: '', district: '', city: '',
    contactPhone: '', pickupNotes: '',
    checkedSealed: false, checkedNotExpired: false, checkedNotControlled: false, checkedNotInjection: false,
  });

  const qs = new URLSearchParams({ page, limit: 12 });
  if (search)         qs.set('search', search);
  if (stateFilter)    qs.set('state', stateFilter);
  if (districtFilter) qs.set('district', districtFilter);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['medicines', search, stateFilter, districtFilter, page],
    queryFn: () => api.get(`/medicines?${qs}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/medicines', d).then(r => r.data),
    onSuccess: () => {
      toast.success('Medicine listed successfully!');
      qc.invalidateQueries({ queryKey: ['medicines'] });
      setShowForm(false);
      setImage(null);
      setForm({ name: '', strength: '', quantity: '', expiryDate: '', state: '', district: '', city: '', contactPhone: '', pickupNotes: '', checkedSealed: false, checkedNotExpired: false, checkedNotControlled: false, checkedNotInjection: false });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/medicines/${id}`),
    onSuccess: () => {
      toast.success('Deleted.');
      qc.invalidateQueries({ queryKey: ['medicines'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const allChecks = form.checkedSealed && form.checkedNotExpired && form.checkedNotControlled && form.checkedNotInjection;
    if (!allChecks) { toast.error('Please confirm all safety checkboxes.'); return; }
    if (!form.expiryDate) { toast.error('Expiry date is required.'); return; }
    if (!form.state || !form.district || !form.city) { toast.error('Please fill all location fields.'); return; }
    const payload = {
      ...form,
      imageUrl: image?.url || null,
      imagePublicId: image?.publicId || null,
      checkedSealed: true, checkedNotExpired: true, checkedNotControlled: true, checkedNotInjection: true,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black">💊 {t('medicine')}</h1>
        {user ? (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Share Medicine'}
          </button>
        ) : (
          <Link to="/auth" className="btn-primary py-2">Login to Share</Link>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3.5 text-sm text-amber-800 dark:text-amber-300">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>Medical Disclaimer:</strong> {t('disclaimer')} Always consult a pharmacist or doctor before taking any shared medicine.
        </div>
      </div>

      {/* Share form */}
      {showForm && user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">Share Medicine</h2>
          <p className="text-sm text-gray-500 mb-4">Only sealed, non-expired, non-narcotic medicines. No injections/IV fluids.</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('medicineName')}</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('strength')} (optional)</label>
              <input className="input" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} placeholder="e.g. 500mg, 10mg/5ml" />
            </div>
            <div>
              <label className="label">{t('quantity')}</label>
              <input className="input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 10 tablets" required />
            </div>
            <div>
              <label className="label">{t('expiryDate')}</label>
              <input type="date" className="input" min={MIN_EXPIRY} value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} required />
              <p className="text-xs text-amber-600 mt-1">Must be valid for at least 60 days.</p>
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
              <label className="label">{t('contactPhone')}</label>
              <input type="tel" inputMode="numeric" className="input" maxLength={10} value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" required />
            </div>
            <div>
              <label className="label">{t('pickupNotes')} (optional)</label>
              <input className="input" value={form.pickupNotes} onChange={e => setForm(f => ({ ...f, pickupNotes: e.target.value }))} placeholder="e.g. Pickup after 5pm" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('addPhoto')} (optional)</label>
              <ImageUploader value={image} onChange={setImage} />
            </div>

            {/* Safety checkboxes */}
            <div className="sm:col-span-2 space-y-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <AlertTriangle size={16} className="text-amber-500" />
                {t('safetyChecks')} (all required)
              </div>
              {[
                ['checkedSealed', 'checkedSealed'],
                ['checkedNotExpired', 'checkedNotExpired'],
                ['checkedNotControlled', 'checkedNotControlled'],
                ['checkedNotInjection', 'checkedNotInjection'],
              ].map(([key, labelKey]) => (
                <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded text-brand-500"
                    checked={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  />
                  {t(labelKey)}
                </label>
              ))}
            </div>

            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Listing…' : 'List Medicine for Sharing'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search & Location Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search medicines by name or salt (e.g. Paracetamol, Glycomet, Inhaler, Pan 40)..."
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
          <LocationSelect
            state={stateFilter}
            setState={s => { setStateFilter(s); setDistrictFilter(''); setPage(1); }}
            district={districtFilter}
            setDistrict={d => { setDistrictFilter(d); setPage(1); }}
            hideCity
          />
          {(search || stateFilter || districtFilter) && (
            <button
              onClick={() => { setSearch(''); setStateFilter(''); setDistrictFilter(''); setPage(1); }}
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
        <EmptyState type="medicines" title="Failed to load medicines" action={<button onClick={refetch} className="btn-primary py-2">Retry</button>} />
      ) : !data?.data?.length ? (
        <EmptyState 
          type="medicines" 
          title={t('emptyMedicines')} 
          message="Share an unused sealed medicine to help someone in need." 
          action={
            (search || stateFilter || districtFilter) ? (
              <button 
                onClick={() => { setSearch(''); setStateFilter(''); setDistrictFilter(''); setPage(1); }} 
                className="btn-secondary py-2 px-5 text-sm rounded-xl mt-2"
              >
                Clear Filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.data || []).map(m => (
              <MedicineCard
                key={m._id}
                medicine={m}
                isOwner={!!user && m.uid === user.uid}
                onReserve={() => qc.invalidateQueries({ queryKey: ['medicines'] })}
                onGiven={async () => { await api.post(`/medicines/${m._id}/give`); qc.invalidateQueries({ queryKey: ['medicines'] }); toast.success('Marked as given!'); }}
                onDelete={() => setDeleteTarget(m._id)}
                onReport={(id) => setReport({ id, type: 'Medicine' })}
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Medicine Post?"
        message="This will also remove the image from Cloudinary."
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
