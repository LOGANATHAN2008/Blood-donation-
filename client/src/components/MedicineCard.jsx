import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, MapPin, Phone, Clock, AlertTriangle, Flag } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxsa93rr2';

function cloudinaryUrl(publicId, w = 400) {
  if (!publicId) return null;
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w},c_fill/${publicId}`;
}

const EXPIRY_BADGE = {
  'expiring-soon': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'expiring-6mo':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ok:              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function MedicineCard({ medicine, isOwner, onReserve, onGiven, onDelete, onReport }) {
  const { t }   = useLang();
  const { user } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const expiryDate = new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const imgUrl     = medicine.imagePublicId ? cloudinaryUrl(medicine.imagePublicId) : medicine.imageUrl;

  const handleReserve = async () => {
    if (!user) { toast.error('Login required'); return; }
    setLoading(true);
    try {
      await api.post(`/medicines/${medicine._id}/reserve`);
      toast.success('Reserved! Contact the donor to arrange pickup.');
      onReserve?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden card-lift"
    >
      {/* Image */}
      {imgUrl && (
        <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={imgUrl}
            alt={medicine.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
          {medicine.expiryLabel && medicine.expiryLabel !== 'ok' && (
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${EXPIRY_BADGE[medicine.expiryLabel]}`}>
              {medicine.expiryLabel === 'expiring-6mo' ? 'Expiring Soon' : 'Expiring Very Soon'}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-ink dark:text-white">{medicine.name}</h3>
            {medicine.strength && <div className="text-sm text-gray-500">{medicine.strength}</div>}
          </div>
          <span className="text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 px-2 py-1 rounded-lg">
            {medicine.quantity}
          </span>
        </div>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-brand-400 shrink-0" />
            {medicine.city}, {medicine.district}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-amber-500 shrink-0" />
            Expires {expiryDate}
          </div>
        </div>

        {medicine.pickupNotes && (
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            {medicine.pickupNotes}
          </p>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          Always verify with a pharmacist before use.
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {medicine.status === 'Available' && !isOwner && (
            <button onClick={handleReserve} className="btn-primary py-2 text-sm" disabled={loading}>
              <Pill size={14} /> {loading ? '…' : t('reserve')}
            </button>
          )}
          {medicine.status === 'Available' && (
            <a href={`tel:${medicine.contactPhone}`} className="btn-secondary py-2 text-sm">
              <Phone size={14} /> Call
            </a>
          )}
          {medicine.status === 'Reserved' && isOwner && (
            <button onClick={() => onGiven?.()} className="btn-primary py-2 text-sm">
              {t('markAsGiven')}
            </button>
          )}
          {isOwner && (
            <button onClick={() => onDelete?.()} className="btn-ghost py-2 text-sm text-red-500">
              Delete
            </button>
          )}
          {!isOwner && (
            <button onClick={() => onReport?.(medicine._id)} className="btn-ghost py-2 text-xs text-gray-400 hover:text-red-500">
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
