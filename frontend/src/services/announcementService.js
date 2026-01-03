import api from './api';

const announcementService = {
  // Get active announcements (for all users)
  getActive: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },

  // Get all announcements (admin)
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get('/announcements/all', { params: { page, limit } });
    return response.data;
  },

  // Create announcement (admin)
  create: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  // Update announcement (admin)
  update: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  // Delete announcement (admin)
  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};

export default announcementService;
