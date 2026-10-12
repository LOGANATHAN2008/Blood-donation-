import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { BRAND } from '../../config/brand';

export default function InviteButton({ variant = 'card' }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const refCode = user?.referralCode || '';
  const siteUrl = window.location.origin;
  const inviteUrl = refCode ? `${siteUrl}/auth?ref=${refCode}` : siteUrl;

  const shareText = `🩸 Join ${BRAND.fullName} to donate blood and save lives together! Register as a lifesaver in under 2 minutes: ${inviteUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${BRAND.fullName}`,
          text: shareText,
          url: inviteUrl
        });
        toast.success('Invite shared!');
        return;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn(e);
      }
    }

    // WhatsApp fallback
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Referral invite link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
      >
        <span>💬</span>
        <span>{t('inviteFriends')}</span>
      </button>
    );
  }

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-left">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
            {t('inviteFriends')}
          </h4>
        </div>
        {user?.referralCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            {t('friendsInvited')}: {user.referralCount}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
        Share your unique referral link with family and friends to strengthen the emergency donor community.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShare}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          <span>💬</span>
          <span>WhatsApp / Share</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="py-2 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          {copied ? '✓ Copied' : '📋 Copy Link'}
        </button>
      </div>
    </div>
  );
}
