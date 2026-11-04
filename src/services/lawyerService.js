import api from './api';

const getLawyers = async (params = {}) => {
  const response = await api.get('/lawyers', { params });
  return response.data.data;
};

const getAllLawyers = async () => {
  const response = await api.get('/lawyers/all');
  return response.data.data;
};

const getLawyerById = async (id) => {
  const response = await api.get(`/lawyers/${id}`);
  return response.data.data;
};

const getLawyerBySlug = async (slug) => {
  const response = await api.get(`/lawyers/slug/${slug}`);
  return response.data.data;
};

const createLawyer = async (data) => {
  const response = await api.post('/lawyers', data);
  return response.data.data;
};

const updateLawyer = async (id, data) => {
  const response = await api.put(`/lawyers/${id}`, data);
  return response.data.data;
};

const deleteLawyer = async (id) => {
  const response = await api.delete(`/lawyers/${id}`);
  return response.data;
};

const getSpecializations = async () => {
  const response = await api.get('/lawyers/specializations');
  return response.data.data;
};

export default {
  getLawyers,
  getAllLawyers,
  getLawyerById,
  getLawyerBySlug,
  createLawyer,
  updateLawyer,
  deleteLawyer,
  getSpecializations
};