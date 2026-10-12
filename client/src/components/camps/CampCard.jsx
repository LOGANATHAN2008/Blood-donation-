import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function CampCard({ camp, onUpdated }) {
  const { token, user } = useAuth();
  const { t } = useLang();

  const [interested, setInterested] = useState(camp.isInterested || false);
  const [interestCount, setInterestCount] = useState(camp.interestedCount || 0);
  const [toggling, setToggling] = useState(false);

  const handleToggleInterest = async () => {
    if (!token) {
      toast.error('Please sign in to register your interest.');
      return;
    }
    try {
      setToggling(true);
      const res = await fetch(`/api/camps/${camp._id}/interest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInterested(data.isInterested);
        setInterestCount(data.count);
        toast.success(data.isInterested ? "You're registered as interested! 🩸" : "Interest removed.");
        if (onUpdated) onUpdated();
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setToggling(false);
    }
  };

  const handleAddToCalendar = () => {
    // Generate .ics file content
    const d = new Date(camp.date);
    const startStr = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const endStr = end.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LifeConnect//BloodDonationCamp//EN',
      'BEGIN:VEVENT',
      `UID:${camp._id}@Blood.loganathanm.in`,
      `DTSTAMP:${startStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Blood Donation Camp: ${camp.title}`,
      `DESCRIPTION:Organized by ${camp.organizer}. Venue: ${camp.venue}, ${camp.district}`,
      `LOCATION:${camp.venue}, ${camp.district}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${camp.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar event downloaded (.ics)!');
  };

  const handleWhatsAppShare = () => {
    const text = `🩸 *Blood Donation Camp: ${camp.title}*\n📅 Date: ${new Date(camp.date).toLocaleDateString()}\n⏰ Time: ${camp.startTime} - ${camp.endTime}\n📍 Venue: ${camp.venue}, ${camp.district}\n🤝 Organized by: ${camp.organizer}\n\nJoin us and save lives! More info: ${window.location.origin}/campaigns`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleReport = async () => {
    if (!confirm('Report this camp listing for incorrect info or abuse?')) return;
    try {
      const res = await fetch(`/api/camps/${camp._id}/report`, { method: 'POST' });
      if (res.ok) {
        toast.success('Report submitted to moderators.');
      }
    } catch {
      toast.error('Report failed.');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
      {/* Poster image if available */}
      {camp.posterUrl ? (
        <div className="h-44 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
          <img src={camp.posterUrl} alt={camp.title} className="w-full h-full object-cover" />
          {camp.distance != null && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-bold">
              📍 {camp.distance} km away
            </span>
          )}
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 p-4 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛺</span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Approved Blood Camp
            </span>
          </div>
          {camp.distance != null && (
            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
              📍 {camp.distance} km away
            </span>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold">
            <span>📅 {new Date(camp.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>⏰ {camp.startTime} - {camp.endTime}</span>
          </div>

          <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
            {camp.title}
          </h3>

          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-start gap-1.5">
              <span>📍</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{camp.venue}, {camp.district}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <span>🤝</span>
              <span>Organized by: <strong className="text-gray-700 dark:text-gray-300">{camp.organizer}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          {/* Interest Toggle */}
          <button
            onClick={handleToggleInterest}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              interested
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            <span>{interested ? '❤️' : '🤍'}</span>
            <span>{interested ? "I'm Going" : t('interested')}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
              {interestCount}
            </span>
          </button>

          {/* Calendar, WhatsApp, Report buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCalendar}
              title={t('addToCalendar')}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs transition"
            >
              📅
            </button>
            <button
              onClick={handleWhatsAppShare}
              title="Share on WhatsApp"
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs transition"
            >
              💬
            </button>
            <button
              onClick={handleReport}
              title="Report issue"
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 text-xs transition"
            >
              ⚠️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
