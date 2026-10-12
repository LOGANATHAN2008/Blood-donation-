import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomTabBar from './BottomTabBar';
import SosButton from './sos/SosButton';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <SosButton />
      <BottomTabBar />
      <footer className="hidden md:block border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="font-semibold text-ink dark:text-white">🩸 Life Connect 💊</div>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="/about" className="hover:text-brand-500">About</a>
              <a href="/campaigns" className="hover:text-brand-500">Camps</a>
              <a href="/leaderboard" className="hover:text-brand-500">Leaderboard</a>
              <a href="/donor-card" className="hover:text-brand-500">Donor Card</a>
              <a href="/privacy" className="hover:text-brand-500">Privacy</a>
              <a href="/terms" className="hover:text-brand-500">Terms</a>
              <a href="/safety" className="hover:text-brand-500">Safety</a>
              <a href="/contact" className="hover:text-brand-500">Contact</a>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('lc:prompt-install'))}
                className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-medium hover:bg-rose-100 transition"
              >
                📲 Install App
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>© {new Date().getFullYear()} Life Connect. India.</div>
            <div className="text-right">
              Hospital data: <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline">data.gov.in</a> (Open Government License India) and <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">© OpenStreetMap contributors</a> (ODbL).
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
