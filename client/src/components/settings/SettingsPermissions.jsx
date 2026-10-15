import { useState, useEffect } from "react";
import { MapPin, Bell, CheckCircle2, XCircle, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const STATUS_META = {
  granted: {
    label: "Allowed",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  denied: {
    label: "Blocked",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    Icon: XCircle,
  },
  prompt: {
    label: "Not set",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    Icon: AlertCircle,
  },
  unsupported: {
    label: "Unsupported",
    color: "text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    dot: "bg-gray-400",
    Icon: XCircle,
  },
};

function PermissionRow({ icon: Icon, iconColor, title, description, status, onRequest, loading }) {
  const meta = STATUS_META[status] || STATUS_META.prompt;
  const StatusIcon = meta.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border ${meta.bg} ${meta.border} transition-all`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconColor}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color} border ${meta.border} bg-white/60 dark:bg-gray-900/40`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${status === "granted" ? "animate-pulse" : ""}`} />
            {meta.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {status === "denied" ? (
          <button
            onClick={() => toast("Open your browser Site Settings to allow this permission.", { icon: "??", duration: 4000 })}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
          >
            Open Settings <ChevronRight size={14} />
          </button>
        ) : status === "prompt" ? (
          <button
            onClick={onRequest}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60 transition-colors whitespace-nowrap shadow-sm"
          >
            {loading ? "Asking…" : "Allow"}
          </button>
        ) : status === "granted" ? (
          <StatusIcon size={20} className={meta.color} />
        ) : null}
      </div>
    </motion.div>
  );
}

export default function SettingsPermissions() {
  const [locationStatus, setLocationStatus] = useState("prompt");
  const [notifStatus, setNotifStatus] = useState("prompt");
  const [locationLoading, setLocationLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const checkPermissions = async () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
    } else if ("permissions" in navigator) {
      try {
        const res = await navigator.permissions.query({ name: "geolocation" });
        setLocationStatus(res.state);
        res.onchange = () => setLocationStatus(res.state);
      } catch {
        setLocationStatus("prompt");
      }
    }
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else {
      const p = Notification.permission;
      setNotifStatus(p === "default" ? "prompt" : p);
    }
  };

  useEffect(() => { checkPermissions(); }, [refreshKey]);

  const requestLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => { toast.success("?? Location access granted!"); setLocationStatus("granted"); setLocationLoading(false); },
      () => { toast.error("Location access was denied."); setLocationStatus("denied"); setLocationLoading(false); },
      { timeout: 10000 }
    );
  };

  const requestNotification = async () => {
    if (!("Notification" in window)) return;
    setNotifLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        toast.success("?? Notifications enabled!");
        setNotifStatus("granted");
        try { new Notification("Life Connect ??", { body: "You will receive emergency blood request alerts.", icon: "/logo.png" }); } catch {}
      } else {
        toast.error("Notification permission was denied.");
        setNotifStatus("denied");
      }
    } finally {
      setNotifLoading(false);
    }
  };

  const allGranted = locationStatus === "granted" && notifStatus === "granted";

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Permissions</h2>
          <p className="text-sm text-gray-500">Location and notification permissions used by Life Connect.</p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Refresh permission status"
        >
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      <AnimatePresence>
        {allGranted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">All permissions granted</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">Life Connect can alert you about emergency blood requests near you.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider px-1">App Permissions</h3>
        <PermissionRow
          icon={MapPin}
          iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
          title="Location"
          description="Used to match you with nearby blood requests, donors, and donation camps in your area."
          status={locationStatus}
          onRequest={requestLocation}
          loading={locationLoading}
        />
        <PermissionRow
          icon={Bell}
          iconColor="bg-gradient-to-br from-rose-500 to-red-600"
          title="Notifications"
          description="Sends real-time alerts for critical blood requests, camp reminders, and donation acknowledgements."
          status={notifStatus}
          onRequest={requestNotification}
          loading={notifLoading}
        />
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider px-1">Why we need these</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-blue-500" />
              <span className="font-bold text-sm text-blue-700 dark:text-blue-400">Location</span>
            </div>
            <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 space-y-1 list-disc list-inside">
              <li>Find donors within 5–10 km</li>
              <li>Sort requests by distance</li>
              <li>Show nearby camps &amp; hospitals</li>
              <li>Auto-fill city/district on forms</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-rose-500" />
              <span className="font-bold text-sm text-rose-700 dark:text-rose-400">Notifications</span>
            </div>
            <ul className="text-xs text-rose-600/80 dark:text-rose-400/80 space-y-1 list-disc list-inside">
              <li>Instant critical blood alerts</li>
              <li>Donation camp reminders</li>
              <li>Free medicine availability</li>
              <li>Donation acknowledgements</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <AlertCircle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Your exact location is <strong>never stored or shared</strong>. It is only used to calculate distances on your device.
          You can revoke permissions at any time from your browser&apos;s Site Settings.
        </p>
      </div>
    </div>
  );
}
