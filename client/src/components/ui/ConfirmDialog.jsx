import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card relative z-10 w-full max-w-sm p-6 space-y-4"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={22} />
              </div>
              <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
            </div>
            {message && <p className="text-gray-600 dark:text-gray-300 text-sm">{message}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
