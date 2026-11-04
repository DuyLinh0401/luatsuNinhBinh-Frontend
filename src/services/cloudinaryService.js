// API theo dõi Cloudinary (chỉ ADMIN). Frontend không bao giờ gọi trực tiếp Cloudinary Admin API.
import api from './api';

const BASE = '/admin/cloudinary';

const getOverview = async () => (await api.get(`${BASE}/overview`)).data.data;
const getUsage = async () => (await api.get(`${BASE}/usage`)).data.data;
// range: '7d' | '30d' | '90d'
const getHistory = async (range) => (await api.get(`${BASE}/usage/history`, { params: { range } })).data.data;
// params: { q, resource_type, format, sort_by, order, limit, cursor }
const getResources = async (params) => (await api.get(`${BASE}/resources`, { params })).data.data;
// Trả về { message, data: { deduplicated, snapshot, usage, ... } }
const sync = async () => (await api.post(`${BASE}/sync`, {})).data;

export default { getOverview, getUsage, getHistory, getResources, sync };
