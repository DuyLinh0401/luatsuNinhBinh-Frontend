import api from './api';

const saveSession = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

// Bước 1. Trả về { user } khi đăng nhập xong, hoặc { twoFactorRequired, challengeToken } khi cần nhập mã 2FA
const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  const data = response.data.data;
  if (data.twoFactorRequired) return { twoFactorRequired: true, challengeToken: data.challengeToken };
  return { user: saveSession(data) };
};

// Bước 2: mã 6 số từ ứng dụng xác thực hoặc mã dự phòng
const verifyTwoFactor = async (challengeToken, code) => {
  const response = await api.post('/auth/login/2fa', { challengeToken, code });
  return saveSession(response.data.data);
};

const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Lấy lại vai trò/quyền mới nhất từ server (admin có thể vừa đổi phân quyền)
const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return saveUser(response.data.data);
};

// Đổi mật khẩu: server cấp token mới (token cũ hết hiệu lực)
const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return saveSession(response.data.data);
};

// ===== Xác thực 2 bước =====
const startTwoFactorSetup = async () => (await api.post('/auth/2fa/setup')).data.data;

// Trả về { user, backupCodes }
const enableTwoFactor = async (code) => {
  const { user, backupCodes } = (await api.post('/auth/2fa/enable', { code })).data.data;
  return { user: saveUser(user), backupCodes };
};

const disableTwoFactor = async (password, code) => {
  const { user } = (await api.post('/auth/2fa/disable', { password, code })).data.data;
  return saveUser(user);
};

const regenerateBackupCodes = async (code) => {
  const { user, backupCodes } = (await api.post('/auth/2fa/backup-codes', { code })).data.data;
  return { user: saveUser(user), backupCodes };
};

const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

const hasRole = (roles) => {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.some(role => user.roles.includes(role));
};

export default {
  login,
  verifyTwoFactor,
  logout,
  getCurrentUser,
  fetchCurrentUser,
  changePassword,
  startTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
  isAuthenticated,
  hasRole
};
