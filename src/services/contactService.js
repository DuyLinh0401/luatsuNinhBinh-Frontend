import api from './api';

const createContact = async (data) => {
  const response = await api.post('/contacts', data);
  return response.data.data;
};

// Trả về { items, pagination, counts } — counts: số liên hệ theo trạng thái + UNREAD, ALL
const getContacts = async (params = {}) => {
  const response = await api.get('/contacts', { params });
  return response.data.data;
};

const getContactById = async (id) => {
  const response = await api.get(`/contacts/${id}`);
  return response.data.data;
};

// data: { status?, isRead?, response?, sendEmail? }
const updateContact = async (id, data) => {
  const response = await api.put(`/contacts/${id}`, data);
  return response.data.data;
};

const deleteContact = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

// assignedTo: id cán bộ hoặc null để bỏ phân công
const assignContact = async (id, assignedTo) => {
  const response = await api.put(`/contacts/${id}/assign`, { assignedTo });
  return response.data.data;
};

// Cán bộ có thể nhận phân công (ADMIN hoặc có quyền xem liên hệ)
const getAssignees = async () => {
  const response = await api.get('/contacts/assignees');
  return response.data.data;
};

export default { createContact, getContacts, getContactById, updateContact, deleteContact, assignContact, getAssignees };
