import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Share2, Flag, Lock, CheckCircle, AlertCircle } from 'lucide-react';
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
    if (!user) {
      navigate('/auth', { state: { from: '/requests' } });
      return;
    }
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-5 card-lift flex flex-col justify-between space-y-2.5 sm:space-y-3 rounded-2xl border border-pink-50/80 dark:border-slate-800"
    >
      {/* Top Header: Badges & Patient Name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`${URGENCY_STYLES[request.urgency] || URGENCY_STYLES.Normal} text-[9px] sm:text-xs`}>
              {t(request.urgency)}
            </span>
            <BloodGroupBadge group={request.bloodGroup} className="text-[9px] sm:text-xs" />
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 sm:px-2 py-0.5 rounded-full">
              <CheckCircle size={9} className="sm:w-3 sm:h-3" /> Verified
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-base text-ink dark:text-white leading-tight truncate">
            {request.patientName}
          </h3>
        </div>
        <span className="shrink-0 text-[9px] sm:text-xs font-bold text-white bg-green-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-1">
          <Clock size={9} className="sm:w-[11px] sm:h-[11px]" /> {request.units} Unit{request.units > 1 ? 's' : ''}
        </span>
      </div>

      {/* Address */}
      <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex-1">
        <div className="flex items-start gap-1.5">
          <MapPin size={12} className="text-brand-400 shrink-0 mt-0.5 sm:w-[14px] sm:h-[14px]" />
          <span className="line-clamp-2 sm:line-clamp-none leading-snug">
            {request.hospital}, {request.city || request.district}
          </span>
        </div>
      </div>

      {/* Two Action Buttons: Call & WhatsApp */}
      <div className="flex flex-wrap gap-2 pt-1">
        {!user ? (
          <>
            <button
              onClick={() => navigate('/auth', { state: { from: '/requests' } })}
              className="btn-primary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl font-bold"
              title="Login to Call"
            >
              <Lock size={12} className="sm:w-3.5 sm:h-3.5" /> Call
            </button>
            <button
              onClick={() => navigate('/auth', { state: { from: '/requests' } })}
              className="btn-secondary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl font-bold"
              title="Login to WhatsApp"
            >
              <Share2 size={12} className="sm:w-3.5 sm:h-3.5" /> WhatsApp
            </button>
          </>
        ) : (
          <>
            <a
              href={`tel:${request.contactPhone}`}
              className="btn-primary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl font-bold"
            >
              <Phone size={12} className="sm:w-3.5 sm:h-3.5" /> Call
            </a>
            <button
              onClick={handleWhatsApp}
              className="btn-secondary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl font-bold"
            >
              <Share2 size={12} className="sm:w-3.5 sm:h-3.5" /> WhatsApp
            </button>
          </>
        )}
      </div>

      {/* Footer Details: Needed by, Note & Report */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1 sm:space-y-2 mt-1 sm:mt-0">
        <div className="flex items-center gap-1 text-[9px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle size={9} className="sm:w-3 sm:h-3" /> Needed by {neededByDate}
        </div>
        
        <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500">
          <div className="leading-tight truncate max-w-[75%]">
            {request.note ? `Note: ${request.note}` : 'Verified Emergency Request'}
          </div>
          <button
            onClick={() => onReport?.(request._id)}
            className="flex items-center gap-0.5 sm:gap-1 hover:text-red-500 transition-colors w-fit ml-auto"
          >
            <Flag size={8} className="sm:w-2.5 sm:h-2.5" /> Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}
