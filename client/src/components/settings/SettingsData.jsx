import { useState } from 'react';
import { Download, Pause, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsData({ data, mutate, isPending }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    const toastId = toast.loading('Generating your data export...');
    try {
      const res = await api.get('/me/export');
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `life_connect_data_${user.uid}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to export data.', { id: toastId });
    }
  };

  const handlePauseToggle = () => {
    const newPausedState = !data.user.pausedAccount;
    mutate({ pausedAccount: newPausedState });
    toast.success(newPausedState ? 'Account paused. You will not appear in matches.' : 'Account resumed.');
  };

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    
    setIsDeleting(true);
    const toastId = toast.loading('Deleting account and all associated data...');
    try {
      await api.delete('/me');
      toast.success('Account permanently deleted.', { id: toastId });
      // auth context will detect firebase deletion and log out automatically
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to delete account', { id: toastId });
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><Download size={24} className="text-brand-500" /> Data & Account</h2>
        <p className="text-sm text-gray-500">Manage your data, pause your account, or permanently delete it.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Download Your Data</h3>
        <p className="text-sm text-gray-500">Get a copy of all your data (requests, donations, medicines) in JSON format.</p>
        <button onClick={handleDownload} className="btn-secondary py-2 flex items-center gap-2">
          <Download size={18} /> Request Data Export
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg">Pause Account</h3>
        <p className="text-sm text-gray-500">Temporarily hide your profile from all searches and auto-matches without deleting your data.</p>
        <button 
          onClick={handlePauseToggle} 
          disabled={isPending}
          className={`py-2 px-6 rounded-xl font-bold transition-colors ${data.user.pausedAccount ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
        >
          {data.user.pausedAccount ? 'Resume Account' : 'Pause Account'}
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-red-100 dark:border-red-900/30 mt-8">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle size={24} />
          <h3 className="font-bold text-lg">Danger Zone: Delete Account</h3>
        </div>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 max-w-md">
          This will permanently delete your account, donor profile, requests, medicines, and all Cloudinary images. This action <strong>cannot</strong> be undone.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <input 
            type="text" 
            placeholder="Type DELETE to confirm" 
            className="input border-red-200 focus:border-red-500 max-w-[250px]"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            disabled={isDeleting}
          />
          <button 
            onClick={handleDelete}
            disabled={deleteInput !== 'DELETE' || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            <Trash2 size={18} /> {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
