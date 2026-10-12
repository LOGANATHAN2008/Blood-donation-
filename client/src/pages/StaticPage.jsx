import { motion } from 'framer-motion';
import { useLang } from '../context/LangContext';

const CONTENT = {
  about: {
    title: 'About Life Connect',
    body: 'Life Connect is a community-driven web application dedicated to the people of India. Our mission is to bridge the gap between blood donors, hospitals, and those in critical need of life-saving blood and unused medicines.'
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Your privacy is paramount. We only collect information necessary to connect donors with recipients. We do not sell your data to third parties. Verified hospitals may have access to donor contacts during emergencies.'
  },
  terms: {
    title: 'Terms of Service',
    body: 'By using Life Connect, you agree to provide accurate information. Blood donation requests must be genuine. Misuse of the platform, including false requests or illegal sale of medicines, will result in immediate permanent bans.'
  },
  safety: {
    title: 'Safety Guidelines',
    body: 'Always verify the recipient before donating blood. When sharing medicines, ensure they are unexpired, sealed, and not strictly prescription-only narcotics. Life Connect acts as a connector and is not liable for medical outcomes.'
  },
  contact: {
    title: 'Contact Us',
    body: 'For urgent queries, support, or to report platform abuse, please email us at support@lifeconnect.example.com. We aim to respond within 24 hours.'
  },
  care: {
    title: 'Community Care & Support',
    body: 'Life Connect Community Care connects volunteers and donors with local health assistance, recovery support, and essential aid.'
  },
  care_food: {
    title: 'Nutritional Care & Food Support',
    body: 'Nutritional support initiatives ensuring healthy recovery for donors and nourishment for hospital patient attendants.'
  }
};

export default function StaticPage({ pageId }) {
  const { t } = useLang();
  const data = CONTENT[pageId] || { title: 'Coming Soon', body: 'This page is under construction.' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 border-t-4 border-brand-500"
      >
        <h1 className="text-3xl md:text-4xl font-black mb-6 text-brand-600 dark:text-brand-400">
          {data.title}
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed space-y-6">
          <p>{data.body}</p>
          
          {pageId === 'about' && (
            <div className="mt-8 p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-ink dark:text-white">Our Vision</h3>
              <p className="text-base text-gray-600 dark:text-gray-400">
                To create a self-sustaining ecosystem where no life is lost due to a shortage of blood, 
                and no usable medicine goes to waste. Built with ❤️ for India.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
