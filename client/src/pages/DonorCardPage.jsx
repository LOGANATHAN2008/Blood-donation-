import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { BRAND } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import InviteButton from '../components/referral/InviteButton';

export default function DonorCardPage() {
  const { user, token, setIsProfilePopupOpen } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchDonorCard() {
      try {
        setLoading(true);
        const res = await fetch('/api/donors/card', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCardData(data);
          if (data.verifyUrl) {
            const qrUrl = await QRCode.toDataURL(data.verifyUrl, {
              width: 160,
              margin: 1,
              color: { dark: '#111827', light: '#FFFFFF' }
            });
            setQrDataUrl(qrUrl);
          }
        } else {
          setCardData(null);
        }
      } catch (err) {
        console.error('Failed to fetch donor card:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDonorCard();
  }, [token]);

  // Sample card data if user is not a donor
  const isDonor = !!cardData;
  const isProfileComplete = user?.profileStatus?.isComplete;

  const displayData = cardData || {
    name: user?.name || 'Venkatesh Kumar',
    bloodGroup: 'O+',
    state: user?.state || 'Tamil Nadu',
    district: user?.district || 'Chennai',
    donorId: 'BD-SAMPLE',
    available: true,
    eligible: true,
    nextEligibleDate: null,
    totalDonations: 3
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f172a'
      });
      const link = document.createElement('a');
      link.download = `DonorCard_${displayData.donorId || 'LifeConnect'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card downloaded in HD (2x)!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to generate PNG image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = cardData?.verifyUrl || `${window.location.origin}/donor-card`;
    const shareTitle = `${displayData.name}'s Verified Blood Donor Card`;
    const shareText = `I am a verified ${displayData.bloodGroup} blood donor on ${BRAND.fullName}! Join me in saving lives.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    // Fallback: copy link and open WhatsApp
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Link copied! Opening WhatsApp...');
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
          💳 Official Credential
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          {t('donorCard')}
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          Your portable digital donor identity with unguessable QR validation for hospitals and camps.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading your verified card...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Status Banners */}
          {!user ? (
            <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs text-amber-900 dark:text-amber-200 mb-2">
                🔒 You are viewing a sample preview. Sign in to access your personal verified donor card.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition"
              >
                Sign In / Register
              </button>
            </div>
          ) : !isDonor ? (
            <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200 uppercase">
                {t('samplePreview')}
              </span>
              <p className="text-xs text-rose-900 dark:text-rose-200 my-2">
                You haven't registered as a blood donor yet. Register now to generate your official verified card!
              </p>
              <button
                onClick={() => navigate('/donors')}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition"
              >
                {t('becomeDonor')}
              </button>
            </div>
          ) : !isProfileComplete ? (
            <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center">
              <p className="text-xs text-blue-900 dark:text-blue-200 mb-2">
                Your profile is missing details (e.g. date of birth, phone). Complete it to activate full card benefits.
              </p>
              <button
                onClick={() => setIsProfilePopupOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
              >
                {t('completeProfileCTA')}
              </button>
            </div>
          ) : null}

          {/* Premium Glossy Donor Card */}
          <div
            ref={cardRef}
            id="donor-card-element"
            className="w-full max-w-md relative overflow-hidden rounded-3xl p-6 md:p-7 shadow-2xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 45%, #881337 100%)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(225, 29, 72, 0.25)'
            }}
          >
            {/* Watermark Logo / Ambient Orbs */}
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            {/* Top Bar: Brand & Verified Pill */}
            <div className="relative flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🩸</span>
                <div>
                  <div className="text-xs font-black tracking-wider uppercase text-rose-400">
                    {BRAND.fullName}
                  </div>
                  <div className="text-[10px] text-gray-300 font-medium tracking-tight">
                    {BRAND.tagline}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                <span>✓</span>
                <span>{t('verifiedDonor')}</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="relative my-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Donor Name
                </div>
                <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {displayData.name}
                </div>
                <div className="text-xs text-rose-200/90 font-medium flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{displayData.district}, {displayData.state}</span>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/10 text-gray-200 border border-white/10 font-bold">
                    {displayData.donorId || 'BD-000000'}
                  </span>
                </div>
              </div>

              {/* Blood Drop Badge */}
              <div className="relative flex flex-col items-center justify-center w-20 h-24 rounded-2xl bg-gradient-to-b from-rose-500 to-red-700 shadow-xl shadow-red-900/50 border border-rose-300/40 text-white flex-shrink-0">
                <span className="text-2xl font-black tracking-tight">{displayData.bloodGroup}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-100 mt-1">GROUP</span>
              </div>
            </div>

            {/* Eligibility & Metrics Grid */}
            <div className="relative grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Status</span>
                <span className={`font-bold flex items-center gap-1.5 ${displayData.available ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {displayData.available ? 'Available' : 'Resting'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">{t('nextEligible')}</span>
                <span className="font-bold text-white">
                  {displayData.eligible
                    ? t('eligibleNow')
                    : displayData.nextEligibleDate
                    ? new Date(displayData.nextEligibleDate).toLocaleDateString()
                    : 'Eligible'}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-white/5 flex justify-between items-center text-[11px]">
                <span className="text-gray-400">{t('totalDonations')}:</span>
                <span className="font-bold text-rose-400 text-sm">
                  {displayData.totalDonations || 0} times saved lives
                </span>
              </div>
            </div>

            {/* Bottom Row: QR & Scan instructions */}
            <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">
                <div className="font-bold text-gray-200 text-xs mb-0.5">{t('scanToVerify')}</div>
                Instant authentic verification. No personal contact details are revealed.
              </div>
              <div className="p-1.5 rounded-xl bg-white shadow-md flex-shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verify QR Code" className="w-16 h-16 md:w-20 md:h-20" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-mono">
                    QR
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full max-w-md">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <span>📥</span>
              <span>{downloading ? 'Rendering...' : t('downloadCard')}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-gray-700 shadow-md transition active:scale-95"
            >
              <span>🔗</span>
              <span>{t('shareCard')}</span>
            </button>
          </div>

          {/* Home Screen Hint */}
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 max-w-md text-center text-xs text-gray-500 dark:text-gray-400">
            💡 {t('addToHomeScreenHint')}
          </div>

          {/* Invite Friends Referral Card */}
          <div className="mt-6 w-full max-w-md">
            <InviteButton />
          </div>
        </div>
      )}
    </div>
  );
}
