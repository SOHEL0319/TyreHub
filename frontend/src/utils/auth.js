export const getAdminToken = () => localStorage.getItem('tyrehub_token');

export const saveAdminSession = (user, token) => {
  localStorage.setItem('tyrehub_token', token);
  localStorage.setItem('tyrehub_user', JSON.stringify({ ...user, authType: 'admin' }));
};

export const saveGoogleSession = (user, token) => {
  localStorage.setItem('tyrehub_token', token);
  localStorage.setItem('tyrehub_user', JSON.stringify({ ...user, authType: 'google' }));
};

export const clearAuthSession = () => {
  localStorage.removeItem('tyrehub_token');
  localStorage.removeItem('tyrehub_google_token');
  localStorage.removeItem('tyrehub_user');
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('tyrehub_user') || 'null');
  } catch {
    return null;
  }
};
