import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const PRODUCTS_COLLECTION = 'products';

export const getProducts = async () => {
  const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const getProductById = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { _id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const addProduct = async (productData) => {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
  return { _id: docRef.id, ...productData };
};

export const updateProduct = async (id, productData) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, productData);
  return { _id: id, ...productData };
};

export const deleteProduct = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
};

export const getAdminStats = async () => {
  const products = await getProducts();
  const categories = new Set(products.map(p => p.category));
  const lowStock = products.filter(p => (Number(p.stock) || 0) <= 5 && (Number(p.stock) || 0) > 0);
  const outOfStock = products.filter(p => (Number(p.stock) || 0) === 0);
  
  let totalSales = 0;
  let totalRevenue = 0;
  try {
    const salesSnap = await getDocs(collection(db, 'sales'));
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
    const usersSnap = await getDocs(collection(db, 'users'));
    totalCustomers = usersSnap.docs.length;
  } catch (err) {
    console.error('Error fetching customers stats:', err);
  }

  let totalEnquiries = 0;
  try {
    const enqSnap = await getDocs(collection(db, 'enquiries'));
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
  const docRef = await addDoc(collection(db, 'enquiries'), enquiryData);
  return { _id: docRef.id, ...enquiryData };
};

export const saveUserToFirestore = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  
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
  const querySnapshot = await getDocs(collection(db, 'sales'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const getEnquiries = async () => {
  const querySnapshot = await getDocs(collection(db, 'enquiries'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const updateEnquiry = async (id, data) => {
  const docRef = doc(db, 'enquiries', id);
  await updateDoc(docRef, data);
};

export const deleteEnquiry = async (id) => {
  const docRef = doc(db, 'enquiries', id);
  await deleteDoc(docRef);
};

export const subscribeToSales = (callback) => {
  const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    callback(sales);
  }, (error) => {
    console.error('Error in sales subscription:', error);
    callback([], error);
  });
};

export const getCustomers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
};

export const subscribeToEnquiries = (callback) => {
  const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const enquiries = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    callback(enquiries);
  }, (error) => {
    console.error("Error fetching enquiries:", error);
    callback(null, error);
  });
};

export const bulkAddSales = async (salesData) => {
  const salesRef = collection(db, 'sales');
  const chunks = [];
  for (let i = 0; i < salesData.length; i += 500) {
    chunks.push(salesData.slice(i, i + 500));
  }
  
  for (const chunk of chunks) {
    const currentBatch = writeBatch(db);
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
  const docRef = await addDoc(collection(db, 'sales'), saleData);
  return { _id: docRef.id, ...saleData };
};

export const updateSale = async (id, saleData) => {
  const docRef = doc(db, 'sales', id);
  await updateDoc(docRef, saleData);
  return { _id: id, ...saleData };
};

export const deleteSale = async (id) => {
  const docRef = doc(db, 'sales', id);
  await deleteDoc(docRef);
  return id;
};
