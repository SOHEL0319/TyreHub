import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentUser } from '../utils/auth';

const ADMIN_EMAIL = 'rasheedtyresplanet@gmail.com';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const email = (firebaseUser.email || '').toLowerCase().trim();
          const localUser = getCurrentUser();
          const isAdmin = email === ADMIN_EMAIL || localUser?.role === 'admin';
          setAuthState({ loading: false, isAdmin });
        } else {
          const localUser = getCurrentUser();
          const isAdmin = localUser?.role === 'admin' && localUser?.email?.toLowerCase().trim() === ADMIN_EMAIL;
          setAuthState({ loading: false, isAdmin });
        }
      });
    } else {
      const localUser = getCurrentUser();
      const isAdmin = localUser?.role === 'admin' && localUser?.email?.toLowerCase().trim() === ADMIN_EMAIL;
      setAuthState({ loading: false, isAdmin });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (authState.loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 bg-[#111111] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
        <p className="text-sm font-semibold tracking-wider text-white/70 uppercase">Verifying Admin Permissions...</p>
      </div>
    );
  }

  if (!authState.isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
