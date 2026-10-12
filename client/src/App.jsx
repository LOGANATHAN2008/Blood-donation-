import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import DonorsPage from './pages/DonorsPage';
import RequestsPage from './pages/RequestsPage';
import HospitalsPage from './pages/HospitalsPage';
import MedicinePage from './pages/MedicinePage';
import StaticPage from './pages/StaticPage';
import EmergencyPage from './pages/EmergencyPage';
import SettingsPage from './pages/SettingsPage';
import DonorCardPage from './pages/DonorCardPage';
import QrVerifyPage from './pages/QrVerifyPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CampsPage from './pages/CampsPage';
import InstallBanner from './components/pwa/InstallBanner';
import ProfileCompletionPopup from './components/auth/ProfileCompletionPopup';
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

// Admin Components (Lazy Loaded)
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const AdminComingSoon = () => (
  <div className="flex h-64 items-center justify-center text-gray-400">
    This admin module is under construction (Phase 3 & 4).
  </div>
);

function AppContent() {
  const { isProfilePopupOpen, setIsProfilePopupOpen } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for the full preloader sequence (which takes about 2.2s total)
    // The Preloader component sets its own phases, but we unmount it when ready
    const timer = setTimeout(() => setLoading(false), 2400); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader key="preloader" />}
      </AnimatePresence>

      <InstallBanner />

      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            zIndex: 99999,
          },
        }}
      />
      <ProfileCompletionPopup 
        isOpen={isProfilePopupOpen} 
        onClose={() => setIsProfilePopupOpen(false)} 
      />
      <Routes>
        {/* Admin Routes (Outside of normal Layout) */}
        <Route path="/admin" element={
          <Suspense fallback={<div className="h-screen flex items-center justify-center animate-pulse">Loading Admin...</div>}>
            <AdminRoute />
          </Suspense>
        }>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="*" element={<AdminComingSoon />} />
          </Route>
        </Route>

        {/* Public/Main Routes */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="donors" element={<DonorsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="hospitals" element={<HospitalsPage />} />
          <Route path="medicine" element={<MedicinePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="donor-card" element={<DonorCardPage />} />
          <Route path="verify/:token" element={<QrVerifyPage />} />
          <Route path="verify-certificate/:id" element={<CertificateVerifyPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="campaigns" element={<CampsPage />} />
          <Route path="camps" element={<CampsPage />} />
          
          <Route path="care" element={<StaticPage pageId="care" />} />
          <Route path="care/food" element={<StaticPage pageId="care_food" />} />
          <Route path="about" element={<StaticPage pageId="about" />} />
          <Route path="privacy" element={<StaticPage pageId="privacy" />} />
          <Route path="terms" element={<StaticPage pageId="terms" />} />
          <Route path="safety" element={<StaticPage pageId="safety" />} />
          <Route path="contact" element={<StaticPage pageId="contact" />} />
        </Route>
        <Route path="auth" element={<AuthPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="onboarding" element={<AuthPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <SocketProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </BrowserRouter>
            </SocketProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
