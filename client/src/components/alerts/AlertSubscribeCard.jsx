import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { INDIA_STATES } from '../../lib/indiaStates';
import indiaDistrictsData from '../../lib/indiaDistricts.json';
import api from '../../lib/api';

const ALL_BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const DEFAULT_VAPID_PUBLIC_KEY = 'BKKXKxYRtEEy0gq3ZGa6xpbxA21QMKDYooi8vREkLMCP08lWweU3Y6XD0DMKHayYC9JytRbS_0YDGVoxaMVSxHc';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AlertSubscribeCard({ compact = false }) {
  const { user, dbUser, idToken, token: ctxToken } = useAuth();
  const { t } = useLang();

  // If user is logged in, resolve active user token
  const isLoggedIn = Boolean(
    user || 
    localStorage.getItem('mock_user') || 
    localStorage.getItem('mock_email')
  );

  const [selectedGroups, setSelectedGroups] = useState(['O+']);
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [permissionState, setPermissionState] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (user?.state || dbUser?.state) setSelectedState(user?.state || dbUser?.state);
    if (user?.district || dbUser?.district) setSelectedDistrict(user?.district || dbUser?.district);
    if (user?.bloodGroup || dbUser?.bloodGroup) {
      const bg = user?.bloodGroup || dbUser?.bloodGroup;
      if (ALL_BLOOD_GROUPS.includes(bg)) {
        setSelectedGroups([bg]);
      }
    }
  }, [user, dbUser]);

  // Check if current browser is subscribed
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    }).catch(() => {});
  }, []);

  const toggleGroup = (bg) => {
    if (selectedGroups.includes(bg)) {
      if (selectedGroups.length === 1) {
        toast.error('Select at least one blood group.');
        return;
      }
      setSelectedGroups(selectedGroups.filter((g) => g !== bg));
    } else {
      setSelectedGroups([...selectedGroups, bg]);
    }
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to subscribe to blood alerts.');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Web Push is not supported in this browser.');
      return;
    }

    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        toast.error('Permission denied. Please allow notifications in site settings.');
        return;
      }

      // 1. Get VAPID public key
      let publicKey = DEFAULT_VAPID_PUBLIC_KEY;
      try {
        const keyRes = await api.get('/push/public-key');
        if (keyRes.data?.publicKey) {
          publicKey = keyRes.data.publicKey;
        }
      } catch (e) {
        console.warn('Using default VAPID key fallback:', e.message);
      }

      // 2. Register service worker push subscription
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // 3. Save subscription to backend using authenticated api client
      const res = await api.post('/push/subscribe', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth'))))
        },
        bloodGroups: selectedGroups,
        state: selectedState,
        district: selectedDistrict,
        urgencyFilter
      });

      if (res.data?.success) {
        setIsSubscribed(true);
        toast.success('Subscribed! You will get alerts when blood is urgently needed nearby.');
      } else {
        toast.error('Failed to save push subscription.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Subscription failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setLoading(true);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        try {
          await api.post('/push/unsubscribe', { endpoint: sub.endpoint });
        } catch {}
      }
      setIsSubscribed(false);
      toast.success('Unsubscribed from device push alerts.');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      toast.error('Error unsubscribing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setTesting(true);
      const res = await api.post('/push/test');
      if (res.data?.success) {
        toast.success('Test alert dispatched! Check your notification tray.');
      } else {
        toast.error(res.data?.error || 'Failed to dispatch test notification.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Network error.');
    } finally {
      setTesting(false);
    }
  };

  const availableDistricts = selectedState && indiaDistrictsData[selectedState] ? indiaDistrictsData[selectedState] : [];

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border border-rose-500/25 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            🔔
          </span>
          <div>
            <h3 className="font-extrabold text-base md:text-lg text-gray-900 dark:text-white">
              {t('subscribeAlerts')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('subscribePushCTA')}
            </p>
          </div>
        </div>

        {isSubscribed && (
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
            <span>●</span> Active on this device
          </span>
        )}
      </div>

      {/* Permission Denied Alert */}
      {permissionState === 'denied' && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          ⚠️ {t('permissionDenied')}
        </div>
      )}

      {/* Multi-select Blood Groups */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          Blood Group(s) You Can Donate:
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedGroups.includes(bg);
            return (
              <button
                key={bg}
                type="button"
                onClick={() => toggleGroup(bg)}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-rose-400'
                }`}
              >
                {bg}
              </button>
            );
          })}
        </div>
      </div>

      {/* State & District & Urgency filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs">
        <div>
          <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {INDIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Districts</option>
            {selectedDistrict && !availableDistricts.includes(selectedDistrict) && (
              <option value={selectedDistrict}>{selectedDistrict}</option>
            )}
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('alertUrgency')}</label>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="All">{t('allAlerts')}</option>
            <option value="UrgentCritical">{t('urgentAndCritical')}</option>
            <option value="Critical">{t('criticalOnly')}</option>
          </select>
        </div>
      </div>

      {/* Subscription Action Row */}
      <div className="flex flex-wrap items-center gap-3">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 min-w-[170px] py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Subscribing...' : '🔔 Enable Web Push Alerts'}
          </button>
        ) : (
          <>
            <button
              onClick={handleSendTest}
              disabled={testing}
              className="py-2.5 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
            >
              {testing ? 'Sending...' : `🚀 ${t('sendTestAlert')}`}
            </button>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl text-red-600 dark:text-red-400 font-semibold text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            >
              Unsubscribe Device
            </button>
          </>
        )}
      </div>
    </div>
  );
}
