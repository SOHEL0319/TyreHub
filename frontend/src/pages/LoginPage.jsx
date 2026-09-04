import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { saveAdminSession, saveGoogleSession } from '../utils/auth';
import { saveUserToFirestore } from '../api/firestoreService';

const ADMIN_EMAIL = 'rasheedtyresplanet@gmail.com';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Password Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [resetError, setResetError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getFirebaseErrorMessage = (err) => {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later or reset your password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled. Please complete Google sign-in.';
      default:
        return err.message || 'Authentication failed. Please check your connection.';
    }
  };

  const checkAdminAndRedirect = (user, token, sessionSaver) => {
    const isAdmin = (user.email || '').toLowerCase().trim() === ADMIN_EMAIL;
    sessionSaver({
      _id: user.uid,
      name: user.displayName || user.email,
      email: user.email,
      role: isAdmin ? 'admin' : 'user',
    }, token);
    
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = result.user;
      
      try {
        await saveUserToFirestore(user);
      } catch (fsError) {
        console.warn('Could not save user to Firestore:', fsError);
      }
      
      checkAdminAndRedirect(user, user.accessToken, saveAdminSession);
    } catch (err) {
      console.error('Firebase Email Login Error:', err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        await saveUserToFirestore(user);
      } catch (fsError) {
        console.warn('Could not save user to Firestore:', fsError);
      }
      
      checkAdminAndRedirect(user, user.accessToken, saveGoogleSession);
    } catch (err) {
      console.error('Firebase Google Login Error:', err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess('Password reset link sent! Check your inbox.');
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError(getFirebaseErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161616] p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 text-2xl mb-3">
            ⚡
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-white">Sign In</h1>
          <p className="mt-1 text-xs text-white/50">Access TyreHub & Rasheed Tyres Planet Dashboard</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-center text-xs font-semibold text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="e.g. rasheedtyresplanet@gmail.com"
              className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Password
              </label>
              <button
                type="button"
                className="text-xs font-medium text-red-400 hover:text-red-300 transition"
                onClick={() => {
                  setResetEmail(form.email);
                  setResetSuccess(null);
                  setResetError(null);
                  setShowForgotModal(true);
                }}
              >
                Forgot?
              </button>
            </div>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-500 transition"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-full bg-red-600 px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50 mt-4 shadow-lg shadow-red-600/30 active:scale-95"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/50 mb-4">Or sign in with</p>
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
            </svg>
            {googleLoading ? 'Signing in with Google…' : 'Continue with Google'}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-white/60 mb-4">
              Enter your registered email address and we will send you a password reset link.
            </p>

            {resetSuccess && (
              <div className="mb-4 rounded-xl bg-green-500/10 p-3 text-xs font-semibold text-green-400 border border-green-500/20">
                {resetSuccess}
              </div>
            )}
            {resetError && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-400 border border-red-500/20">
                {resetError}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
