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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-2 card-lift border border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`${URGENCY_STYLES[request.urgency] || URGENCY_STYLES.Normal} text-[10px] py-0.5 px-2`}>
              {t(request.urgency)}
            </span>
            <BloodGroupBadge group={request.bloodGroup} />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-ink dark:text-white mt-1 truncate">
            {request.patientName}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg sm:text-xl font-black text-brand-gradient leading-none">{request.units}</div>
          <div className="text-[10px] text-gray-500 font-medium">units</div>
        </div>
      </div>

      <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-500 shrink-0" />
          <span className="truncate">{request.hospital}, {request.city || request.district}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <Clock size={11} className="text-amber-500 shrink-0" />
          <span className="truncate">Needed by {neededByDate}</span>
        </div>
      </div>

      {request.note && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-md p-1.5 px-2 line-clamp-2">
          {request.note}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {!user ? (
          <button
            onClick={() => navigate('/auth', { state: { from: '/emergency' } })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium text-xs rounded-lg sm:rounded-xl shadow-sm active:scale-[0.98] transition-all"
          >
            <Lock size={12} className="shrink-0" />
            <span>Login to Call & WhatsApp</span>
          </button>
        ) : (
          <>
            <a
              href={`tel:${request.contactPhone}`}
              className="btn-primary py-1.5 px-3 text-xs rounded-lg"
              aria-label={`Call ${request.contactPhone}`}
            >
              <Phone size={12} /> Call
            </a>
            <button onClick={handleWhatsApp} className="btn-secondary py-1.5 px-3 text-xs rounded-lg">
              <Share2 size={12} /> {t('whatsapp')}
            </button>
          </>
        )}
        {isOwner && showActions && (
          <>
            <button
              onClick={() => handleStatusChange('Fulfilled')}
              className="btn-ghost py-1 px-2 text-xs text-green-600"
            >
              Fulfilled
            </button>
            <button
              onClick={() => handleStatusChange('Cancelled')}
              className="btn-ghost py-1 px-2 text-xs text-gray-500"
            >
              Cancel
            </button>
          </>
        )}
        <button
          onClick={() => onReport?.(request._id)}
          className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 rounded-lg ml-auto"
          aria-label="Report"
        >
          <Flag size={12} />
        </button>
      </div>
    </motion.div>
  );
}
