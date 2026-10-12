import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Droplets, Users, Pill, ChevronRight, Heart, Info, Shield, Phone } from 'lucide-react';
import StatCounter from '../components/ui/StatCounter';
import RequestCard from '../components/RequestCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import Hero from '../components/home/Hero';
import AlertSubscribeCard from '../components/alerts/AlertSubscribeCard';
import CampsTeaser from '../components/camps/CampsTeaser';
import NearbyHospitalsTeaser from '../components/hospitals/NearbyHospitalsTeaser';
import LeaderboardTeaser from '../components/leaderboard/LeaderboardTeaser';
import InviteButton from '../components/referral/InviteButton';
import HowItWorks from '../components/home/HowItWorks';

// Hero blood drop + ECG SVG
function HeroSVG() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
      {/* Pulsing rings */}
      <div className="absolute inset-0 rounded-full border-4 border-brand-200 dark:border-brand-800 animate-ping opacity-30" />
      <div className="absolute inset-4 rounded-full border-2 border-brand-300 dark:border-brand-700 animate-pulse opacity-50" />
      {/* Blood drop */}
      <svg viewBox="0 0 100 120" className="w-24 h-28 animate-float drop-shadow-2xl" aria-label="Blood drop">
        <defs>
          <linearGradient id="drop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#B3122B" />
          </linearGradient>
        </defs>
        <path
          d="M50 10 C50 10, 15 55, 15 75 A35 35 0 0 0 85 75 C85 55 50 10 50 10 Z"
          fill="url(#drop-grad)"
        />
        <ellipse cx="38" cy="65" rx="8" ry="12" fill="rgba(255,255,255,0.15)" transform="rotate(-30 38 65)" />
      </svg>
    </div>
  );
}

function ECGLine() {
  return (
    <div className="w-full max-w-md mx-auto overflow-hidden h-12 mb-8" aria-hidden="true">
      <svg viewBox="0 0 400 48" fill="none" className="w-full">
        <path
          d="M0,24 L60,24 L70,24 L80,4 L90,44 L100,4 L110,44 L120,24 L160,24 L200,24 L210,24 L220,4 L230,44 L240,4 L250,44 L260,24 L300,24 L340,24 L350,24 L360,4 L370,44 L380,4 L390,44 L400,24"
          stroke="#E11D48"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-path"
        />
      </svg>
    </div>
  );
}

const COMPAT = {
  'A+':  ['A+','A-','O+','O-'],
  'A-':  ['A-','O-'],
  'B+':  ['B+','B-','O+','O-'],
  'B-':  ['B-','O-'],
  'O+':  ['O+','O-'],
  'O-':  ['O-'],
  'AB+': ['A+','A-','B+','B-','O+','O-','AB+','AB-'],
  'AB-': ['A-','B-','AB-','O-'],
};

const BLOOD_BG = {
  'A+': 'bg-red-100 border-red-300', 'A-': 'bg-red-50 border-red-200',
  'B+': 'bg-orange-100 border-orange-300', 'B-': 'bg-orange-50 border-orange-200',
  'O+': 'bg-amber-100 border-amber-300', 'O-': 'bg-yellow-100 border-yellow-300',
  'AB+': 'bg-purple-100 border-purple-300', 'AB-': 'bg-pink-100 border-pink-300',
};

const FAQ = [
  { q: 'howToRegister', a: 'howToRegisterAns' },
  { q: 'whoCanDonate',  a: 'whoCanDonateAns' },
  { q: 'isMedicineShareSafe', a: 'isMedicineShareSafeAns' },
  { q: 'howAreHospitalsVerified', a: 'howAreHospitalsVerifiedAns' },
];

export default function HomePage() {
  const { t } = useLang();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: urgent, isLoading: urgentLoading } = useQuery({
    queryKey: ['requests', 'urgent'],
    queryFn: () => api.get('/requests?urgency=Critical&limit=5').then(r => r.data.data),
    refetchInterval: 15000,
  });

  return (
    <div className="animate-fade-in">
      <Hero />

      {/* ─── Live Stats ───────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="live-dot" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('liveUpdates')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCounter value={stats?.donors}   label={t('activeDonors')}   icon={Users} />
          <StatCounter value={stats?.requests} label={t('openRequests')}   icon={Droplets} />
          <StatCounter value={stats?.medicines} label={t('medicinesShared')} icon={Pill} />
        </div>
      </section>

      {/* ─── Urgent Requests Carousel ─────────────────────────────── */}
      {(urgentLoading || (urgent && urgent.length > 0)) && (
        <section className="max-w-4xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="badge-critical">🚨 Critical</span> Requests
            </h2>
            <Link to="/requests" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          {urgentLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(urgent?.data || []).slice(0, 4).map(r => <RequestCard key={r._id} request={r} />)}
            </div>
          )}
        </section>
      )}

      {/* ─── Blood Emergency Alert Subscription ────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <AlertSubscribeCard />
      </section>

      {/* ─── Upcoming Camps Near You ───────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4">
        <CampsTeaser />
      </div>

      {/* ─── Nearby Hospitals & Blood Banks ────────────────────── */}
      <div className="max-w-4xl mx-auto px-4">
        <NearbyHospitalsTeaser />
      </div>

      {/* ─── Leaderboard Teaser ────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 my-8">
        <LeaderboardTeaser />
      </div>

      {/* ─── Invite Friends CTA Band ───────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 my-8">
        <InviteButton variant="card" />
      </div>

      {/* ─── How It Works (Step by Step) ─────────────────────────── */}
      <HowItWorks />

      {/* ─── Blood Compatibility Chart ────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">{t('bloodCompatibility')}</h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">{t('canReceiveFrom')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(COMPAT).map(([group, donors]) => (
            <div key={group} className={`rounded-2xl border-2 p-3 ${BLOOD_BG[group] || 'bg-gray-100 border-gray-200'} dark:bg-opacity-10 dark:border-opacity-30`}>
              <div className="font-black text-xl text-center mb-2">{group}</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {donors.map(d => (
                  <span key={d} className="text-xs bg-white/60 dark:bg-white/10 rounded-full px-1.5 py-0.5 font-semibold">{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-800/30 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">{t('faq')}</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="glass-card p-4 group" open={false}>
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between gap-2">
                  {t(q)}
                  <ChevronRight size={18} className="text-brand-500 transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t(a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Disclaimer ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <Info size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{t('disclaimer')}</p>
        </div>
      </section>
    </div>
  );
}
