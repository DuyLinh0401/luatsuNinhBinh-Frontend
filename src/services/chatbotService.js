// Trợ lý ảo pháp luật: API công khai cho khách + API quản trị câu hỏi thường gặp
import api from './api';

const BASE = '/chatbot';

const getConfig = async () => (await api.get(`${BASE}/config`)).data.data;
// history: [{ role: 'user' | 'assistant', content }] — vài lượt gần nhất để hiểu câu hỏi tiếp nối
const ask = async (question, history = []) => (await api.post(`${BASE}/ask`, { question, history })).data.data;

const listFaqs = async (params) => (await api.get(`${BASE}/faqs`, { params })).data.data;
const createFaq = async (data) => (await api.post(`${BASE}/faqs`, data)).data.data;
const updateFaq = async (id, data) => (await api.put(`${BASE}/faqs/${id}`, data)).data.data;
const deleteFaq = async (id) => (await api.delete(`${BASE}/faqs/${id}`)).data;
const getStatus = async () => (await api.get(`${BASE}/admin/status`)).data.data;
const updateSettings = async (data) => (await api.put(`${BASE}/admin/settings`, data)).data.data;

export default { getConfig, ask, listFaqs, createFaq, updateFaq, deleteFaq, getStatus, updateSettings };
