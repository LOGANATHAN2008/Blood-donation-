import { useState } from 'react';
import { Shield, Smartphone, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsPrivacy({ data, mutate, isPending }) {
  const [revoking, setRevoking] = useState(false);
  const [locStatus, setLocStatus] = useState('Checking...');

  const handleRevokeSessions = async () => {
    if (!window.confirm('Are you sure you want to log out from all other devices?')) return;
    setRevoking(true);
    try {
      const res = await api.post('/me/sessions/revoke');
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setRevoking(false);
    }
  };

  const checkLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('Not supported');
      return;
    }
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setLocStatus(result.state); // 'granted', 'prompt', 'denied'
    });
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        toast.success('Location permission granted!');
        checkLocation();
      },
      (err) => {
        toast.error('Location permission denied.');
        checkLocation();
      }
    );
  };

  // Check on mount
  useState(() => checkLocation(), []);

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Privacy & Security</h2>
        <p className="text-sm text-gray-500">Manage your active sessions and permissions.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Smartphone size={20} className="text-brand-500" /> Active Sessions</h3>
        <p className="text-sm text-gray-500">If you noticed suspicious activity, you can log out from all other devices. Your current device will also be logged out shortly, and you will need to sign in again.</p>
        <button 
          onClick={handleRevokeSessions}
          disabled={revoking}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {revoking ? 'Revoking...' : 'Log out from all devices'}
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg flex items-center gap-2"><MapPin size={20} className="text-brand-500" /> Location Services</h3>
        <p className="text-sm text-gray-500">Location access is required for exact distance matching when searching for donors or medicines.</p>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {locStatus === 'granted' ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-amber-500" />}
            <div>
              <p className="font-bold">Status: <span className="capitalize">{locStatus}</span></p>
            </div>
          </div>
          {locStatus !== 'granted' && (
            <button onClick={requestLocation} className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Request Permission
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard Privacy Opt-In */}
      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span>🏆</span> Public Leaderboard Privacy
        </h3>
        <p className="text-sm text-gray-500">
          Control whether your verified donation count is listed on public rankings. By default, you are private.
        </p>

        <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.user.leaderboardOptIn}
            onChange={(e) => mutate({ leaderboardOptIn: e.target.checked })}
            className="w-5 h-5 rounded text-rose-600 mt-0.5"
          />
          <div>
            <span className="font-bold text-sm text-gray-900 dark:text-white block">
              Show me on public leaderboard
            </span>
            <span className="text-xs text-gray-500">
              Only your first name, initial, and donation count are shown. Never your phone, email, or exact address.
            </span>
          </div>
        </label>
      </div>

      {/* Digital Donor Card QR Link Privacy */}
      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span>💳</span> Donor Card QR Privacy
        </h3>
        <p className="text-sm text-gray-500">
          Manage your digital donor card's public verification link. You can disable public QR lookups or regenerate the unguessable URL at any time.
        </p>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-sm text-gray-900 dark:text-white block">
                Enable Public QR Verification
              </span>
              <span className="text-xs text-gray-500">
                When disabled, scanning your card returns an inactive notice.
              </span>
            </div>
            <input
              type="checkbox"
              checked={data.donor?.qrEnabled !== false && data.user?.donorCardQrEnabled !== false}
              onChange={(e) => mutate({ donorCardQrEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-rose-600"
            />
          </label>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Regenerate link if your QR code was shared without permission:
            </span>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Regenerate QR verification link? Old printed or saved QR codes will stop working.')) return;
                try {
                  const res = await api.post('/donors/card/regenerate-token');
                  toast.success('New QR verification link generated!');
                } catch {
                  toast.error('Failed to regenerate token.');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold transition"
            >
              Regenerate QR Link
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} className="text-brand-500" /> Blocked Users</h3>
        <p className="text-sm text-gray-500">Users you block will not be able to see your requests, donor profile, or contact you.</p>
        
        {data.user.blockedUsers?.length > 0 ? (
          <div className="text-sm text-gray-500">You have {data.user.blockedUsers.length} blocked user(s).</div>
        ) : (
          <div className="text-sm text-gray-400 italic">No users blocked.</div>
        )}
      </div>

    </div>
  );
}
