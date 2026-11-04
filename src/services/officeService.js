import api from './api';

// Công khai: chỉ văn phòng đang hiển thị, trụ sở chính đứng đầu
const getOffices = async () => {
  const response = await api.get('/offices');
  return response.data.data;
};

// Quản trị: gồm cả văn phòng đang ẩn, theo thứ tự hiển thị
const getManageOffices = async () => {
  const response = await api.get('/offices/manage');
  return response.data.data;
};

const getOfficeById = async (id) => {
  const response = await api.get(`/offices/${id}`);
  return response.data.data;
};

const createOffice = async (data) => {
  const response = await api.post('/offices', data);
  return response.data.data;
};

const updateOffice = async (id, data) => {
  const response = await api.put(`/offices/${id}`, data);
  return response.data.data;
};

const reorderOffices = async (ids) => {
  const response = await api.put('/offices/reorder', { ids });
  return response.data.data;
};

const deleteOffice = async (id) => {
  const response = await api.delete(`/offices/${id}`);
  return response.data;
};

export default { getOffices, getManageOffices, getOfficeById, createOffice, updateOffice, reorderOffices, deleteOffice };
