import axios from 'axios';
import { CHANGE_PASSWORD_PATH, SECURITY_PATH } from '../utils/authRedirect';

// Sử dụng Vite env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Các request xác thực trả 401 nghĩa là sai thông tin, không phải token hết hạn
const AUTH_ENDPOINTS = ['/auth/login', '/auth/login/2fa', '/auth/refresh-token', '/auth/change-password'];

// Backend chặn API cho tới khi hoàn tất bước bắt buộc => chuyển tới trang tương ứng
const REQUIRED_STEP_PATHS = {
  PASSWORD_CHANGE_REQUIRED: CHANGE_PASSWORD_PATH,
  TWO_FACTOR_SETUP_REQUIRED: SECURITY_PATH
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Đang dùng mật khẩu tạm / ADMIN chưa bật 2FA: backend chặn mọi API khác
    const requiredPath = error.response?.status === 403 && REQUIRED_STEP_PATHS[error.response.data?.code];
    if (requiredPath) {
      if (window.location.pathname !== requiredPath) window.location.href = requiredPath;
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !AUTH_ENDPOINTS.some((p) => originalRequest.url?.endsWith(p))) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
