import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCollection(name) {
  try {
    const q = await getDocs(collection(db, name));
    console.log(`${name} size:`, q.size);
  } catch (e) {
    console.error(`Error fetching ${name}:`, e.code);
  }
}

async function run() {
  await testCollection('products');
  await testCollection('tyres');
  await testCollection('users');
  await testCollection('sales');
  await testCollection('enquiries');
  await testCollection('customers');
}

run();
