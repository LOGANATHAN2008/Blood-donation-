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
    await auth.signOut();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
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
        setUser(null);
        setDbUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });
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
      user, dbUser, loading, idToken, refreshDbUser, logout,
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
