import { motion } from 'framer-motion';
import { 
  Smartphone, 
  HeartPulse, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Clock,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';

export default function HowItWorks() {
  const { t } = useLang();
  const { user } = useAuth();

  const steps = [
    {
      step: '01',
      badge: t('step1Badge') || 'Instant & Secure',
      title: t('step1Title') || 'Register with OTP',
      desc: t('step1Desc') || 'Login with your mobile number via Firebase Phone OTP — fast, secure, and passwordless.',
      highlights: [
        t('step1Highlight1') || 'Instant Phone Verification',
        t('step1Highlight2') || '100% Encrypted & Safe'
      ],
      icon: Smartphone,
      accent: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
      iconBg: 'bg-gradient-to-br from-rose-500/10 to-red-600/20 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
      glow: 'shadow-rose-500/10 dark:shadow-rose-900/20'
    },
    {
      step: '02',
      badge: t('step2Badge') || 'Smart Eligibility',
      title: t('step2Title') || 'Create Your Profile',
      desc: t('step2Desc') || 'Add your blood group, district, and availability. We auto-calculate your 90-day donation eligibility.',
      highlights: [
        t('step2Highlight1') || '90-Day Cooldown Tracker',
        t('step2Highlight2') || 'Privacy-Preserving Details'
      ],
      icon: HeartPulse,
      accent: 'from-amber-500 to-rose-600',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
      iconBg: 'bg-gradient-to-br from-amber-500/10 to-rose-600/20 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
      glow: 'shadow-amber-500/10 dark:shadow-amber-900/20'
    },
    {
      step: '03',
      badge: t('step3Badge') || 'Verified Impact',
      title: t('step3Title') || 'Connect & Save Lives',
      desc: t('step3Desc') || 'Receive instant alerts for compatible emergency requests, attend approved camps, and earn verified badges.',
      highlights: [
        t('step3Highlight1') || 'Real-time Emergency Alerts',
        t('step3Highlight2') || 'Digital Card & Milestones'
      ],
      icon: ShieldCheck,
      accent: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      iconBg: 'bg-gradient-to-br from-emerald-500/10 to-teal-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
      glow: 'shadow-emerald-500/10 dark:shadow-emerald-900/20'
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-rose-50/40 dark:from-slate-900/50 dark:via-slate-900 dark:to-rose-950/20 border-y border-gray-100 dark:border-gray-800/60">
      {/* Ambient Decorative Backdrops */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 mb-3 shadow-sm"
          >
            <Sparkles size={14} className="text-rose-600 dark:text-rose-400 animate-pulse" />
            <span>{t('howItWorksBadge') || '3 Simple Steps to Save a Life'}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight"
          >
            {t('howItWorksTitle') || 'How Life Connect Works'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3.5 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            {t('howItWorksSubtitle') || 'From quick registration to connecting with nearby emergency requests and saving lives — simple, verified & 100% private.'}
          </motion.p>
        </div>

        {/* Step-by-Step Grid / Roadmap */}
        <div className="relative">
          {/* Desktop Connecting Flow Beam */}
          <div className="hidden lg:block absolute top-[68px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300 dark:from-rose-800 dark:via-amber-800 dark:to-emerald-800 z-0 border-t border-dashed border-rose-400 dark:border-rose-600/50" />

          {/* Steps Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.15 }}
                  whileHover={{ y: -6 }}
                  className={`group relative rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800/80 p-6 sm:p-7 shadow-xl ${item.glow} hover:shadow-2xl transition-all duration-300 flex flex-col justify-between`}
                >
                  {/* Subtle Card Header / Step Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      {/* Step Number Circle */}
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.accent} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300`}>
                          {item.step}
                        </div>
                        {/* Glow effect on hover */}
                        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-40 blur transition-opacity duration-300 -z-10`} />
                      </div>

                      {/* Pill Badge */}
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${item.badgeBg}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* Step Icon & Title */}
                    <div className="space-y-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.iconBg}`}>
                        <Icon size={24} strokeWidth={2.2} />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[50px]">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Highlights Checklist */}
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                    {item.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Step Flow Arrow Indicator */}
                  {idx < 2 && (
                    <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-gray-700 items-center justify-center text-rose-500 z-20 pointer-events-none group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Callout Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-xl shadow-rose-600/20 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              🩸
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold">
                {t('stepCtaQuestion') || 'Ready to become a certified lifesaver?'}
              </h4>
              <p className="text-xs sm:text-sm text-white/85 mt-0.5">
                Join our community of verified donors in Tamil Nadu and save lives today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            {user ? (
              <Link
                to="/donor-card"
                className="w-full sm:w-auto text-center py-3 px-6 rounded-2xl bg-white text-rose-600 font-bold text-sm shadow-md hover:bg-rose-50 active:scale-95 transition-all"
              >
                View Donor Card →
              </Link>
            ) : (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('lc:open-auth'))}
                className="w-full sm:w-auto text-center py-3 px-6 rounded-2xl bg-white text-rose-600 font-bold text-sm shadow-md hover:bg-rose-50 active:scale-95 transition-all"
              >
                {t('stepCtaBtn') || 'Join as a Donor'} →
              </button>
            )}
            <Link
              to="/emergency"
              className="w-full sm:w-auto text-center py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              Post Emergency
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
