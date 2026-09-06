import { 
  EmailAuthProvider, 
  linkWithCredential, 
  updatePassword,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

/**
 * Checks the linked providers for a Firebase user object.
 * @param {import('firebase/auth').User | null} user
 * @returns {{ isGoogle: boolean, hasPassword: boolean, providers: string[] }}
 */
export function getUserProviderInfo(user) {
  if (!user || !user.providerData) {
    return { isGoogle: false, hasPassword: false, providers: [] };
  }
  const providers = user.providerData.map(p => p.providerId);
  return {
    isGoogle: providers.includes('google.com'),
    hasPassword: providers.includes('password'),
    providers
  };
}

/**
 * Links an Email/Password credential or updates existing password for the current authenticated user.
 * @param {import('firebase/auth').Auth} auth
 * @param {string} password
 * @returns {Promise<{ success: boolean, action: 'linked' | 'updated', message: string }>}
 */
export async function linkEmailPasswordToCurrentUser(auth, password) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No authenticated user session found. Please sign in first.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { hasPassword } = getUserProviderInfo(user);

  try {
    if (hasPassword) {
      // User already has a password provider linked, update password
      await updatePassword(user, password);
      return {
        success: true,
        action: 'updated',
        message: 'Password updated successfully! You can now use your new password.'
      };
    } else {
      // User is Google-only, link EmailAuthProvider credential to the same Firebase user
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      return {
        success: true,
        action: 'linked',
        message: `Password linked successfully to ${user.email}! You can now sign in using either Google or Email/Password.`
      };
    }
  } catch (error) {
    console.error('Account Linking / Password Update Error:', error);

    // If Firebase requires recent authentication, re-authenticate with Google popup and retry
    if (error.code === 'auth/requires-recent-login') {
      try {
        const googleProvider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, googleProvider);
        
        if (hasPassword) {
          await updatePassword(user, password);
          return {
            success: true,
            action: 'updated',
            message: 'Password updated successfully! You can now use your new password.'
          };
        } else {
          const credential = EmailAuthProvider.credential(user.email, password);
          await linkWithCredential(user, credential);
          return {
            success: true,
            action: 'linked',
            message: `Password linked successfully to ${user.email}! You can now sign in using either Google or Email/Password.`
          };
        }
      } catch (reauthErr) {
        throw new Error(getLinkingErrorMessage(reauthErr));
      }
    }

    throw new Error(getLinkingErrorMessage(error));
  }
}

/**
 * Known Google-registered accounts or cached Google sign-in emails in local storage.
 */
const DEFAULT_GOOGLE_EMAILS = [
  'sohelns1786@gmail.com',
  'rasheedtyresplanet@gmail.com'
];

export function recordGoogleUserEmail(email) {
  if (!email) return;
  try {
    const list = JSON.parse(localStorage.getItem('tyrehub_google_accounts') || '[]');
    const normalized = email.toLowerCase().trim();
    if (!list.includes(normalized)) {
      list.push(normalized);
      localStorage.setItem('tyrehub_google_accounts', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Could not record google user email:', e);
  }
}

export function isKnownGoogleAccount(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (DEFAULT_GOOGLE_EMAILS.includes(normalized)) return true;
  try {
    const list = JSON.parse(localStorage.getItem('tyrehub_google_accounts') || '[]');
    return list.includes(normalized);
  } catch {
    return false;
  }
}

/**
 * Maps Firebase linking error codes to user-friendly messages.
 * @param {any} error
 * @returns {string}
 */
export function getLinkingErrorMessage(error) {
  switch (error.code) {
    case 'auth/provider-already-linked':
      return 'The Email/Password provider is already linked to this account.';
    case 'auth/credential-already-in-use':
    case 'auth/email-already-in-use':
      return 'This email or credential is already linked to another Firebase account.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'For your security, please re-authenticate with Google before setting the password.';
    case 'auth/popup-closed-by-user':
      return 'Re-authentication was cancelled. Please try again.';
    default:
      return error.message || 'Failed to update credentials. Please try again.';
  }
}
