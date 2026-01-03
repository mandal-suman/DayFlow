import api from './api';

export const userService = {
  /**
   * Get all users (Admin only)
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get user profile
   */
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, data) => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Deactivate user (Admin only)
   */
  deactivateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Activate user (Admin only)
   */
  activateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Get departments list
   */
  getDepartments: async () => {
    const response = await api.get('/users/meta/departments');
    return response.data;
  },

  /**
   * Get managers list
   */
  getManagers: async () => {
    const response = await api.get('/users/meta/managers');
    return response.data;
  },
};

export default userService;
