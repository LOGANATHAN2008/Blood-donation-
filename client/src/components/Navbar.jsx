import { Link, useLocation } from 'react-router-dom';
import { 
  Wifi, WifiOff, Sun, Moon, Globe, Menu, X, Heart, Settings, ChevronRight,
  Home, AlertTriangle, Droplet, Building2, Pill, User, LogOut, Shield
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { useSocket } from '../context/SocketContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from './brand/Logo';

export default function Navbar() {
  const { user, dbUser } = useAuth();
  const { dark, toggle } = useTheme();
  const { t, lang, switchLang } = useLang();
  const { connected } = useSocket();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navLinks = [
    { href: '/',          label: t('home'),          icon: Home,          color: 'bg-blue-500' },
    { href: '/emergency', label: 'Emergency',        icon: AlertTriangle, color: 'bg-red-500' },
    { href: '/requests',  label: t('bloodRequests'),  icon: Droplet,       color: 'bg-rose-500' },
    { href: '/hospitals', label: t('hospitals'),      icon: Building2,     color: 'bg-emerald-500' },
    { href: '/medicine',  label: t('medicines'),      icon: Pill,          color: 'bg-teal-500' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out');
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b-[0.33px] border-black/10 dark:border-white/10 backdrop-blur-2xl saturate-[1.8] bg-white/70 dark:bg-[#0f172a]/70">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[52px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-black text-xl">
          <Logo variant="symbol" layoutId="brand-logo" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                href === '/emergency'
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-bold'
                  : location.pathname === href
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {href === '/emergency' && <span className="mr-1 animate-pulse">🚨</span>}
              {label}
            </Link>
          ))}
          {dbUser?.role === 'admin' && (
            <Link to="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50">
              {t('admin')}
            </Link>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium" title={connected ? 'Live' : 'Reconnecting…'}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-gray-500 dark:text-gray-400">{connected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm"
            >
              <Globe size={20} strokeWidth={1.5} />
              <span className="uppercase text-sm">{lang}</span>
            </button>
            
            <AnimatePresence>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-32 z-50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl"
                    style={{ WebkitBackdropFilter: 'blur(24px) saturate(200%)' }}
                  >
                    <div className="flex flex-col py-1.5">
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'ta', label: 'தமிழ்' },
                        { code: 'hi', label: 'हिन्दी' },
                        { code: 'te', label: 'తెలుగు' },
                        { code: 'ml', label: 'മലയാളം' },
                        { code: 'kn', label: 'ಕನ್ನಡ' }
                      ].map(l => (
                        <button
                          key={l.code}
                          onClick={() => { switchLang(l.code); setLangOpen(false); }}
                          className={`px-4 py-2 text-sm text-left transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${lang === l.code ? 'text-brand-600 dark:text-brand-400 font-bold bg-white/40 dark:bg-white/5' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
          </button>

          {/* Profile / Login */}
          <div className="hidden md:flex">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/settings" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Settings">
                  <Settings size={20} />
                </Link>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden">
                    {dbUser?.photoUrl ? <img src={dbUser.photoUrl} alt="P" className="w-full h-full object-cover" /> : (dbUser?.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary py-2 text-sm">
                {t('login')}
              </Link>
            )}
          </div>

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 top-[52px] z-30 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-slate-100/95 dark:bg-[#0f172a]/95 backdrop-blur-3xl saturate-150 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-b-3xl border-b-[0.5px] border-black/10 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 space-y-4 max-h-[calc(100vh-52px)] overflow-y-auto pb-8">
                
                {/* Main Navigation Group */}
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-[14px] overflow-hidden shadow-sm border-[0.5px] border-black/5 dark:border-white/5">
                  {navLinks.map(({ href, label, icon: Icon, color }, idx) => {
                    const isActive = location.pathname === href;
                    return (
                      <Link
                        key={href}
                        to={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 text-[16px] active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                          idx !== navLinks.length - 1 ? 'border-b-[0.5px] border-gray-200/60 dark:border-gray-700/60' : ''
                        } ${
                          href === '/emergency' ? 'text-red-600 dark:text-red-400 font-semibold' : 
                          isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-[8px] ${color} flex items-center justify-center text-white shadow-2xs shrink-0`}>
                            <Icon size={17} strokeWidth={2.2} />
                          </div>
                          <span className={`${
                            href === '/emergency' ? 'text-red-600 dark:text-red-400 font-semibold' : 
                            isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-900 dark:text-gray-100 font-medium'
                          }`}>
                            {label}
                          </span>
                        </div>
                        <ChevronRight size={17} className="text-gray-300 dark:text-gray-600" />
                      </Link>
                    )
                  })}
                </div>

                {/* Secondary Group */}
                {(dbUser?.role === 'admin' || user) && (
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-[14px] overflow-hidden shadow-sm border-[0.5px] border-black/5 dark:border-white/5">
                    {dbUser?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3.5 py-2.5 text-[16px] active:bg-gray-100 dark:active:bg-gray-700/50 border-b-[0.5px] border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[8px] bg-amber-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                            <Shield size={17} strokeWidth={2.2} />
                          </div>
                          <span className="text-amber-600 font-semibold">{t('admin')}</span>
                        </div>
                        <ChevronRight size={17} className="text-amber-300" />
                      </Link>
                    )}
                    {user && (
                      <>
                        <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3.5 py-2.5 text-[16px] active:bg-gray-100 dark:active:bg-gray-700/50 border-b-[0.5px] border-gray-200/60 dark:border-gray-700/60">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-indigo-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                              <User size={17} strokeWidth={2.2} />
                            </div>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{t('profile')}</span>
                          </div>
                          <ChevronRight size={17} className="text-gray-300 dark:text-gray-600" />
                        </Link>
                        <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3.5 py-2.5 text-[16px] active:bg-gray-100 dark:active:bg-gray-700/50 border-b-[0.5px] border-gray-200/60 dark:border-gray-700/60">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-slate-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                              <Settings size={17} strokeWidth={2.2} />
                            </div>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">Settings</span>
                          </div>
                          <ChevronRight size={17} className="text-gray-300 dark:text-gray-600" />
                        </Link>
                        <button onClick={handleLogout} className="flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[16px] active:bg-red-50 dark:active:bg-red-900/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-red-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                              <LogOut size={17} strokeWidth={2.2} />
                            </div>
                            <span className="text-red-600 dark:text-red-400 font-semibold">{t('logout')}</span>
                          </div>
                          <ChevronRight size={17} className="text-red-200 dark:text-red-900" />
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {!user && (
                  <div className="pt-2">
                    <Link to="/auth" onClick={() => setMenuOpen(false)} className="block btn-primary text-[17px] py-3 text-center w-full shadow-md rounded-xl">
                      {t('login')}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
