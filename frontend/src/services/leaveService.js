import api from './api';

const leaveService = {
  // Request a new leave
  requestLeave: async (data) => {
    const response = await api.post('/leaves/request', data);
    return response.data;
  },

  // Get leave balance
  getBalance: async (year) => {
    const params = year ? { year } : {};
    const response = await api.get('/leaves/balance', { params });
    return response.data;
  },

  // Get user's leave balance (Admin)
  getUserBalance: async (userId, year) => {
    const params = year ? { year } : {};
    const response = await api.get(`/leaves/balance/${userId}`, { params });
    return response.data;
  },

  // Get my leave requests
  getMyLeaves: async (filters = {}) => {
    const response = await api.get('/leaves/my', { params: filters });
    return response.data;
  },

  // Get pending requests (Admin)
  getPendingRequests: async () => {
    const response = await api.get('/leaves/pending');
    return response.data;
  },

  // Get all leaves (Admin)
  getAllLeaves: async (filters = {}) => {
    const response = await api.get('/leaves/all', { params: filters });
    return response.data;
  },

  // Approve leave (Admin)
  approveLeave: async (leaveId) => {
    const response = await api.post(`/leaves/${leaveId}/approve`);
    return response.data;
  },

  // Reject leave (Admin)
  rejectLeave: async (leaveId, reason) => {
    const response = await api.post(`/leaves/${leaveId}/reject`, { reason });
    return response.data;
  },

  // Cancel leave request
  cancelLeave: async (leaveId) => {
    const response = await api.delete(`/leaves/${leaveId}`);
    return response.data;
  },

  // Get leave calendar
  getLeaveCalendar: async (year, month) => {
    const response = await api.get('/leaves/calendar', { params: { year, month } });
    return response.data;
  },

  // Get team summary (Admin)
  getTeamSummary: async () => {
    const response = await api.get('/leaves/summary');
    return response.data;
  },
};

export default leaveService;
