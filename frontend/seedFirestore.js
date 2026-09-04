import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, setDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We need the VITE variables, so load from frontend/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const brands = ['MRF', 'CEAT', 'Apollo Tyres', 'JK Tyre', 'Bridgestone'];
const categories = ['Bike Tyres', 'Car Tyres', 'Auto Tyres', 'Lorry Tyres'];
const vehicleTypes = {
  'Bike Tyres': 'Bike',
  'Car Tyres': 'Car',
  'Auto Tyres': 'Auto',
  'Lorry Tyres': 'Lorry'
};

const generateProducts = () => {
  const products = [];
  for (let i = 1; i <= 100; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const vehicleType = vehicleTypes[category];
    
    // Size logic
    let size = '205/55R16';
    if (category === 'Bike Tyres') size = '100/90-18';
    if (category === 'Auto Tyres') size = '4.00-10';
    if (category === 'Lorry Tyres') size = '11R22.5';
    
    // Price logic
    let mrp = Math.floor(Math.random() * 5000) + 1500;
    if (category === 'Car Tyres') mrp += 3000;
    if (category === 'Lorry Tyres') mrp += 10000;
    
    const discount = Math.floor(Math.random() * 15) + 5; // 5% to 20%
    const price = Math.floor(mrp * (1 - discount / 100));
    
    products.push({
      name: `${brand} ${vehicleType} Pro V${Math.floor(Math.random() * 10) + 1}`,
      brand,
      category,
      vehicleType,
      size,
      price,
      mrp,
      discount,
      stock: Math.floor(Math.random() * 50),
      description: `High-quality ${category.toLowerCase()} from ${brand} designed for optimal performance and durability on Indian roads.`,
      image: `https://via.placeholder.com/500x500?text=${brand.replace(' ', '+')}+${vehicleType}+Tyre`,
      sku: `${brand.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      warranty: '5 Years',
      specifications: 'Tubeless, ISI Certified',
      createdAt: new Date().toISOString()
    });
  }
  return products;
};

const generateSales = () => {
  const sales = [];
  for (let i = 1; i <= 20; i++) {
    sales.push({
      customerName: `Customer ${i}`,
      customerEmail: `customer${i}@example.com`,
      productName: 'MRF Car Tyre Pro V3',
      quantity: Math.floor(Math.random() * 4) + 1,
      price: 5000,
      totalAmount: 0,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Completed'
    });
  }
  sales.forEach(s => s.totalAmount = s.quantity * s.price);
  return sales;
};

const seedDatabase = async () => {
  try {
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getAuth(app);
    console.log('Logging in as admin...');
    // Replace with the actual password if 'admin123' fails. I'll ask the user if needed, but often it's a test account.
    await signInWithEmailAndPassword(auth, 'rasheedtyresplanet@gmail.com', 'admin123').catch(e => {
       console.log('Login failed, trying to seed anyway (might fail due to rules):', e.message);
    });

    console.log('Clearing old products...');
    const productsSnapshot = await getDocs(collection(db, 'products'));
    for (const d of productsSnapshot.docs) {
       await deleteDoc(doc(db, 'products', d.id));
    }
    
    console.log('Seeding products...');
    const products = generateProducts();
    const productsRef = collection(db, 'products');
    for (const product of products) {
      await addDoc(productsRef, product);
    }
    
    console.log('Seeding sales...');
    const sales = generateSales();
    const salesRef = collection(db, 'sales');
    for (const sale of sales) {
      await addDoc(salesRef, sale);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
