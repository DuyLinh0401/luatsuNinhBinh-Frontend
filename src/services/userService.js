import api from './api';

const getUsers = async () => {
  const response = await api.get('/users');
  return response.data.data;
};

// Hồ sơ luật sư để liên kết tài khoản (đăng nhập bằng số CCHN / số thẻ)
const getLawyerOptions = async () => {
  const response = await api.get('/users/lawyer-options');
  return response.data.data;
};

// Trả về { message, data: { ...user, emailSent, emailError } }
const createUser = async (data) => {
  const response = await api.post('/users', data, { timeout: 30000 });
  return response.data;
};

const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data;
};

// Sinh mật khẩu tạm mới và gửi vào email người dùng
const resetPassword = async (id) => {
  const response = await api.post(`/users/${id}/reset-password`, {}, { timeout: 30000 });
  return response.data;
};

// Tắt 2FA cho người dùng mất điện thoại
const resetTwoFactor = async (id) => {
  const response = await api.post(`/users/${id}/reset-2fa`, {}, { timeout: 30000 });
  return response.data;
};

// Mở khóa đăng nhập bị tạm khóa do nhập sai nhiều lần
const unlockLogin = async (id) => {
  const response = await api.post(`/users/${id}/unlock-login`);
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

const getRolesAndPermissions = async () => {
  const response = await api.get('/users/roles/permissions');
  return response.data.data;
};

const updateRolePermissions = async (roleId, permissionNames) => {
  const response = await api.put(`/users/roles/${roleId}/permissions`, { permissionNames });
  return response.data;
};

export default {
  getUsers,
  getLawyerOptions,
  createUser,
  updateUser,
  resetPassword,
  resetTwoFactor,
  unlockLogin,
  deleteUser,
  getRolesAndPermissions,
  updateRolePermissions
};
