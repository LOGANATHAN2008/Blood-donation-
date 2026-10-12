import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Share2, Flag } from 'lucide-react';
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 card-lift space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={URGENCY_STYLES[request.urgency] || URGENCY_STYLES.Normal}>
              {t(request.urgency)}
            </span>
            <BloodGroupBadge group={request.bloodGroup} />
          </div>
          <h3 className="font-semibold text-ink dark:text-white mt-1.5 truncate">
            {request.patientName}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-brand-gradient">{request.units}</div>
          <div className="text-xs text-gray-500">units</div>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-brand-400 shrink-0" />
          <span className="truncate">{request.hospital}, {request.city}, {request.district}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-amber-500 shrink-0" />
          <span>Needed by {neededByDate}</span>
        </div>
      </div>

      {request.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
          {request.note}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={`tel:${request.contactPhone}`}
          className="btn-primary py-2 text-sm"
          aria-label={`Call ${request.contactPhone}`}
        >
          <Phone size={14} /> Call
        </a>
        <button onClick={handleWhatsApp} className="btn-secondary py-2 text-sm">
          <Share2 size={14} /> {t('whatsapp')}
        </button>
        {isOwner && showActions && (
          <>
            <button
              onClick={() => handleStatusChange('Fulfilled')}
              className="btn-ghost py-2 text-sm text-green-600"
            >
              Fulfilled
            </button>
            <button
              onClick={() => handleStatusChange('Cancelled')}
              className="btn-ghost py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          </>
        )}
        <button
          onClick={() => onReport?.(request._id)}
          className="btn-ghost py-2 text-sm text-gray-400 hover:text-red-500"
          aria-label="Report"
        >
          <Flag size={14} />
        </button>
      </div>
    </motion.div>
  );
}
