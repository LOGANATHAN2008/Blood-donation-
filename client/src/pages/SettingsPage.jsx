import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Droplets, Bell, Settings, Lock, Activity, Download, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import SettingsProfile from '../components/settings/SettingsProfile';
import SettingsDonor from '../components/settings/SettingsDonor';
import SettingsNotifications from '../components/settings/SettingsNotifications';
import SettingsPreferences from '../components/settings/SettingsPreferences';
import SettingsPrivacy from '../components/settings/SettingsPrivacy';
import SettingsActivity from '../components/settings/SettingsActivity';
import SettingsData from '../components/settings/SettingsData';
import SettingsHelp from '../components/settings/SettingsHelp';

const SECTIONS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'donor', icon: Droplets, label: 'Donor Settings' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'preferences', icon: Settings, label: 'App Preferences' },
  { id: 'privacy', icon: Lock, label: 'Privacy & Security' },
  { id: 'activity', icon: Activity, label: 'My Activity' },
  { id: 'data', icon: Download, label: 'Data & Account' },
  { id: 'help', icon: HelpCircle, label: 'Help & About' },
];

export default function SettingsPage() {
  const { user, refreshDbUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useLang();
  
  const [activeSection, setActiveSection] = useState('profile');

  // We fetch both User and Donor data to populate settings
  const { data, isLoading } = useQuery({
    queryKey: ['settingsMe'],
    queryFn: async () => {
      const [uRes, dRes] = await Promise.all([
        api.get('/me'),
        api.get('/donors/me').catch(() => ({ data: null }))
      ]);
      return { user: uRes.data, donor: dRes.data };
    },
    enabled: !!user
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch('/me/settings', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settingsMe'] });
      qc.invalidateQueries({ queryKey: ['authMe'] }); // keep header updated
      if (refreshDbUser) refreshDbUser();
    },
    onError: (err) => toast.error(err.message)
  });

  useEffect(() => {
    if (!user && !isLoading) {
      toast.error('Please login to access settings.');
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>;
  if (!data?.user) return null;

  const renderSection = () => {
    const props = { data, mutate: updateMutation.mutate, isPending: updateMutation.isPending };
    switch (activeSection) {
      case 'profile': return <SettingsProfile {...props} />;
      case 'donor': return <SettingsDonor {...props} />;
      case 'notifications': return <SettingsNotifications {...props} />;
      case 'preferences': return <SettingsPreferences {...props} />;
      case 'privacy': return <SettingsPrivacy {...props} />;
      case 'activity': return <SettingsActivity {...props} />;
      case 'data': return <SettingsData {...props} />;
      case 'help': return <SettingsHelp {...props} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Mobile Stack Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 sticky top-[64px] z-30 shadow-sm">
        <select 
          className="input font-bold text-lg text-brand-600 bg-brand-50 dark:bg-brand-900/30 border-none w-full"
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
        >
          {SECTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 grid md:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden md:block col-span-1 glass-card overflow-hidden">
          <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-black text-brand-700 dark:text-brand-400">Settings</h1>
          </div>
          <div className="p-2 space-y-1">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === id 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
