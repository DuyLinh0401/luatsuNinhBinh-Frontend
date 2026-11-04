import { createContext, useContext } from 'react';

// Dữ liệu dùng chung toàn site công khai: cấu hình, menu, cây chuyên mục.
// Provider nằm ở SiteProvider.jsx (tách file để fast refresh hoạt động).
export const SiteContext = createContext(null);

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite phải dùng bên trong <SiteProvider>');
  return ctx;
};
