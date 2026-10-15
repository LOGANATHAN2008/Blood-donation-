// pages/HomePage.tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Droplets, Search, ChevronRight, Heart, Share2, Zap } from 'lucide-react'

const BLOOD_DROP_ANIM = `
  @keyframes floatDrop {
    0%, 100% { transform: translateY(0) rotate(-15deg); }
    50%       { transform: translateY(-12px) rotate(-15deg); }
  }
`

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const goToCode = () => {
    const c = code.trim().toUpperCase()
    if (c.length > 0) navigate(`/r/${c}`)
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100dvh-60px)] px-5 pb-10 animate-fade-in">
      <style>{BLOOD_DROP_ANIM}</style>

      {/* ── Hero ── */}
      <div className="flex flex-col items-center text-center pt-12 pb-8 max-w-sm w-full">
        {/* Animated blood drop */}
        <div
          className="mb-6 relative"
          style={{ animation: 'floatDrop 3s ease-in-out infinite' }}
        >
          <div
            className="w-28 h-28 rounded-[60%_60%_50%_50%/70%_70%_40%_40%] flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #EF5350 0%, #D32F2F 50%, #B71C1C 100%)',
              boxShadow: '0 20px 60px rgba(211,47,47,.5)',
            }}
          >
            <Droplets size={52} color="white" strokeWidth={2.5} />
          </div>
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 -z-10"
            style={{ background: '#D32F2F', transform: 'scale(1.4)' }}
          />
        </div>

        <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--color-text)' }}>
          {t('home_title')}
        </h1>
        <p className="text-lg font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('home_tagline')}
        </p>

        {/* ── Primary CTA ── */}
        <button
          id="btn-request-blood"
          onClick={() => navigate('/create')}
          className="btn-primary mb-4 text-xl py-5 relative overflow-hidden group"
          style={{ fontSize: '1.2rem' }}
        >
          <span className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity" />
          <Droplets size={24} strokeWidth={3} />
          {t('request_blood')}
          <ChevronRight size={20} className="ml-auto" />
        </button>

        {/* ── Secondary CTA ── */}
        <div className="w-full card flex gap-2 p-4">
          <input
            ref={inputRef}
            id="input-request-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goToCode()}
            placeholder="e.g. K7P2M9QA"
            maxLength={8}
            className="input-field flex-1 py-3 uppercase tracking-widest font-mono"
          />
          <button
            id="btn-go-code"
            onClick={goToCode}
            className="flex items-center gap-1 px-5 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'var(--color-accent)' }}
          >
            <Search size={18} />
            {t('go')}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {t('view_by_code')}
        </p>
      </div>

      {/* ── How it works ── */}
      <div className="max-w-sm w-full mt-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Droplets size={22} />, label: 'Post in 60s' },
            { icon: <Share2 size={22} />, label: 'Share instantly' },
            { icon: <Zap size={22} />, label: 'Reach donors' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="card flex flex-col items-center gap-2 py-4 text-center animate-slide-up"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(211,47,47,.12)', color: 'var(--color-accent)' }}
              >
                {icon}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div
        className="max-w-sm w-full mt-8 rounded-xl px-4 py-3 text-xs text-center flex items-start gap-2"
        style={{ background: 'rgba(211,47,47,.08)', color: 'var(--color-text-muted)' }}
      >
        <Heart size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
        {t('disclaimer')}
      </div>
    </div>
  )
}
