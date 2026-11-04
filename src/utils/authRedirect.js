// Trang đích sau khi đăng nhập / đổi mật khẩu
export const CHANGE_PASSWORD_PATH = '/doi-mat-khau';
export const SECURITY_PATH = '/bao-mat';

export const homePathFor = (user) => {
  // Các bước bắt buộc trước khi vào khu quản trị
  if (user?.mustChangePassword) return CHANGE_PASSWORD_PATH;
  if (user?.twoFactorSetupRequired) return SECURITY_PATH;
  if (user?.roles?.includes('ADMIN')) return '/admin';
  if (user?.roles?.includes('STAFF')) return '/staff';
  return '/';
};
