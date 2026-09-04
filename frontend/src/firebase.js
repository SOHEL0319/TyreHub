import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBv-VUEFlXZnhflrSGYIezmb-5iSCbVURE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tyrehub-d049a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tyrehub-d049a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tyrehub-d049a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '31797207185',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:31797207185:web:6c88fb2ca66551a64b9f30',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-L2H51F7625'
};

// Guarantee a single valid Firebase App instance across the entire application
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, app as firebaseApp };
