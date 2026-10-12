import { useState } from 'react';
import { Activity } from 'lucide-react';
import BadgeShelf from '../badges/BadgeShelf';
import MyActivitySection from '../donations/MyActivitySection';

export default function SettingsActivity({ data }) {
  const [activeTab, setActiveTab] = useState('shelf');

  const totalDonations = data.user?.totalDonations || data.donor?.totalDonations || 0;
  const userBadges = data.user?.badges || [];
  const referralCount = data.user?.referralCount || 0;

  return (
    <div className="glass-card p-5 md:p-8 animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-black mb-1 flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity size={24} className="text-rose-500" /> My Activity & Badges
        </h2>
        <p className="text-xs md:text-sm text-gray-500">
          Track your life-saving donations, badges, verified milestones, and referral community.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2">
        <button
          onClick={() => setActiveTab('shelf')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'shelf'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🏅 Badges & Levels
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'donations'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🩸 Logged Donations & Certificates
        </button>
      </div>

      {activeTab === 'shelf' && (
        <div className="space-y-6">
          <BadgeShelf totalDonations={totalDonations} userBadges={userBadges} />

          {/* Referral Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🤝</span>
              <div>
                <span className="font-bold text-xs text-gray-900 dark:text-white block">
                  Referral Community
                </span>
                <span className="text-[11px] text-gray-500">
                  Friends who completed their profile through your invite code
                </span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {referralCount}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'donations' && (
        <MyActivitySection />
      )}
    </div>
  );
}
