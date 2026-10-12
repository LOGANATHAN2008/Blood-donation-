import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { Navigate, Link } from 'react-router-dom';
import { User, Heart, Pill, Droplets, Settings, LogOut, Trash2, Moon, Sun, Globe } from 'lucide-react';
import RequestCard from '../components/RequestCard';
import MedicineCard from '../components/MedicineCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, dbUser, refreshDbUser, logout } = useAuth();
  const { t, lang, switchLang }          = useLang();
  const { dark, toggle }                 = useTheme();
  const qc = useQueryClient();
  const [tab, setTab]                    = useState('donor');
  const [editingName, setEditingName]    = useState(false);
  const [newName, setNewName]            = useState('');
  const [showDeleteAccount, setDeleteAccount] = useState(false);
  const [langOpen, setLangOpen]          = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
  };

  const { data: myDonor } = useQuery({
    queryKey: ['myDonor'],
    queryFn: () => api.get('/donors/me').then(r => r.data),
    retry: false,
    enabled: !!user,
  });

  const { data: myRequests } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => api.get('/requests/mine').then(r => r.data),
    enabled: !!user,
  });

  const { data: myMedicines } = useQuery({
    queryKey: ['myMedicines'],
    queryFn: () => api.get('/medicines/mine').then(r => r.data),
    enabled: !!user,
  });

  const updateNameMutation = useMutation({
    mutationFn: (name) => api.patch('/me', { name }),
    onSuccess: () => { refreshDbUser(); setEditingName(false); toast.success('Name updated!'); },
    onError: (err) => toast.error(err.message),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/me'),
    onSuccess: async () => {
      await logout();
      toast.success('Account deleted.');
    },
    onError: (err) => toast.error(err.message),
  });

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white text-2xl font-black shadow-md">
            {(dbUser?.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  className="input py-1.5 text-sm flex-1"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={40}
                  autoFocus
                />
                <button onClick={() => updateNameMutation.mutate(newName)} className="btn-primary py-1.5 text-sm" disabled={updateNameMutation.isPending}>
                  {updateNameMutation.isPending ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)} className="btn-ghost py-1.5 text-sm">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">{dbUser?.name || 'User'}</h1>
                <button onClick={() => { setNewName(dbUser?.name || ''); setEditingName(true); }} className="text-xs text-brand-500 hover:underline">Edit</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
              <span>{user.email}</span>
              {(dbUser?.phone || dbUser?.verifiedPhone) && (
                <>
                  <span>&bull;</span>
                  <span>{((dbUser.phone || dbUser.verifiedPhone).startsWith('+91') ? '' : '+91 ') + (dbUser.phone || dbUser.verifiedPhone)}</span>
                </>
              )}
            </div>
            {dbUser?.role === 'admin' && (
              <span className="inline-block mt-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Admin</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {[
          { key: 'donor', label: 'Donor Profile', icon: Heart },
          { key: 'requests', label: 'My Requests', icon: Droplets },
          { key: 'medicines', label: 'My Medicines', icon: Pill },
          { key: 'settings', label: 'Settings', icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              tab === key ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab contents */}
      {tab === 'donor' && (
        <div>
          {myDonor ? (
            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Your Donor Profile</h2>
                <Link to="/donors" className="text-sm text-brand-500 hover:underline">Edit on Donors page</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Blood Group:</span> <strong>{myDonor.bloodGroup}</strong></div>
                <div><span className="text-gray-500">District:</span> {myDonor.district}</div>
                <div><span className="text-gray-500">City:</span> {myDonor.city}</div>
                <div><span className="text-gray-500">Age:</span> {myDonor.age}</div>
                <div><span className="text-gray-500">Available:</span> {myDonor.available ? '✅ Yes' : '❌ No'}</div>
                <div><span className="text-gray-500">Email:</span> {myDonor.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">You haven't registered as a donor yet.</p>
              <Link to="/donors" className="btn-primary py-2">Register as Donor</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-4">
          {!myRequests ? (
            <CardSkeleton />
          ) : !myRequests.length ? (
            <p className="text-center text-gray-500 py-8">No blood requests yet. <Link to="/requests" className="text-brand-500 hover:underline">Post one →</Link></p>
          ) : (
            myRequests.map(r => (
              <RequestCard
                key={r._id}
                request={r}
                showActions
                onStatusChange={() => qc.invalidateQueries({ queryKey: ['myRequests'] })}
              />
            ))
          )}
        </div>
      )}

      {tab === 'medicines' && (
        <div className="space-y-4">
          {!myMedicines ? (
            <CardSkeleton />
          ) : !myMedicines.length ? (
            <p className="text-center text-gray-500 py-8">No medicines shared yet. <Link to="/medicine" className="text-brand-500 hover:underline">Share one →</Link></p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myMedicines.map(m => (
                <MedicineCard
                  key={m._id}
                  medicine={m}
                  isOwner
                  onGiven={async () => { await api.post(`/medicines/${m._id}/give`); qc.invalidateQueries({ queryKey: ['myMedicines'] }); toast.success('Marked as given!'); }}
                  onDelete={async () => { await api.delete(`/medicines/${m._id}`); qc.invalidateQueries({ queryKey: ['myMedicines'] }); toast.success('Deleted.'); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-bold text-lg">Settings</h2>

          {/* Language */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 font-medium"><Globe size={18} /> Language</div>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="input py-1.5 px-4 text-sm cursor-pointer min-w-[120px] flex items-center justify-between gap-2"
              >
                <span>{
                  {
                    en: 'English',
                    ta: 'தமிழ் (Tamil)',
                    hi: 'हिन्दी (Hindi)',
                    te: 'తెలుగు (Telugu)',
                    ml: 'മലയാളം (Malayalam)',
                    kn: 'ಕನ್ನಡ (Kannada)'
                  }[lang]
                }</span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 w-40 z-50 rounded-xl overflow-hidden shadow-glass border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl"
                    >
                      <div className="flex flex-col py-1">
                        {[
                          { code: 'en', label: 'English' },
                          { code: 'ta', label: 'தமிழ்' },
                          { code: 'hi', label: 'हिन्दी' },
                          { code: 'te', label: 'తెలుగు' },
                          { code: 'ml', label: 'മലയാളം' },
                          { code: 'kn', label: 'ಕನ್ನಡ' }
                        ].map(l => (
                          <button
                            key={l.code}
                            onClick={() => { switchLang(l.code); setLangOpen(false); }}
                            className={`px-4 py-2 text-sm text-left transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${lang === l.code ? 'text-brand-600 dark:text-brand-400 font-bold bg-white/40 dark:bg-white/5' : 'text-gray-700 dark:text-gray-200'}`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">{dark ? <Moon size={18} /> : <Sun size={18} />} Theme</div>
            <button onClick={toggle} className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700`}>
              {dark ? 'Dark' : 'Light'} (click to toggle)
            </button>
          </div>

          {/* Privacy */}
          <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            {t('privacyNote')}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2">
            <LogOut size={18} /> {t('logout')}
          </button>

          {/* Delete account */}
          <button onClick={() => setDeleteAccount(true)} className="w-full btn-ghost text-red-500 flex items-center justify-center gap-2 text-sm">
            <Trash2 size={16} /> {t('deleteAccount')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteAccount}
        title={t('deleteAccount')}
        message="All your data — donor profile, blood requests, medicines, and contact logs — will be permanently deleted. This cannot be undone."
        onConfirm={() => deleteAccountMutation.mutate()}
        onCancel={() => setDeleteAccount(false)}
        loading={deleteAccountMutation.isPending}
      />
    </div>
  );
}
