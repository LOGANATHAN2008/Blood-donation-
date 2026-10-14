import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Share2, Flag, Lock } from 'lucide-react';
import BloodGroupBadge from './ui/BloodGroupBadge';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

const URGENCY_STYLES = {
  Critical: 'badge-critical',
  Urgent:   'badge-urgent',
  Normal:   'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function RequestCard({ request, showActions, onStatusChange, onReport }) {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const neededByDate = new Date(request.neededBy).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const isOwner = user?.uid === request.uid;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `🩸 URGENT Blood Request!\nBlood Group: ${request.bloodGroup}\nUnits: ${request.units}\nHospital: ${request.hospital}, ${request.district}\nContact: ${request.contactPhone}\nNeeded by: ${neededByDate}\n\nShare via Life Connect`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/requests/${request._id}/status`, { status });
      toast.success(`Marked as ${status}`);
      onStatusChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-2.5 sm:p-3 rounded-xl card-lift border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-1.5"
    >
      {/* Row 1: Badges, Name, Units */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <BloodGroupBadge group={request.bloodGroup} className="text-xs px-2 py-0.5 font-black shrink-0" />
          <h3 className="font-bold text-sm text-ink dark:text-white truncate">
            {request.patientName}
          </h3>
          <span className={`${URGENCY_STYLES[request.urgency] || URGENCY_STYLES.Normal} text-[9px] py-0.5 px-1.5 uppercase tracking-wider font-extrabold shrink-0`}>
            {t(request.urgency)}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/40">
          <span>{request.units}</span>
          <span className="text-[10px] font-normal opacity-75">unit{request.units > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Row 2: Location & Needed time (compact inline) */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <div className="flex items-center gap-1 min-w-0 max-w-[58%]">
          <MapPin size={11} className="text-brand-500 shrink-0" />
          <span className="truncate">{request.hospital}, {request.city || request.district}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <div className="flex items-center gap-1 shrink-0 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          <Clock size={11} className="shrink-0" />
          <span>{neededByDate}</span>
        </div>
      </div>

      {/* Row 3: Note (only if present, 1 clean line) */}
      {request.note && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2 py-0.5 truncate italic">
          "{request.note}"
        </p>
      )}

      {/* Row 4: Actions (Sleek compact bar) */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-slate-100 dark:border-slate-800/80">
        {!user ? (
          <button
            onClick={() => navigate('/auth', { state: { from: '/emergency' } })}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm active:scale-[0.98] transition-all"
          >
            <Lock size={11} className="shrink-0" />
            <span>Login to Call & WhatsApp</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 w-full">
            <a
              href={`tel:${request.contactPhone}`}
              className="flex-1 btn-primary py-1 px-2.5 text-xs rounded-lg justify-center font-bold"
              aria-label={`Call ${request.contactPhone}`}
            >
              <Phone size={11} /> Call
            </a>
            <button
              onClick={handleWhatsApp}
              className="flex-1 btn-secondary py-1 px-2.5 text-xs rounded-lg justify-center font-bold"
            >
              <Share2 size={11} /> WhatsApp
            </button>
            {isOwner && showActions && (
              <>
                <button
                  onClick={() => handleStatusChange('Fulfilled')}
                  className="btn-ghost py-1 px-2 text-[11px] text-green-600 font-bold"
                >
                  Done
                </button>
                <button
                  onClick={() => handleStatusChange('Cancelled')}
                  className="btn-ghost py-1 px-2 text-[11px] text-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => onReport?.(request._id)}
              className="btn-ghost p-1 text-gray-400 hover:text-red-500 rounded"
              aria-label="Report"
            >
              <Flag size={11} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
