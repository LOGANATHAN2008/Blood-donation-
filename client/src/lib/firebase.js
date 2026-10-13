import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBguexJi-tDg4mNjZCEzlKGCNVMZwuwLy4',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'life-connect-5d24a.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'life-connect-5d24a',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'life-connect-5d24a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '894335999406',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:894335999406:web:965caac6e2ad50c66dbc3f',
};

let app = null;
let auth = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialization error caught safely:', err?.message || err);
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
  };
}

export { auth };
export default app;
