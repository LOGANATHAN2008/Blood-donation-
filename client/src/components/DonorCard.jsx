import { motion } from 'framer-motion';
import { MapPin, Phone, CheckCircle, Clock, Flag, MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import BloodGroupBadge from './ui/BloodGroupBadge';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DonorCard({ donor, onReport }) {
  const { t }    = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  // True if user is logged in AND donor data is unlocked
  const isUnlocked = Boolean(user && !donor.isLocked);

  const cleanPhone = donor.phone ? donor.phone.replace(/[^\d]/g, '').slice(-10) : '';
  const eligibleFrom = donor.eligibleFrom ? new Date(donor.eligibleFrom).toLocaleDateString('en-IN') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 card-lift space-y-3.5 relative overflow-hidden"
    >
      {/* Top Header: Avatar, Name, Location summary & Blood Group */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl brand-gradient flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {donor.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <div className="font-bold text-ink dark:text-white flex items-center gap-1.5">
              <span>{donor.name}</span>
              {donor.verified && (
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" title="Verified Donor" />
              )}
            </div>

            {/* Location display: Locked vs Unlocked */}
            <div className="mt-0.5">
              {!isUnlocked ? (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin size={12} className="text-gray-400 shrink-0" />
                  <span>{donor.district}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                    <Lock size={9} /> Location Locked
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <MapPin size={12} className="text-red-500 shrink-0" />
                  <span className="font-medium">
                    {donor.city ? `${donor.city}, ` : ''}{donor.district}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <BloodGroupBadge group={donor.bloodGroup} size="lg" />
      </div>

      {/* Badges: Availability, Age & Eligibility */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {donor.available ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/40">
            <CheckCircle size={11} /> {t('available')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Not Available
          </span>
        )}

        {donor.age && (
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-full">
            Age: {donor.age}
          </span>
        )}

        {donor.eligible === false && eligibleFrom && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
            <Clock size={11} /> {t('eligibleFrom')} {eligibleFrom}
          </span>
        )}
      </div>

      {/* Phone Number Box: Locked vs Unlocked */}
      {!isUnlocked ? (
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-200/70 dark:bg-gray-700 flex items-center justify-center text-gray-400">
              <Phone size={12} />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Mobile Number</div>
              <div className="text-xs font-mono font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1 tracking-wider">
                <Lock size={10} className="text-amber-500" />
                <span>
                  +91 {cleanPhone ? `${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}` : '98••••••23'}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lock size={9} /> Locked
          </span>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Phone size={12} />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Verified Contact</div>
              <div className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                +91 {cleanPhone || donor.phone || '9845112233'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle size={9} /> Unlocked
          </span>
        </div>
      )}

      {/* Action Buttons: Locked (Login prompt) vs Unlocked (Call & WhatsApp) */}
      <div className="pt-1 flex items-center gap-2">
        {!isUnlocked ? (
          <button
            onClick={() => navigate('/auth', { state: { from: '/donors' } })}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all"
          >
            <Lock size={13} />
            <span>Login to Unlock Phone & Location</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <a
              href={`tel:+91${cleanPhone}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <Phone size={12} /> Call
            </a>
            <a
              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                `Hi ${donor.name}, I found your contact on Life Connect as a ${donor.bloodGroup} blood donor in ${donor.district}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
          </div>
        )}

        <button
          onClick={() => onReport?.(donor._id)}
          className="btn-ghost p-2 text-gray-400 hover:text-red-500 rounded-xl"
          aria-label="Report"
          title="Report Donor"
        >
          <Flag size={14} />
        </button>
      </div>
    </motion.div>
  );
}
