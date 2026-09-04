import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AdminLayout from '../components/admin/AdminLayout';
import Overview from './admin/Overview';
import ProductManagement from './admin/ProductManagement';
import SalesManagement from './admin/SalesManagement';
import EnquiryManagement from './admin/EnquiryManagement';
import CustomerManagement from './admin/CustomerManagement';
import ProductFormPage from './ProductFormPage';

const ADMIN_EMAIL = 'rasheedtyresplanet@gmail.com';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const email = (user.email || '').toLowerCase().trim();
          if (email === ADMIN_EMAIL) {
            setIsAuthenticated(true);
            setError(null);
          } else {
            setIsAuthenticated(false);
            setError('Access Denied: Admin privileges required.');
          }
        } else {
          setIsAuthenticated(false);
          setError('Waiting for authentication...');
        }
      });
    } else {
      setError('Firebase authentication is not configured.');
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center p-6 text-center">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-400 max-w-md">
          <p className="text-base font-bold mb-2">Authentication Notice</p>
          <p className="text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="sales" element={<SalesManagement />} />
        <Route path="enquiries" element={<EnquiryManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="product/new" element={<ProductFormPage />} />
        <Route path="product/:id/edit" element={<ProductFormPage />} />
      </Routes>
    </AdminLayout>
  );
}
