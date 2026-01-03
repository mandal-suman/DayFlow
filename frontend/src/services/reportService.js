import api from './api';

const reportService = {
  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Get attendance report
  getAttendanceReport: async (startDate, endDate, department = null) => {
    const params = { startDate, endDate };
    if (department) params.department = department;
    const response = await api.get('/reports/attendance', { params });
    return response.data;
  },

  // Get payroll report
  getPayrollReport: async (year, month) => {
    const response = await api.get('/reports/payroll', { params: { year, month } });
    return response.data;
  },

  // Get leave report
  getLeaveReport: async (year) => {
    const response = await api.get('/reports/leaves', { params: { year } });
    return response.data;
  },
};

export default reportService;
