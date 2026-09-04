import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);

async function run() {
  try {
    console.log('Logging in...');
    const userCredential = await signInWithEmailAndPassword(auth, 'rasheedtyresplanet@gmail.com', '9182736329@#');
    console.log('Logged in as:', userCredential.user.email);
    
    console.log('Testing collections...');
    const collectionsToTest = ['products', 'tyres', 'users', 'sales', 'enquiries', 'customers'];
    for (const name of collectionsToTest) {
      try {
        const q = await getDocs(collection(db, name));
        console.log(`${name} size:`, q.size);
      } catch (e) {
        console.error(`Error fetching ${name}:`, e.code);
      }
    }
    
    // Seed one product to test write
    try {
      console.log('Testing write to products...');
      await addDoc(collection(db, 'products'), {
        name: 'Test Tyre',
        price: 100
      });
      console.log('Successfully wrote to products');
    } catch (e) {
      console.error('Error writing to products:', e.code);
    }
  } catch (e) {
    console.error('Login failed:', e.message);
  }
}

run();
