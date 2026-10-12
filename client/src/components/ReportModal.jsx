import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ReportModal({ targetId, targetType, open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (reason.trim().length < 5) { toast.error('Please provide more detail.'); return; }
    setLoading(true);
    try {
      await api.post('/reports', { targetId, targetType, reason: reason.trim() });
      toast.success('Report submitted. Thank you for keeping the community safe.');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card relative z-10 w-full max-w-sm p-6 space-y-4">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <Flag className="text-red-600 dark:text-red-400" size={22} />
              </div>
              <h2 id="report-title" className="text-lg font-bold">Report Post</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Why are you reporting this? (min 5 chars)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={300}
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
