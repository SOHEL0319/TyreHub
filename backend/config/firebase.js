const { initializeApp, applicationDefault, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db;

try {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      // Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
      // or that the environment supports application default credentials.
    });
  }
  db = getFirestore();
  console.log('Firebase Admin Initialized Successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

module.exports = { db };
