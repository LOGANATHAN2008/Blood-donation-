// pages/RequestPage.tsx — Live emergency blood request view & share
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { fetchEmergencyRequest, updateRequestStatus, trackShare, getEditToken } from '../lib/api'
import type { BloodRequest } from '../types'
import {
  Droplets,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  CheckCircle2,
  MessageCircle,
  Copy,
  Eye,
  CheckCheck,
} from 'lucide-react'

const URGENCY_COLORS: Record<string, string> = {
  critical:      'bg-red-700 text-white',
  today:         'bg-orange-500 text-white',
  within_3_days: 'bg-yellow-500 text-black',
}

const URGENCY_LABELS: Record<string, string> = {
  critical:      '🔴 Critical (Immediate)',
  today:         '🟠 Needed Today',
  within_3_days: '🟡 Within 3 Days',
}

export default function RequestPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [request, setRequest] = useState<BloodRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const canEdit = id ? Boolean(getEditToken(id) || (request && getEditToken(request.id))) : false

  useEffect(() => {
    let isMounted = true
    if (!id) {
      setLoading(false)
      return
    }

    fetchEmergencyRequest(id)
      .then((data) => {
        if (isMounted) {
          setRequest(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied! Share it on WhatsApp or SMS 🩸')
      if (request?.id) trackShare(request.id).catch(() => {})
    } catch {
      toast.error('Could not copy link')
    }
  }

  const shareWhatsApp = () => {
    if (!request) return
    const message = `🚨 *URGENT BLOOD NEEDED* 🩸\n\n` +
      `*Blood Group*: ${request.bloodGroup} (${request.units} unit${request.units > 1 ? 's' : ''} - ${request.component.replace('_', ' ')})\n` +
      `*Patient*: ${request.patientName}\n` +
      `*Hospital*: ${request.hospitalName}, ${request.hospitalArea ? request.hospitalArea + ', ' : ''}${request.city}\n` +
      `*Contact*: +91 ${request.contactPhone} (${request.contactName || 'Requester'})\n` +
      (request.note ? `*Note*: ${request.note}\n` : '') +
      `\n🔗 *Respond / Share*: ${window.location.href}`

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    if (request.id) trackShare(request.id).catch(() => {})
  }

  const handleMarkFulfilled = async () => {
    if (!request) return
    setUpdating(true)
    const ok = await updateRequestStatus(request.id, 'fulfilled')
    if (ok) {
      setRequest({ ...request, status: 'fulfilled' })
      toast.success('Marked as fulfilled! Thank you 🩸')
    } else {
      toast.error('Failed to update status. Please try again.')
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh] gap-4 px-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          Loading emergency request…
        </p>
      </div>
    )
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
  const formattedDate = !isNaN(neededByDate.getTime())
    ? neededByDate.toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : request.neededBy

  const isFulfilled = request.status === 'fulfilled'

  return (
    <div className="max-w-xl mx-auto px-4 pb-36 animate-fade-in">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
              CODE #{request.id}
            </p>
            <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>
              Emergency Blood Request
            </h1>
          </div>
        </div>

        {/* Live sync badge */}
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* ── Status Banner if Fulfilled ── */}
      {isFulfilled && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-600 text-white flex items-center gap-3 shadow-lg">
          <CheckCheck size={28} className="shrink-0" />
          <div>
            <p className="font-bold text-base">Blood Arranged / Fulfilled</p>
            <p className="text-xs text-emerald-100">
              Thank you to all donors who responded! This emergency request has been resolved.
            </p>
          </div>
        </div>
      )}

      {/* ── Blood group hero card ── */}
      <div
        className="card mb-4 flex items-center gap-5 relative overflow-hidden"
        style={{ border: isFulfilled ? '2px solid #10B981' : '2px solid var(--color-accent)' }}
      >
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: isFulfilled ? '#10B981' : 'var(--color-accent)' }}
        />
        <div
          className="w-20 h-20 rounded-[60%_60%_50%_50%/70%_70%_40%_40%] flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg"
          style={{
            background: isFulfilled
              ? 'linear-gradient(135deg, #10B981, #047857)'
              : 'linear-gradient(135deg, #EF5350, #B71C1C)',
          }}
        >
          {request.bloodGroup}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                isFulfilled ? 'bg-emerald-600 text-white' : (URGENCY_COLORS[request.urgency] || 'bg-red-700 text-white')
              }`}
            >
              {isFulfilled ? '✅ Arranged' : (URGENCY_LABELS[request.urgency] || request.urgency)}
            </span>
            {request.viewCount > 0 && (
              <span className="text-xs flex items-center gap-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                <Eye size={12} /> {request.viewCount} views
              </span>
            )}
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {request.units} unit{request.units > 1 ? 's' : ''} — {request.component.replace('_', ' ')}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            For <strong style={{ color: 'var(--color-text)' }}>{request.patientName}</strong>
          </p>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="card mb-4 flex flex-col gap-3">
        <DetailRow icon={<MapPin size={16} />} label="Hospital & Location">
          {request.hospitalName}{request.hospitalArea ? `, ${request.hospitalArea}` : ''}, {request.city}
        </DetailRow>
        <DetailRow icon={<Clock size={16} />} label="Needed by">
          {formattedDate}
        </DetailRow>
        <DetailRow icon={<Phone size={16} />} label="Contact Person">
          {request.contactName ? `${request.contactName} (+91 ${request.contactPhone})` : `+91 ${request.contactPhone}`}
        </DetailRow>
        {request.note && (
          <DetailRow icon={<CheckCircle2 size={16} />} label="Doctor's / Family Note">
            {request.note}
          </DetailRow>
        )}
      </div>

      {/* ── Creator Actions (Mark Fulfilled) ── */}
      {canEdit && !isFulfilled && (
        <div className="card mb-4 p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Request Creator Controls
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Blood arranged already? Mark it fulfilled to stop notifications.
            </p>
          </div>
          <button
            onClick={handleMarkFulfilled}
            disabled={updating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 shadow-sm"
          >
            {updating ? 'Updating…' : 'Mark Fulfilled'}
          </button>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-xs text-center px-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {t('disclaimer')}
      </p>

      {/* ── Sticky share/call bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-40"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 85%, transparent)' }}
      >
        <div className="max-w-xl mx-auto flex gap-2">
          {!isFulfilled ? (
            <a
              href={`tel:+91${request.contactPhone}`}
              id="btn-call"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-md"
              style={{ background: '#1B5E20' }}
            >
              <Phone size={20} strokeWidth={2.5} />
              Call Requester
            </a>
          ) : (
            <div
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm bg-gray-500 opacity-80 cursor-not-allowed"
            >
              <CheckCircle2 size={18} />
              Request Fulfilled
            </div>
          )}

          <button
            id="btn-whatsapp"
            onClick={shareWhatsApp}
            className="px-5 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D]"
            title="Share directly to WhatsApp"
          >
            <MessageCircle size={20} strokeWidth={2.5} />
            WhatsApp
          </button>

          <button
            id="btn-share"
            onClick={copyLink}
            className="btn-primary py-4 px-4 flex items-center justify-center"
            title="Copy share link"
          >
            <Copy size={18} />
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

