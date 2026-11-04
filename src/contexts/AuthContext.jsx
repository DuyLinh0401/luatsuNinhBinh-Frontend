import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Đọc phiên đăng nhập từ localStorage ngay khi khởi tạo (đồng bộ, không cần trạng thái chờ)
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const loading = false;

  useEffect(() => {
    // Phân quyền có thể đã đổi từ lần đăng nhập trước => làm mới ngầm
    if (authService.getCurrentUser() && authService.isAuthenticated()) {
      authService.fetchCurrentUser().then(setUser).catch(() => {});
    }
  }, []);

  // Trả về { user } hoặc { twoFactorRequired, challengeToken } (cần gọi verifyTwoFactor)
  const login = async (username, password) => {
    const result = await authService.login(username, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const verifyTwoFactor = async (challengeToken, code) => {
    const userData = await authService.verifyTwoFactor(challengeToken, code);
    setUser(userData);
    return userData;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const userData = await authService.changePassword(currentPassword, newPassword);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAdmin = !!user?.roles?.includes('ADMIN');
  // ADMIN luôn có toàn quyền (giống middleware backend)
  const can = (permissionName) => isAdmin || !!user?.permissions?.includes(permissionName);

  const value = {
    user,
    loading,
    login,
    verifyTwoFactor,
    logout,
    changePassword,
    // Cập nhật user sau các thao tác bật/tắt 2FA (authService đã lưu localStorage)
    setCurrentUser: setUser,
    isAdmin,
    isStaff: user?.roles?.includes('STAFF'),
    isGuest: !user || user?.roles?.includes('GUEST'),
    hasRole: (roles) => user?.roles?.some(role => roles.includes(role)),
    can,
    canAny: (permissionNames = []) => permissionNames.some(can)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
