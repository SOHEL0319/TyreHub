import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../api/firestoreService';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProviderInfo } from '../../utils/authLinking';
import SetPasswordModal from '../../components/SetPasswordModal';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [providerInfo, setProviderInfo] = useState({ isGoogle: false, hasPassword: false, providers: [] });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Overview Stats Error:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied: Admin privileges required to read stats.');
      } else {
        setError('Unable to fetch overview statistics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setProviderInfo(getUserProviderInfo(user));
          fetchStats();
        } else {
          setLoading(false);
        }
      });
    } else {
      fetchStats();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/70">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mr-3"></div>
        <span className="text-sm font-semibold uppercase tracking-wider">Loading dashboard overview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
        <p className="font-bold mb-2">Overview Error</p>
        <p className="text-sm">{error}</p>
        <button onClick={fetchStats} className="mt-4 rounded-full bg-red-600 px-5 py-2 text-xs font-bold uppercase text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-white">Dashboard Overview</h1>
          <p className="text-xs text-white/50 mt-1">Real-time store performance, inventory health, and revenue telemetry</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition shadow-md shadow-red-600/20"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/sales"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition"
          >
            Record Sale
          </Link>
        </div>
      </div>

      {/* Account Credentials & Direct Login Banner */}
      <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        !providerInfo.hasPassword
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-white/10 bg-white/5'
      }`}>
        <div className="flex items-start gap-3.5">
          <span className="text-2xl mt-0.5">{!providerInfo.hasPassword ? '🔐' : '🛡️'}</span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {!providerInfo.hasPassword 
                ? 'Enable Direct Email & Password Login' 
                : 'Account Security: Google & Password Login Enabled'}
            </h3>
            <p className="text-xs text-white/70 mt-1">
              {!providerInfo.hasPassword
                ? 'Your admin account currently authenticates via Google. You can set a password to also log in directly with your email and password.'
                : 'Your account is configured with both Google Sign-In and direct Email/Password authentication.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition shrink-0 shadow-md ${
            !providerInfo.hasPassword
              ? 'bg-amber-500 text-black hover:bg-amber-400'
              : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {!providerInfo.hasPassword ? 'Set Account Password' : 'Change Password'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Total Revenue</p>
          <p className="text-2xl font-extrabold text-green-400">{formatCurrency(stats?.totalRevenue)}</p>
          <p className="text-[10px] text-white/40 mt-1">From all recorded sales</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Total Sales Orders</p>
          <p className="text-2xl font-extrabold text-white">{stats?.totalSales || 0}</p>
          <p className="text-[10px] text-white/40 mt-1">Completed & pending transactions</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Catalog Products</p>
          <p className="text-2xl font-extrabold text-white">{stats?.totalProducts || 0}</p>
          <p className="text-[10px] text-white/40 mt-1">{stats?.totalCategories || 0} vehicle categories</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Customer Enquiries</p>
          <p className="text-2xl font-extrabold text-purple-400">{stats?.totalEnquiries || 0}</p>
          <p className="text-[10px] text-white/40 mt-1">From contact form & chatbot</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Registered Users</p>
          <p className="text-2xl font-extrabold text-blue-400">{stats?.totalCustomers || 0}</p>
          <p className="text-[10px] text-white/40 mt-1">Authenticated accounts</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-yellow-500/20 bg-yellow-500/5 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-yellow-400 mb-1">Low Stock Items</p>
          <p className="text-2xl font-extrabold text-yellow-400">{stats?.lowStockProducts?.length || 0}</p>
          <p className="text-[10px] text-yellow-400/60 mt-1">≤ 5 units remaining</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-red-500/20 bg-red-500/5 shadow-lg">
          <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-1">Out of Stock</p>
          <p className="text-2xl font-extrabold text-red-400">{stats?.outOfStockProducts?.length || 0}</p>
          <p className="text-[10px] text-red-400/60 mt-1">0 units remaining</p>
        </div>

        <div className="rounded-2xl bg-black/60 p-5 border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">Store Status</p>
            <p className="text-base font-bold text-green-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              Live & Synced
            </p>
          </div>
          <Link to="/admin/enquiries" className="text-xs text-red-400 hover:text-red-300 transition mt-2">
            View customer inbox →
          </Link>
        </div>
      </div>

      {/* Stock Attention Alert */}
      {stats?.outOfStockProducts?.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Inventory Alert: Out of Stock Tyres</h3>
            <p className="text-xs text-white/70 mt-1">
              {stats.outOfStockProducts.length} product(s) currently have zero stock. Update stock levels to prevent lost sales.
            </p>
          </div>
          <Link
            to="/admin/products"
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-red-500 transition shrink-0"
          >
            Review Stock
          </Link>
        </div>
      )}

      <SetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordLinked={() => {
          if (auth.currentUser) {
            setProviderInfo(getUserProviderInfo(auth.currentUser));
          }
        }}
      />
    </div>
  );
}
