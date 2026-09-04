import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const PRODUCTS_COLLECTION = 'products';

const getDb = () => {
  if (!db) {
    throw new Error(
      'Firestore database is not initialized. Please verify that VITE_FIREBASE_* environment variables are set in your Vercel Project Settings.'
    );
  }
  return db;
};

export const getProducts = async () => {
  const currentDb = getDb();
  const querySnapshot = await getDocs(collection(currentDb, PRODUCTS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const getProductById = async (id) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { _id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const addProduct = async (productData) => {
  const currentDb = getDb();
  const docRef = await addDoc(collection(currentDb, PRODUCTS_COLLECTION), productData);
  return { _id: docRef.id, ...productData };
};

export const updateProduct = async (id, productData) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, productData);
  return { _id: id, ...productData };
};

export const deleteProduct = async (id) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
};

export const getAdminStats = async () => {
  const currentDb = getDb();
  const products = await getProducts();
  const categories = new Set(products.map(p => p.category));
  const lowStock = products.filter(p => (Number(p.stock) || 0) <= 5 && (Number(p.stock) || 0) > 0);
  const outOfStock = products.filter(p => (Number(p.stock) || 0) === 0);
  
  let totalSales = 0;
  let totalRevenue = 0;
  try {
    const salesSnap = await getDocs(collection(currentDb, 'sales'));
    totalSales = salesSnap.docs.length;
    salesSnap.forEach(doc => {
      const s = doc.data();
      totalRevenue += Number(s.totalAmount) || (Number(s.price) * Number(s.quantity)) || 0;
    });
  } catch (err) {
    console.error('Error fetching sales stats:', err);
  }

  let totalCustomers = 0;
  try {
    const usersSnap = await getDocs(collection(currentDb, 'users'));
    totalCustomers = usersSnap.docs.length;
  } catch (err) {
    console.error('Error fetching customers stats:', err);
  }

  let totalEnquiries = 0;
  try {
    const enqSnap = await getDocs(collection(currentDb, 'enquiries'));
    totalEnquiries = enqSnap.docs.length;
  } catch (err) {
    console.error('Error fetching enquiries stats:', err);
  }

  return {
    totalProducts: products.length,
    totalCategories: categories.size,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    totalSales,
    totalRevenue,
    totalCustomers,
    totalEnquiries,
    recentEnquiries: []
  };
};

export const addEnquiry = async (enquiryData) => {
  const currentDb = getDb();
  const docRef = await addDoc(collection(currentDb, 'enquiries'), enquiryData);
  return { _id: docRef.id, ...enquiryData };
};

export const saveUserToFirestore = async (user) => {
  const currentDb = getDb();
  const userRef = doc(currentDb, 'users', user.uid);
  
  const isAdmin = user.email && user.email.toLowerCase().trim() === 'rasheedtyresplanet@gmail.com';
  const role = isAdmin ? 'admin' : 'user';
  
  const userData = {
    uid: user.uid,
    name: user.displayName || user.email,
    email: user.email,
    photoURL: user.photoURL || '',
    role: role,
    lastLogin: new Date().toISOString()
  };
  
  await setDoc(userRef, userData, { merge: true });
  return userData;
};

export const getSales = async () => {
  const currentDb = getDb();
  const querySnapshot = await getDocs(collection(currentDb, 'sales'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const getEnquiries = async () => {
  const currentDb = getDb();
  const querySnapshot = await getDocs(collection(currentDb, 'enquiries'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const updateEnquiry = async (id, data) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, 'enquiries', id);
  await updateDoc(docRef, data);
};

export const deleteEnquiry = async (id) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, 'enquiries', id);
  await deleteDoc(docRef);
};

export const subscribeToSales = (callback) => {
  const currentDb = getDb();
  const q = query(collection(currentDb, 'sales'), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    callback(sales);
  }, (error) => {
    console.error('Error in sales subscription:', error);
    callback([], error);
  });
};

export const getCustomers = async () => {
  const currentDb = getDb();
  const querySnapshot = await getDocs(collection(currentDb, 'users'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const subscribeToEnquiries = (callback) => {
  const currentDb = getDb();
  const q = query(collection(currentDb, 'enquiries'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const enquiries = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    callback(enquiries);
  }, (error) => {
    console.error("Error fetching enquiries:", error);
    callback(null, error);
  });
};

export const bulkAddSales = async (salesData) => {
  const currentDb = getDb();
  const salesRef = collection(currentDb, 'sales');
  const chunks = [];
  for (let i = 0; i < salesData.length; i += 500) {
    chunks.push(salesData.slice(i, i + 500));
  }
  
  for (const chunk of chunks) {
    const currentBatch = writeBatch(currentDb);
    chunk.forEach(sale => {
      const { _id, saleId, ...rest } = sale;
      const idToUse = saleId || _id;
      const docRef = idToUse ? doc(salesRef, idToUse) : doc(salesRef);
      const cleanData = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v !== undefined)
      );
      currentBatch.set(docRef, { ...cleanData, saleId: idToUse || docRef.id });
    });
    await currentBatch.commit();
  }
  return salesData.length;
};

export const addSale = async (saleData) => {
  const currentDb = getDb();
  const docRef = await addDoc(collection(currentDb, 'sales'), saleData);
  return { _id: docRef.id, ...saleData };
};

export const updateSale = async (id, saleData) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, 'sales', id);
  await updateDoc(docRef, saleData);
  return { _id: id, ...saleData };
};

export const deleteSale = async (id) => {
  const currentDb = getDb();
  const docRef = doc(currentDb, 'sales', id);
  await deleteDoc(docRef);
  return id;
};
