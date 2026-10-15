import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [dbUser, setDbUser]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [idToken, setIdToken]   = useState(null);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  const logout = async () => {
    localStorage.removeItem('mock_email');
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_phone');
    if (auth?.signOut) {
      try {
        await auth.signOut();
      } catch {}
    }
    setUser(null);
    setDbUser(null);
    setIdToken(null);
  };

  const loginLocalUser = async (userData) => {
    const formattedUser = {
      uid: userData.uid || `user-${Date.now()}`,
      email: userData.email || null,
      phoneNumber: userData.phoneNumber || userData.phone || null,
      displayName: userData.displayName || userData.name || (userData.email ? userData.email.split('@')[0] : 'Donor Member'),
      photoURL: userData.photoURL || null,
      getIdToken: async () => `mock-token-${userData.email || userData.phoneNumber || userData.phone || 'user'}`,
    };
    localStorage.setItem('mock_user', JSON.stringify(formattedUser));
    if (userData.email) localStorage.setItem('mock_email', userData.email);
    if (userData.phoneNumber || userData.phone) localStorage.setItem('mock_phone', userData.phoneNumber || userData.phone);
    
    setUser(formattedUser);
    setIdToken(`mock-token-${userData.email || userData.phoneNumber || userData.phone || 'user'}`);
    
    try {
      const { data } = await api.get('/me');
      setDbUser(data);
    } catch (e) {
      console.warn('Could not fetch DB profile:', e.message);
    }
    return formattedUser;
  };

  useEffect(() => {
    let unsub = () => {};
    try {
      // Check stored session first
      const stored = localStorage.getItem('mock_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.getIdToken = async () => `mock-token-${parsed.email || parsed.phoneNumber || 'user'}`;
          setUser(parsed);
          setIdToken(`mock-token-${parsed.email || parsed.phoneNumber || 'user'}`);
          api.get('/me').then(r => setDbUser(r.data)).catch(() => {});
        } catch {}
      }

      if (auth && typeof onAuthStateChanged === 'function') {
        unsub = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            try {
              const token = await firebaseUser.getIdToken();
              setIdToken(token);
              // Fetch DB user (creates on first login)
              const { data } = await api.get('/me');
              setDbUser(data);
              
              // Auto-open profile popup ONLY for new incomplete users
              const isStoredComplete = localStorage.getItem(`profile_completed_${firebaseUser.uid}`) === 'true';
              const isComplete = Boolean(
                data?.profileCompleted || 
                data?.onboardingComplete || 
                data?.profileStatus?.isComplete || 
                isStoredComplete
              );

              if (!isComplete) {
                setIsProfilePopupOpen(true);
              } else {
                setIsProfilePopupOpen(false);
              }
            } catch (err) {
              console.error('Failed to load user profile:', err.message);
            }
          } else {
            const storedAfter = localStorage.getItem('mock_user');
            if (!storedAfter) {
              setUser(null);
              setDbUser(null);
              setIdToken(null);
            }
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn('Auth subscription unavailable:', err?.message || err);
      setLoading(false);
    }
    return unsub;
  }, []);

  const refreshDbUser = async () => {
    try {
      const { data } = await api.get('/me');
      setDbUser(data);
      const isComplete = Boolean(
        data?.profileCompleted || 
        data?.onboardingComplete || 
        data?.profileStatus?.isComplete
      );
      if (isComplete) {
        if (data?.uid) {
          localStorage.setItem(`profile_completed_${data.uid}`, 'true');
        }
        setIsProfilePopupOpen(false);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ 
      user, dbUser, loading, idToken, token: idToken, refreshDbUser, logout, loginLocalUser,
      isProfilePopupOpen, setIsProfilePopupOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
