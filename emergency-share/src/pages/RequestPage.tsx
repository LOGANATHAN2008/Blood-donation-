// pages/RequestPage.tsx  — placeholder for Phase 2 (Firestore + full detail)
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getRequestMock } from '../lib/mockStore'
import { Droplets, Share2, MapPin, Clock, Phone, ChevronLeft, CheckCircle2 } from 'lucide-react'

const URGENCY_COLORS: Record<string, string> = {
  critical:     'bg-red-700',
  today:        'bg-orange-500',
  within_3_days: 'bg-yellow-500',
}

const URGENCY_LABELS: Record<string, string> = {
  critical:     '🔴 Critical',
  today:        '🟠 Today',
  within_3_days: '🟡 Within 3 Days',
}

export default function RequestPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const request = id ? getRequestMock(id) : null

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  if (!id || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh] gap-4 px-6 text-center animate-fade-in">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(211,47,47,.1)' }}
        >
          <Droplets size={40} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Request not found
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This request doesn't exist or may have expired.
        </p>
        <Link to="/" className="btn-primary mt-4" style={{ display: 'inline-flex', width: 'auto', padding: '12px 24px' }}>
          {t('back_home')}
        </Link>
      </div>
    )
  }

  const neededByDate = new Date(request.neededBy)
  const formattedDate = neededByDate.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-xl mx-auto px-4 pb-32 animate-fade-in">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-xs font-mono tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            REQUEST #{request.id}
          </p>
          <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>
            {t('request_placeholder_title')}
          </h1>
        </div>
      </div>

      {/* ── Blood group hero card ── */}
      <div
        className="card mb-4 flex items-center gap-5 relative overflow-hidden"
        style={{ border: '2px solid var(--color-accent)' }}
      >
        {/* Glow blob */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'var(--color-accent)' }}
        />
        <div
          className="w-20 h-20 rounded-[60%_60%_50%_50%/70%_70%_40%_40%] flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #EF5350, #B71C1C)' }}
        >
          {request.bloodGroup}
        </div>
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs font-bold text-white px-3 py-1 rounded-full self-start ${URGENCY_COLORS[request.urgency]}`}
          >
            {URGENCY_LABELS[request.urgency]}
          </span>
          <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {request.units} unit{request.units > 1 ? 's' : ''} — {request.component.replace('_', ' ')}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            For {request.patientName}
          </p>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="card mb-4 flex flex-col gap-3">
        <DetailRow icon={<MapPin size={16} />} label="Hospital">
          {request.hospitalName}, {request.hospitalArea}, {request.city}
        </DetailRow>
        <DetailRow icon={<Clock size={16} />} label="Needed by">
          {formattedDate}
        </DetailRow>
        {request.note && (
          <DetailRow icon={<CheckCircle2 size={16} />} label="Note">
            {request.note}
          </DetailRow>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-center px-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {t('disclaimer')}
      </p>

      {/* ── Sticky share/call bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-40"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)' }}
      >
        <div className="max-w-xl mx-auto flex gap-3">
          <a
            href={`tel:+91${request.contactPhone}`}
            id="btn-call"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
            style={{ background: '#1B5E20' }}
          >
            <Phone size={20} strokeWidth={2.5} />
            Call
          </a>
          <button
            id="btn-share"
            onClick={copyLink}
            className="flex-1 btn-primary py-4"
          >
            <Share2 size={20} />
            {t('share_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(211,47,47,.1)', color: 'var(--color-accent)' }}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {children}
        </p>
      </div>
    </div>
  )
}
