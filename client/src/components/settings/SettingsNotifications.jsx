import { useState } from 'react';
import { Bell, BellOff, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import AlertSubscribeCard from '../alerts/AlertSubscribeCard';

export default function SettingsNotifications({ data, mutate, isPending }) {
  const [form, setForm] = useState({
    urgencyFilter: data.user.urgencyFilter || 'All',
    campReminders: data.user.campReminders ?? true,
    medicineAlerts: data.user.medicineAlerts ?? true,
    pushOptIn: data.user.pushOptIn ?? false,
    quietHoursEnabled: data.user.quietHours?.enabled ?? false,
    quietHoursStart: data.user.quietHours?.start || '22:00',
    quietHoursEnd: data.user.quietHours?.end || '07:00',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(f => ({ ...f, [name]: val }));

    if (name.startsWith('quietHours')) {
      const qh = {
        enabled: name === 'quietHoursEnabled' ? val : form.quietHoursEnabled,
        start: name === 'quietHoursStart' ? val : form.quietHoursStart,
        end: name === 'quietHoursEnd' ? val : form.quietHoursEnd,
      };
      mutate({ quietHours: qh });
    } else if (name === 'pushOptIn' && val === true) {
      // Simulate requesting notification permissions
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            toast.success('Push notifications enabled!');
            mutate({ pushOptIn: true });
          } else {
            toast.error('Permission denied. Please enable in browser settings.');
            setForm(f => ({ ...f, pushOptIn: false }));
          }
        });
      } else {
        toast.error('Push notifications are not supported in this browser.');
        setForm(f => ({ ...f, pushOptIn: false }));
      }
    } else {
      mutate({ [name]: val });
    }
  };

  const handleBlur = (e) => {
    if (e.target.name.startsWith('quietHours')) {
      mutate({
        quietHours: {
          enabled: form.quietHoursEnabled,
          start: form.quietHoursStart,
          end: form.quietHoursEnd,
        }
      });
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Notifications</h2>
        <p className="text-sm text-gray-500">Control how and when we alert you.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Push & Browser Notifications</h3>
        
        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" name="pushOptIn" checked={form.pushOptIn} onChange={handleChange} />
          <div>
            <p className="font-bold flex items-center gap-2">
              {form.pushOptIn ? <Bell size={16} className="text-brand-500" /> : <BellOff size={16} className="text-gray-400" />}
              Enable Push Notifications
            </p>
            <p className="text-sm text-gray-500">Receive alerts even when the app is closed (requires browser permission).</p>
          </div>
        </label>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg">What to notify me about</h3>
        
        <div>
          <label className="label">Blood Requests (Urgency Filter)</label>
          <select className="input" name="urgencyFilter" value={form.urgencyFilter} onChange={handleChange}>
            <option value="All">All Requests (Normal, Urgent, Critical)</option>
            <option value="UrgentCritical">Urgent & Critical only</option>
            <option value="Critical">Critical only</option>
          </select>
        </div>

        <label className="flex items-start gap-3 py-2 cursor-pointer">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" name="campReminders" checked={form.campReminders} onChange={handleChange} />
          <div>
            <p className="font-bold">Blood Donation Camps</p>
            <p className="text-sm text-gray-500">Alert me about mega camps in my district.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 py-2 cursor-pointer">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" name="medicineAlerts" checked={form.medicineAlerts} onChange={handleChange} />
          <div>
            <p className="font-bold">Medicine Availability</p>
            <p className="text-sm text-gray-500">Alert me when someone shares free medicines nearby.</p>
          </div>
        </label>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <VolumeX size={20} className={form.quietHoursEnabled ? "text-indigo-500" : "text-gray-400"} />
          <h3 className="font-bold text-lg">Quiet Hours</h3>
        </div>
        
        <label className="flex items-center gap-3 py-2 cursor-pointer mb-2">
          <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" name="quietHoursEnabled" checked={form.quietHoursEnabled} onChange={handleChange} />
          <span className="font-bold">Enable Quiet Hours</span>
        </label>

        {form.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <div>
              <label className="label text-indigo-800 dark:text-indigo-300">From</label>
              <input type="time" className="input" name="quietHoursStart" value={form.quietHoursStart} onChange={handleChange} onBlur={handleBlur} />
            </div>
            <div>
              <label className="label text-indigo-800 dark:text-indigo-300">To</label>
              <input type="time" className="input" name="quietHoursEnd" value={form.quietHoursEnd} onChange={handleChange} onBlur={handleBlur} />
            </div>
            <p className="col-span-2 text-xs text-indigo-600 dark:text-indigo-400">
              During these hours, all notifications will be silenced <strong>except Critical emergencies</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <AlertSubscribeCard />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 flex items-center gap-2">
          {isPending ? <span className="animate-pulse">Saving changes...</span> : 'All changes are automatically saved.'}
        </span>
      </div>
    </div>
  );
}
