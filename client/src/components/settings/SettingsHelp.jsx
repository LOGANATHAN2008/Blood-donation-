import { HelpCircle, ExternalLink, DownloadCloud, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsHelp() {
  const handleInstallApp = () => {
    window.dispatchEvent(new CustomEvent('lc:prompt-install'));
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><HelpCircle size={24} className="text-brand-500" /> Help & About</h2>
        <p className="text-sm text-gray-500">Get support and learn more about Life Connect.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/about" className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group">
          <span className="font-bold">About Life Connect</span>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-500" />
        </Link>
        <Link to="/privacy" className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group">
          <span className="font-bold">Privacy Policy</span>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-500" />
        </Link>
        <Link to="/terms" className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group">
          <span className="font-bold">Terms of Service</span>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-500" />
        </Link>
        <Link to="/safety" className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group">
          <span className="font-bold">Trust & Safety</span>
          <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-500" />
        </Link>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg">App Options</h3>
        
        <button onClick={handleInstallApp} className="w-full p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-between font-bold">
          <span className="flex items-center gap-2"><DownloadCloud size={20} /> Install App (PWA)</span>
          <span>→</span>
        </button>

        <Link to="/contact" className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between font-bold">
          <span className="flex items-center gap-2"><AlertOctagon size={20} /> Report a Problem</span>
          <span>→</span>
        </Link>
      </div>

      <div className="pt-8 text-center text-xs text-gray-400">
        <p>Life Connect Version 2.0.0</p>
        <p className="mt-1">Data provided by users and eRaktKosh open data.</p>
      </div>
    </div>
  );
}
