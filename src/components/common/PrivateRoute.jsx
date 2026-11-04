import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CHANGE_PASSWORD_PATH, SECURITY_PATH } from '../../utils/authRedirect';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mật khẩu tạm từ email / ADMIN chưa bật 2FA: hoàn tất trước khi vào khu quản trị
  if (user.mustChangePassword) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  if (user.twoFactorSetupRequired) {
    return <Navigate to={SECURITY_PATH} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.some(role => user.roles?.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;