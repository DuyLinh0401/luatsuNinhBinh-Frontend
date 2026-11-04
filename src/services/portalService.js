// API cổng thông tin Đoàn Luật sư (bài viết, chuyên mục, văn bản, lịch, nhiệm kỳ...)
import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const unwrap = (promise) => promise.then((res) => res.data.data);

// Đường dẫn /uploads/... do backend phục vụ -> URL đầy đủ để hiển thị/tải
export const assetUrl = (path) => {
  if (!path) return '';
  return /^(https?:)?\/\//.test(path) || path.startsWith('data:') ? path : `${API_ORIGIN}${path}`;
};

// Tạo bộ CRUD chuẩn cho một resource
const crud = (base) => ({
  list: (params) => unwrap(api.get(base, { params })),
  manage: (params) => unwrap(api.get(`${base}/manage`, { params })),
  get: (id) => unwrap(api.get(`${base}/manage/${id}`)),
  bySlug: (slug) => unwrap(api.get(`${base}/slug/${slug}`)),
  create: (data) => unwrap(api.post(base, data)),
  update: (id, data) => unwrap(api.put(`${base}/${id}`, data)),
  remove: (id) => unwrap(api.delete(`${base}/${id}`))
});

export const postApi = {
  ...crud('/posts'),
  popular: (params) => unwrap(api.get('/posts/popular', { params })),
  setStatus: (id, status) => unwrap(api.put(`/posts/${id}/status`, { status }))
};

export const categoryApi = {
  tree: (params) => unwrap(api.get('/categories', { params })),
  all: (params) => unwrap(api.get('/categories/all', { params })),
  bySlug: (slug) => unwrap(api.get(`/categories/slug/${slug}`)),
  create: (data) => unwrap(api.post('/categories', data)),
  update: (id, data) => unwrap(api.put(`/categories/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/categories/${id}`))
};

export const documentApi = {
  ...crud('/legal-documents'),
  filters: () => unwrap(api.get('/legal-documents/filters'))
};

// Soạn bản nháp bài viết bằng AI từ một đường dẫn (đọc bài + tóm tắt mất 30-120 giây)
export const aiApi = {
  sources: () => unwrap(api.get('/ai/sources')),
  // payload: { url } để server tự đọc bài, hoặc { url, title, text } khi người dùng dán nội dung
  postDraft: (payload) => unwrap(api.post('/ai/post-draft', payload, { timeout: 300000 }))
};

export const pageApi = crud('/pages');
export const eventApi = crud('/events');

export const termApi = {
  ...crud('/terms'),
  current: () => unwrap(api.get('/terms/current'))
};

export const organizationApi = crud('/organizations');

export const practiceAreaApi = {
  list: () => unwrap(api.get('/practice-areas')),
  create: (data) => unwrap(api.post('/practice-areas', data)),
  update: (id, data) => unwrap(api.put(`/practice-areas/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/practice-areas/${id}`))
};

export const lawyerApi = {
  directory: (params) => unwrap(api.get('/lawyers/directory', { params })),
  manage: (params) => unwrap(api.get('/lawyers/manage', { params })),
  list: (params) => unwrap(api.get('/lawyers', { params })),
  all: () => unwrap(api.get('/lawyers/all')),
  get: (id) => unwrap(api.get(`/lawyers/manage/${id}`)),
  bySlug: (slug) => unwrap(api.get(`/lawyers/slug/${slug}`)),
  create: (data) => unwrap(api.post('/lawyers', data)),
  update: (id, data) => unwrap(api.put(`/lawyers/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/lawyers/${id}`))
};

export const bannerApi = {
  list: (params) => unwrap(api.get('/banners', { params })),
  manage: (params) => unwrap(api.get('/banners/manage', { params })),
  create: (data) => unwrap(api.post('/banners', data)),
  update: (id, data) => unwrap(api.put(`/banners/${id}`, data)),
  remove: (id) => unwrap(api.delete(`/banners/${id}`))
};

export const menuApi = {
  get: (location) => unwrap(api.get(`/menus/${location.toLowerCase()}`)),
  manage: (location) => unwrap(api.get(`/menus/manage/${location.toLowerCase()}`)),
  save: (location, items) => unwrap(api.put(`/menus/${location.toLowerCase()}`, { items }))
};

export const settingApi = {
  get: () => unwrap(api.get('/settings')),
  update: (data) => unwrap(api.put('/settings', data))
};

export const portalApi = {
  home: (params) => unwrap(api.get('/portal/home', { params })),
  sidebar: () => unwrap(api.get('/portal/sidebar')),
  search: (params) => unwrap(api.get('/portal/search', { params })),
  meta: () => unwrap(api.get('/portal/meta')),
  dashboard: () => unwrap(api.get('/portal/dashboard'))
};

// Upload nhiều tệp; trả về [{ fileUrl, fileName, mimeType, size }]
// Phải ghi đè Content-Type: instance api mặc định JSON sẽ khiến axios đổi FormData thành JSON
export const uploadFiles = (files, onProgress) => {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append('files', f));
  return unwrap(
    api.post('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // video tối đa 100MB, server còn phải đẩy tiếp lên Cloudinary
      onUploadProgress: onProgress && ((e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)))
    })
  );
};

export const errorMessage = (error, fallback = 'Đã có lỗi xảy ra') =>
  error?.response?.data?.message || error?.message || fallback;
