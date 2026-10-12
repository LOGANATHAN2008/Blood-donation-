import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const mockEmail = localStorage.getItem('mock_email');
  if (mockEmail) {
    config.headers.Authorization = `Bearer mock-token-${mockEmail}`;
  } else {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
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
