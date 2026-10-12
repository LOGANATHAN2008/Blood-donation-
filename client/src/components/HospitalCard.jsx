import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, CheckCircle, ExternalLink, Flag, AlertCircle, Info } from 'lucide-react';
import { useLang } from '../context/LangContext';

const TYPE_COLORS = {
  'Government Hospital': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Private Hospital':    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Blood Bank':          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Trauma Center':       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Medical College':     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

export default function HospitalCard({ hospital, onReport }) {
  const { t } = useLang();
  const mapsUrl = hospital.lat && hospital.lng
    ? `https://www.google.com/maps?q=${hospital.lat},${hospital.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.district + (hospital.state ? ' ' + hospital.state : ''))}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-5 card-lift space-y-2 sm:space-y-3 h-full flex flex-col"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[hospital.type] || 'bg-gray-100 text-gray-600'}`}>
              {hospital.type}
            </span>
            {hospital.status === 'Approved' && (
              hospital.verified ? (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} className="sm:w-3 sm:h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                  <Info size={9} className="sm:w-3 sm:h-3" /> Community data
                </span>
              )
            )}
          </div>
          <h3 className="font-bold text-sm sm:text-base text-ink dark:text-white leading-tight truncate">{hospital.name}</h3>
        </div>
        {hospital.is24x7 && (
          <span className="shrink-0 text-[9px] sm:text-xs font-bold text-white bg-green-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-1">
            <Clock size={9} className="sm:w-[11px] sm:h-[11px]" /> 24×7
          </span>
        )}
      </div>

      <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex-1">
        <div className="flex items-start gap-1.5">
          <MapPin size={12} className="text-brand-400 shrink-0 mt-0.5 sm:w-[14px] sm:h-[14px]" />
          <span className="line-clamp-2 sm:line-clamp-none leading-snug">{hospital.address}</span>
        </div>
        {hospital.distance != null && (
          <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-bold pl-4 sm:pl-5 flex items-center gap-1">
            <span>📍</span>
            <span>
              {hospital.distance > 100 ? (hospital.distance / 1000).toFixed(1) : Number(hospital.distance).toFixed(1)} km away
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <a href={`tel:${hospital.phone}`} className="btn-primary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl">
          <Phone size={12} className="sm:w-3.5 sm:h-3.5" /> Call
        </a>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 sm:py-2 text-[11px] sm:text-sm flex-1 justify-center min-h-[32px] sm:min-h-[40px] px-2 sm:px-6 rounded-lg sm:rounded-xl">
          <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" /> Maps
        </a>
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1 sm:space-y-2 mt-1 sm:mt-0">
        <div className="flex items-center gap-1 text-[9px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle size={9} className="sm:w-3 sm:h-3" /> Call to confirm blood availability
        </div>
        
        <div className="flex flex-col gap-1.5 text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500">
          <div className="leading-tight truncate">
            Source: <span className="font-medium text-gray-600 dark:text-gray-400">{hospital.source || 'User submitted'}</span>
            {hospital.lastVerifiedAt && <span className="inline-block sm:ml-1 mt-0.5 sm:mt-0"> • Updated: {new Date(hospital.lastVerifiedAt).toLocaleDateString()}</span>}
          </div>
          <button onClick={() => onReport?.(hospital._id)} className="flex items-center gap-0.5 sm:gap-1 hover:text-red-500 transition-colors w-fit">
            <Flag size={8} className="sm:w-2.5 sm:h-2.5" /> Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}
