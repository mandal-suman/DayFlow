import api from './api';

export const authService = {
  /**
   * Login user
   */
  login: async (loginId, password) => {
    const response = await api.post('/auth/login', { loginId, password });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Create new user (Admin only)
   */
  createUser: async (userData) => {
    const response = await api.post('/auth/create-user', userData);
    return response.data;
  },

  /**
   * Reset user password (Admin only)
   */
  resetPassword: async (userId) => {
    const response = await api.post(`/auth/reset-password/${userId}`);
    return response.data;
  },
};

export default authService;
