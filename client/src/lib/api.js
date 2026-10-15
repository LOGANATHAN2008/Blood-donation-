import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach Firebase or local ID token to every request
api.interceptors.request.use(async (config) => {
  const mockEmail = localStorage.getItem('mock_email');
  const mockPhone = localStorage.getItem('mock_phone');
  let mockToken = null;
  
  if (mockEmail) {
    mockToken = `mock-token-${mockEmail}`;
  } else if (mockPhone) {
    mockToken = `mock-token-${mockPhone}`;
  } else {
    const rawUser = localStorage.getItem('mock_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        const ident = u.email || u.phoneNumber || u.phone || u.uid || 'user';
        mockToken = `mock-token-${ident}`;
      } catch {}
    }
  }

  if (mockToken) {
    config.headers.Authorization = `Bearer ${mockToken}`;
  } else {
    const user = auth?.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch {}
    }
  }
  return config;
});

// Normalize error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    let message = data?.error || err.message || 'Something went wrong.';
    if (data?.details && Array.isArray(data.details)) {
      message += ': ' + data.details.map(d => `${d.field} (${d.message})`).join(', ');
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
