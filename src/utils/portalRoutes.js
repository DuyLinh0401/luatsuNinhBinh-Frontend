// Đường dẫn công khai của cổng thông tin (khớp với menu đã seed ở backend/prisma/seed-portal.js)
export const portalRoutes = {
  post: (slug) => `/bai-viet/${slug}`,
  category: (slug, parentSlug) => (parentSlug ? `/p/${parentSlug}/${slug}` : `/p/${slug}`),
  documents: (categorySlug) => (categorySlug ? `/van-ban/${categorySlug}` : '/van-ban'),
  document: (slug) => `/van-ban/chi-tiet/${slug}`,
  page: (slug, parentSlug) => (parentSlug ? `/${parentSlug}/${slug}` : `/${slug}`),
  event: (slug) => `/lich-cong-tac/${slug}`,
  term: (slug) => `/gioi-thieu/ban-chu-nhiem/${slug}`,
  lawyer: (slug) => `/tra-cuu/luat-su/${slug}`,
  organization: (slug) => `/tra-cuu/to-chuc-hanh-nghe/${slug}`
};
