import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { HeartPulse, Droplet, ShieldCheck } from 'lucide-react';
import BloodDropVisual from './BloodDropVisual';
import QuickSearchCard from './QuickSearchCard';
import { useLang } from '../../context/LangContext';

export default function Hero() {
  const { t } = useLang();
  const prefersReducedMotion = useReducedMotion();

  // Translations for the hero
  const translations = {
    en: {
      badge: "India's community blood network",
      h1: "Every drop can save a life.",
      sub: "Join thousands of verified donors ready to help in emergencies. Because someone's tomorrow depends on your today.",
      becomeDonor: "Become a Donor",
      needBlood: "I Need Blood",
      findHospitals: "Find Nearby Hospitals",
      trust1: "OTP-verified donors",
      trust2: "Privacy first",
      trust3: "100% Free forever"
    },
    ta: {
      badge: "இந்தியாவின் சமூக இரத்த வலையமைப்பு",
      h1: "ஒவ்வொரு துளியும் ஓர் உயிரைக் காக்கும்.",
      sub: "அவசரக் காலங்களில் உதவத் தயாராக உள்ள ஆயிரக்கணக்கான சரிபார்க்கப்பட்ட கொடையாளர்களுடன் இணையுங்கள். ஒருவரின் நாளை உங்கள் இன்றைய உதவியில் உள்ளது.",
      becomeDonor: "கொடையாளர் ஆகுங்கள்",
      needBlood: "இரத்தம் தேவை",
      findHospitals: "அருகிலுள்ள மருத்துவமனைகள்",
      trust1: "OTP-சரிபார்க்கப்பட்டவர்கள்",
      trust2: "தனியுரிமைக்கு முன்னுரிமை",
      trust3: "எப்போதும் 100% இலவசம்"
    },
    hi: {
      badge: "भारत का सामुदायिक रक्त नेटवर्क",
      h1: "हर बूंद एक जीवन बचा सकती है।",
      sub: "आपात स्थिति में मदद के लिए तैयार हजारों सत्यापित दाताओं से जुड़ें। क्योंकि किसी का कल आपके आज पर निर्भर करता है।",
      becomeDonor: "रक्तदाता बनें",
      needBlood: "मुझे रक्त चाहिए",
      findHospitals: "आस-पास के अस्पताल खोजें",
      trust1: "OTP-सत्यापित दाता",
      trust2: "गोपनीयता पहले",
      trust3: "हमेशा के लिए 100% मुफ्त"
    }
  };

  // Safe fallback to 'en' if translation is missing
  const activeLang = translations[t('langCode')] ? t('langCode') : 'en';
  const txt = translations[activeLang];

  return (
    <section className="relative z-20 min-h-0 lg:min-h-[90vh] flex flex-col justify-center pt-20 sm:pt-24 pb-6 sm:pb-24 lg:pb-36 bg-surface dark:bg-surface-dark">
      {/* Background Mesh Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-200/40 dark:bg-brand-900/40 mix-blend-multiply dark:mix-blend-lighten blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-rose-200/40 dark:bg-rose-900/40 mix-blend-multiply dark:mix-blend-lighten blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand-100/40 dark:bg-brand-800/40 mix-blend-multiply dark:mix-blend-lighten blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-grow flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center w-full">
          
          {/* Left Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 shadow-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 tracking-wide uppercase">
                {txt.badge}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[4.2rem] font-black leading-[1.15] tracking-tight text-ink dark:text-white">
              {txt.h1}
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              {txt.sub}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-4">
              <Link to="/donors" className="btn-primary h-[48px] sm:h-[52px] px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto shadow-glass hover:shadow-glass-lg transition-all transform hover:-translate-y-1">
                <HeartPulse size={20} className="mr-2" />
                {txt.becomeDonor}
              </Link>
              <Link to="/emergency" className="h-[48px] sm:h-[52px] px-6 sm:px-8 text-base sm:text-lg font-bold rounded-full border-2 border-brand-200 dark:border-brand-800 bg-white/50 dark:bg-ink/50 text-brand-700 dark:text-brand-300 flex items-center justify-center backdrop-blur-sm hover:border-brand-400 hover:bg-white dark:hover:bg-brand-950 transition-all">
                <Droplet size={20} className="mr-2" />
                {txt.needBlood}
              </Link>
            </div>
            
            <Link to="/hospitals" className="text-sm font-semibold text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 underline underline-offset-4 decoration-2 decoration-brand-200 dark:decoration-brand-800 transition-colors">
              {txt.findHospitals} &rarr;
            </Link>

            {/* Trust Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-6 pt-4 sm:pt-8 mt-2 sm:mt-4 border-t border-gray-200/60 dark:border-white/10 w-full">
              {[txt.trust1, txt.trust2, txt.trust3].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                  <ShieldCheck size={16} className="text-brand-500" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual Component */}
          <motion.div 
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center lg:justify-end"
          >
            <BloodDropVisual />
          </motion.div>
        </div>
      </div>

      {/* Quick Search Card */}
      <div className="w-full mt-6 sm:mt-10 lg:mt-0 lg:absolute lg:bottom-0 lg:left-0 lg:translate-y-1/2 px-3 sm:px-6 z-30">
        <QuickSearchCard />
      </div>
    </section>
  );
}
