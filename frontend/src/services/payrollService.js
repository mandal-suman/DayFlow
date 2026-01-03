import api from './api';

const payrollService = {
  // Get payroll summary (Admin)
  getSummary: async () => {
    const response = await api.get('/payroll/summary');
    return response.data;
  },

  // Get all employees with salaries (Admin)
  getAllSalaries: async () => {
    const response = await api.get('/payroll/employees');
    return response.data;
  },

  // Get salary structure for a user
  getSalaryStructure: async (userId) => {
    const response = await api.get(`/payroll/salary/${userId}`);
    return response.data;
  },

  // Create or update salary structure (Admin)
  upsertSalaryStructure: async (userId, data) => {
    const response = await api.post(`/payroll/salary/${userId}`, data);
    return response.data;
  },

  // Get salary history (Admin)
  getSalaryHistory: async (userId) => {
    const response = await api.get(`/payroll/salary/${userId}/history`);
    return response.data;
  },

  // Get payslip for a user
  getPayslip: async (userId, year, month) => {
    const response = await api.get(`/payroll/payslip/${userId}`, {
      params: { year, month },
    });
    return response.data;
  },

  // Get own payslip
  getMyPayslip: async (year, month) => {
    const response = await api.get('/payroll/my-payslip', {
      params: { year, month },
    });
    return response.data;
  },

  // Generate monthly payroll (Admin)
  generatePayroll: async (year, month) => {
    const response = await api.get('/payroll/generate', {
      params: { year, month },
    });
    return response.data;
  },
};

export default payrollService;
