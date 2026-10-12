import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Filter, Plus, X, Search } from 'lucide-react';
import DonorCard from '../components/DonorCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ReportModal';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS } from '../lib/constants';
import LocationSelect from '../components/LocationSelect';
import BloodGroupSelector from '../components/BloodGroupSelector';
import { Link } from 'react-router-dom';

const DONOR_SCHEMA = z.object({
  name:             z.string().min(2).max(40),
  phone:            z.string().regex(/^[6-9]\d{9}$/, 'Must be a 10-digit mobile number').optional().or(z.literal('')),
  bloodGroup:       z.enum(BLOOD_GROUPS),
  state:            z.string().min(1, 'State is required'),
  district:         z.string().min(1, 'District is required'),
  city:             z.string().min(2).max(80),
  age:              z.coerce.number().int().min(18).max(65),
  lastDonationDate: z.string().optional().nullable(),
  available:        z.boolean().default(true),
  consent:          z.literal(true, { errorMap: () => ({ message: 'You must consent.' }) }),
});

export default function DonorsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ bloodGroup: '', state: '', district: '', available: '' });
  const [page, setPage]             = useState(1);
  const [showForm, setShowForm]     = useState(false);
  const [reportTarget, setReport]   = useState(null);

  const qs = new URLSearchParams({ page, limit: 12 });
  if (search)             qs.set('search', search);
  if (filters.bloodGroup) qs.set('bloodGroup', filters.bloodGroup);
  if (filters.state)      qs.set('state', filters.state);
  if (filters.district)   qs.set('district', filters.district);
  if (filters.available)  qs.set('available', filters.available);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['donors', search, filters, page],
    queryFn: () => api.get(`/donors?${qs}`).then(r => r.data),
  });

  const { data: myDonor } = useQuery({
    queryKey: ['myDonor'],
    queryFn: () => api.get('/donors/me').then(r => r.data),
    enabled: !!user,
    retry: false,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(DONOR_SCHEMA),
    defaultValues: myDonor || { available: true, consent: false },
  });

  const upsertMutation = useMutation({
    mutationFn: (data) => api.post('/donors', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Donor profile saved!');
      qc.invalidateQueries({ queryKey: ['donors'] });
      qc.invalidateQueries({ queryKey: ['myDonor'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black">{t('donors')}</h1>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {myDonor ? t('updateProfile') : t('registerAsDonor')}
          </button>
        )}
        {!user && (
          <Link to="/auth" className="btn-primary py-2">
            <Plus size={18} /> {t('registerAsDonor')}
          </Link>
        )}
      </div>

      {/* Privacy Lock Notice Banner */}
      {!user ? (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <span className="w-5 h-5 rounded-full bg-amber-200/80 dark:bg-amber-800 flex items-center justify-center shrink-0">🔒</span>
            <span><strong>Privacy Protection Active:</strong> Donor phone numbers and exact locations are locked for guest visitors. <strong>Login to unlock</strong> all contact details.</span>
          </div>
          <Link to="/auth" state={{ from: '/donors' }} className="font-bold text-red-600 hover:text-red-700 underline shrink-0">
            Login to Unlock →
          </Link>
        </div>
      ) : (
        <div className="mb-5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <span className="w-5 h-5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">🔓</span>
          <span><strong>Access Unlocked:</strong> You are logged in. Verified donor phone numbers, direct calling, WhatsApp, and exact locations are available.</span>
        </div>
      )}

      {/* Register form */}
      {showForm && user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{myDonor ? t('updateProfile') : t('registerAsDonor')}</h2>
          <form onSubmit={handleSubmit(data => upsertMutation.mutate({ ...data, consent: true }))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('name')}</label>
              <input className="input" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">+91</span>
                <input
                  type="tel"
                  className="input pl-12"
                  placeholder="9876543210"
                  maxLength={10}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <BloodGroupSelector
                label={t('bloodGroup')}
                value={watch('bloodGroup')}
                onChange={v => setValue('bloodGroup', v, { shouldValidate: true })}
                required
                error={errors.bloodGroup?.message}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location Details</label>
              <div className="mt-1">
                <LocationSelect
                  state={register('state').value}
                  setState={s => { register('state').onChange({ target: { name: 'state', value: s } }); register('district').onChange({ target: { name: 'district', value: '' } }); }}
                  district={register('district').value}
                  setDistrict={d => register('district').onChange({ target: { name: 'district', value: d } })}
                  city={register('city').value}
                  setCity={c => register('city').onChange({ target: { name: 'city', value: c } })}
                />
              </div>
              {(errors.state || errors.district || errors.city) && <p className="text-xs text-red-500 mt-1">Please provide complete location details</p>}
            </div>
            <div>
              <label className="label">{t('age')}</label>
              <input type="number" className="input" {...register('age')} min={18} max={65} />
            </div>
            <div>
              <label className="label">{t('lastDonation')} (optional)</label>
              <input type="date" className="input" {...register('lastDonationDate')} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="available-chk" {...register('available')} className="w-5 h-5 rounded text-brand-500" />
              <label htmlFor="available-chk" className="text-sm font-medium">{t('available')}</label>
            </div>
            <div className="sm:col-span-2 flex items-start gap-3">
              <input type="checkbox" id="consent-chk" {...register('consent')} className="mt-1 w-5 h-5 rounded text-brand-500" />
              <label htmlFor="consent-chk" className="text-sm text-gray-600 dark:text-gray-300">{t('consentText')}</label>
            </div>
            {errors.consent && <p className="sm:col-span-2 text-xs text-red-500">{errors.consent.message}</p>}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving…' : t('save')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('cancel')}
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
            placeholder="Search donors by name or area..."
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
          <select className="input w-auto" value={filters.available} onChange={e => { setFilters(f => ({ ...f, available: e.target.value })); setPage(1); }}>
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Not Available</option>
          </select>
          {(search || filters.bloodGroup || filters.state || filters.district || filters.available) && (
            <button onClick={() => { setSearch(''); setFilters({ bloodGroup: '', state: '', district: '', available: '' }); setPage(1); }} className="btn-ghost py-2 text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
              <X size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState type="donors" title="Failed to load donors" message="Please try again." />
      ) : !data?.data?.length ? (
        <EmptyState type="donors" title={t('emptyDonors')} message="Register yourself as a donor to help others." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.data || []).map(donor => (
              <DonorCard key={donor._id} donor={donor} onReport={(id) => setReport({ id, type: 'Donor' })} />
            ))}
          </div>
          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4">← Prev</button>
              <span className="text-sm text-gray-500">{page} / {data.pages}</span>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-secondary py-2 px-4">Next →</button>
            </div>
          )}
        </>
      )}

      <ReportModal
        open={!!reportTarget}
        targetId={reportTarget?.id}
        targetType={reportTarget?.type}
        onClose={() => setReport(null)}
      />
    </div>
  );
}
