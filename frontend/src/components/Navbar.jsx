import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearAuthSession } from '../utils/auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import SetPasswordModal from './SetPasswordModal';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Tyres', to: '/tyres' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          let name = firebaseUser.displayName;
          const isSuperAdmin = (firebaseUser.email || '').toLowerCase().trim() === 'rasheedtyresplanet@gmail.com';
          let role = isSuperAdmin ? 'admin' : 'user';
          
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (!name && data.name) name = data.name;
              if (data.role === 'admin' || isSuperAdmin) role = 'admin';
            }
          } catch (err) {
            console.warn("Could not fetch user document:", err);
          }

          if (!name) {
            name = firebaseUser.email?.split('@')[0] || 'User';
          }
          
          setUser({ ...firebaseUser, name, role });
        } else {
          setUser(null);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    clearAuthSession();
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === 'admin' || (user?.email || '').toLowerCase().trim() === 'rasheedtyresplanet@gmail.com';
  const hasPassword = user?.providerData?.some(p => p.providerId === 'password');

  return (
    <>
      <header className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 h-[80px] flex flex-col justify-center ${isScrolled ? 'border-white/10 bg-black/95 backdrop-blur-md' : 'border-transparent bg-transparent'}`}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-[0.18em] text-white hover:text-red-500 transition-colors">
            <span className="text-red-500 text-2xl">⚡</span>
            <span>Tyre<span className="text-red-500">Hub</span></span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition hover:text-red-500 ${
                    isActive ? 'text-red-500' : 'text-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {!user ? (
              <Link to="/login" className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500 shadow-md shadow-red-600/20">
                LOGIN
              </Link>
            ) : (
              <div className="flex items-center gap-3 border-l border-white/10 pl-5">
                <span className="text-sm font-medium text-white/90">Hi, {user.name?.split(' ')[0]}</span>
                {isAdmin && (
                  <Link to="/admin" className="rounded-full bg-red-600/20 border border-red-500/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-600 hover:text-white transition">
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  title={hasPassword ? 'Update Account Password' : 'Set Password for Direct Email Login'}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                    !hasPassword
                      ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                      : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{!hasPassword ? '🔑' : '🔐'}</span>
                  <span className="hidden lg:inline">{!hasPassword ? 'Set Password' : 'Password'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-red-500 hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[80px] bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-base font-semibold transition ${
                      isActive ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 pt-4">
              {!user ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center rounded-xl bg-red-600 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-500 transition shadow-lg shadow-red-600/30"
                >
                  Login
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-white/60">Signed in as</span>
                    <span className="text-sm font-bold text-white">{user.name}</span>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center rounded-xl bg-red-600/20 border border-red-500/40 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-600 hover:text-white transition"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowPasswordModal(true);
                    }}
                    className={`block w-full text-center rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                      !hasPassword
                        ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                        : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {!hasPassword ? '🔑 Set Account Password' : '🔐 Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-center rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <SetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordLinked={() => {
          if (auth.currentUser) {
            setUser({ ...auth.currentUser, name: user.name, role: user.role });
          }
        }}
      />
    </>
  );
}
