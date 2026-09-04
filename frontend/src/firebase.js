import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID } : {})
};

// Check for core required configuration keys
const requiredKeys = ['apiKey', 'projectId', 'appId'];
const hasFirebaseConfig = requiredKeys.every(k => Boolean(firebaseConfig[k]));

let firebaseApp = null;
let auth = null;
let db = null;

if (hasFirebaseConfig) {
  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  } catch (err) {
    console.error('Failed to initialize Firebase App:', err);
  }
} else {
  console.warn(
    '[TyreHub] Firebase configuration is missing in environment variables. Please set VITE_FIREBASE_* in your Vercel Project Settings.'
  );
}

export { firebaseApp, auth, db, hasFirebaseConfig };
