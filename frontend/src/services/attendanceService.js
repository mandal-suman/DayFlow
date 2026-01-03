import api from './api';

export const attendanceService = {
  /**
   * Mark attendance (Check In / Check Out)
   */
  markAttendance: async (action) => {
    const response = await api.post('/attendance/mark', { action });
    return response.data;
  },

  /**
   * Get today's attendance status
   */
  getTodayStatus: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  /**
   * Get own attendance history
   */
  getAttendanceHistory: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/attendance/history', { params });
    return response.data;
  },

  /**
   * Get user's attendance history (Admin or Self)
   */
  getUserAttendanceHistory: async (userId, month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get(`/attendance/history/${userId}`, { params });
    return response.data;
  },

  /**
   * Get attendance summary for payroll
   */
  getAttendanceSummary: async (userId, month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get(`/attendance/summary/${userId}`, { params });
    return response.data;
  },

  /**
   * Get all attendance by date (Admin only)
   */
  getAllAttendanceByDate: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/attendance/all', { params });
    return response.data;
  },

  /**
   * Get team overview (Admin only)
   */
  getTeamOverview: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/attendance/overview', { params });
    return response.data;
  },
};

export default attendanceService;
