import { useState } from 'react';
import { auth } from '../firebase';
import { linkEmailPasswordToCurrentUser, getUserProviderInfo } from '../utils/authLinking';

export default function SetPasswordModal({ isOpen, onClose, onPasswordLinked }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const currentUser = auth.currentUser;
  const { hasPassword } = getUserProviderInfo(currentUser);
  const userEmail = currentUser?.email || 'Your account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await linkEmailPasswordToCurrentUser(auth, password);
      setSuccess(res.message);
      setPassword('');
      setConfirmPassword('');
      if (onPasswordLinked) {
        onPasswordLinked(res.action);
      }
    } catch (err) {
      setError(err.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#181818] p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-white/50 hover:text-white transition text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-left mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 text-xl mb-3">
            🔐
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            {hasPassword ? 'Update Account Password' : 'Set Account Password'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {hasPassword
              ? `Change direct email login password for ${userEmail}.`
              : `Link a password to ${userEmail} to enable direct Email/Password sign-in in addition to Google.`}
          </p>
        </div>

        {success && (
          <div className="mb-5 rounded-2xl bg-green-500/10 p-4 text-xs font-semibold text-green-400 border border-green-500/20">
            <p className="font-bold mb-1">✓ Success</p>
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl bg-red-500/10 p-4 text-xs font-semibold text-red-400 border border-red-500/20">
            <p className="font-bold mb-1">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                {hasPassword ? 'New Password' : 'Choose Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50 shadow-md shadow-red-600/30"
              >
                {loading ? 'Saving…' : (hasPassword ? 'Update Password' : 'Save & Link Password')}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
