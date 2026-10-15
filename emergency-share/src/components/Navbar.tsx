// components/Navbar.tsx
import { Moon, Sun, Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const LANGS = ['en', 'ta', 'kn', 'hi'] as const
const LANG_LABELS: Record<string, string> = {
  en: 'EN', ta: 'தமிழ்', kn: 'ಕನ್ನಡ', hi: 'हिं',
}

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const { i18n } = useTranslation()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 backdrop-blur-md border-b"
      style={{
        background: 'rgba(var(--color-bg-rgb, 255,255,255), 0.85)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 font-black text-lg select-none">
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-black"
          style={{ background: 'var(--color-accent)' }}
        >
          <Droplets size={16} strokeWidth={3} />
        </span>
        <span style={{ color: 'var(--color-accent)' }}>Blood</span>
        <span style={{ color: 'var(--color-text)' }}>Share</span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Lang switcher */}
        <div className="flex gap-1">
          {LANGS.map((lng) => (
            <button
              key={lng}
              onClick={() => i18n.changeLanguage(lng)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                i18n.language === lng
                  ? 'text-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={
                i18n.language === lng
                  ? { background: 'var(--color-accent)' }
                  : { background: 'var(--color-surface-2)' }
              }
            >
              {LANG_LABELS[lng]}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}
