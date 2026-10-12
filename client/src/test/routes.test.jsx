import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '../context/ThemeContext';
import { LangProvider } from '../context/LangContext';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';

import HomePage from '../pages/HomePage';
import AuthPage from '../pages/AuthPage';
import DonorsPage from '../pages/DonorsPage';
import RequestsPage from '../pages/RequestsPage';
import HospitalsPage from '../pages/HospitalsPage';
import MedicinePage from '../pages/MedicinePage';
import SettingsPage from '../pages/SettingsPage';
import EmergencyPage from '../pages/EmergencyPage';
import DonorCardPage from '../pages/DonorCardPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import CampsPage from '../pages/CampsPage';
import StaticPage from '../pages/StaticPage';
import AdminDashboard from '../pages/admin/AdminDashboard';

// Mock Socket.io
vi.mock('../lib/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    connected: false,
  }),
  disconnectSocket: vi.fn(),
  default: {
    getSocket: () => ({
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      connected: false,
    }),
    disconnectSocket: vi.fn(),
  },
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null, signOut: vi.fn() })),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return vi.fn();
  }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null, signOut: vi.fn() },
  default: {},
}));

// Mock API
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    put: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Global fetch mock
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: [] }),
});

function renderWithProviders(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <SocketProvider>
              <MemoryRouter initialEntries={[initialRoute]}>
                <ErrorBoundary>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route index element={<HomePage />} />
                      <Route path="donors" element={<DonorsPage />} />
                      <Route path="requests" element={<RequestsPage />} />
                      <Route path="hospitals" element={<HospitalsPage />} />
                      <Route path="medicine" element={<MedicinePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="emergency" element={<EmergencyPage />} />
                      <Route path="donor-card" element={<DonorCardPage />} />
                      <Route path="leaderboard" element={<LeaderboardPage />} />
                      <Route path="campaigns" element={<CampsPage />} />
                      <Route path="care" element={<StaticPage pageId="care" />} />
                      <Route path="care/food" element={<StaticPage pageId="care_food" />} />
                      <Route path="about" element={<StaticPage pageId="about" />} />
                    </Route>
                    <Route path="auth" element={<AuthPage />} />
                    <Route path="login" element={<AuthPage />} />
                    <Route path="onboarding" element={<AuthPage />} />
                    <Route path="admin" element={<AdminDashboard />} />
                  </Routes>
                </ErrorBoundary>
              </MemoryRouter>
            </SocketProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Route Smoke Tests & React Hook Compatibility', () => {
  let consoleErrorSpy;
  const criticalErrors = [];

  beforeEach(() => {
    criticalErrors.length = 0;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      // Check for react hook, useContext, or unhandled component errors
      if (
        msg.includes('useContext') ||
        msg.includes('Invalid hook call') ||
        msg.includes('rendered fewer hooks') ||
        msg.includes('Cannot read properties of null') ||
        msg.includes('Uncaught [Error')
      ) {
        criticalErrors.push(msg);
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    expect(criticalErrors).toHaveLength(0);
  });

  const routes = [
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Home', path: '/' },
    { name: 'Donors', path: '/donors' },
    { name: 'Requests', path: '/requests' },
    { name: 'Emergency', path: '/emergency' },
    { name: 'Hospitals', path: '/hospitals' },
    { name: 'Medicine', path: '/medicine' },
    { name: 'Campaigns', path: '/campaigns' },
    { name: 'Donor Card', path: '/donor-card' },
    { name: 'Care', path: '/care' },
    { name: 'Care Food', path: '/care/food' },
    { name: 'Settings', path: '/settings' },
    { name: 'Admin', path: '/admin' },
    { name: 'Auth', path: '/auth' },
    { name: 'Login', path: '/login' },
    { name: 'Onboarding', path: '/onboarding' },
  ];

  routes.forEach(({ name, path }) => {
    it(`renders ${name} (${path}) without throwing or triggering ErrorBoundary`, async () => {
      await act(async () => {
        renderWithProviders(path);
      });

      // Assert error boundary is NOT displayed
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/We encountered an unexpected error/i)).not.toBeInTheDocument();
    });
  });
});
