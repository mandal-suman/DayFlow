import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import payrollService from '../services/payrollService';
import { 
  DollarSign, 
  Users, 
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit2,
  X,
  Check,
  Download,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const Payroll = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showSalaryModal, setShowSalaryModal] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(null);

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'payroll' && isAdmin) {
      loadPayroll();
    }
  }, [activeTab, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, summaryRes] = await Promise.all([
        payrollService.getAllSalaries(),
        payrollService.getSummary(),
      ]);

      if (employeesRes.success) setEmployees(employeesRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const loadPayroll = async () => {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const res = await payrollService.generatePayroll(year, month);
      if (res.success) setPayroll(res.data);
    } catch (err) {
      console.error('Failed to generate payroll:', err);
    }
  };

  const navigateMonth = (direction) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (!isAdmin) {
    return <EmployeePayrollView />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500">Manage salaries and generate payslips</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {summary?.employeesWithSalary || 0}
              </p>
              <p className="text-sm text-green-600">Employees with Salary</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(summary?.totalMonthlyWage)}
              </p>
              <p className="text-sm text-blue-600">Monthly Payroll</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-xl text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(summary?.averageSalary)}
              </p>
              <p className="text-sm text-purple-600">Average Salary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'employees'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Employee Salaries
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'payroll'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Monthly Payroll
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'employees' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Salary Structure</h2>
          
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500 border-b">
                    <th className="pb-3 pr-4">Employee</th>
                    <th className="pb-3 pr-4">Department</th>
                    <th className="pb-3 pr-4">Month Wage</th>
                    <th className="pb-3 pr-4">Basic</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((emp) => (
                    <tr key={emp.employeeId} className="text-sm">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-gray-500 text-xs">{emp.loginId}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{emp.department || '-'}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {emp.salary ? formatCurrency(emp.salary.monthWage) : '-'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {emp.salary ? formatCurrency(emp.salary.basicSalary) : '-'}
                      </td>
                      <td className="py-3 pr-4">
                        {emp.salary ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-warning">No Salary</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowSalaryModal(emp)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="Edit Salary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {emp.salary && (
                            <button
                              onClick={() => setShowPayslipModal(emp)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="View Payslip"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-gray-700 min-w-[140px] text-center">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {payroll && (
            <>
              {/* Payroll Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-gray-800">{payroll.summary.totalEmployees}</p>
                  <p className="text-sm text-gray-500">Employees</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(payroll.summary.grossSalary)}</p>
                  <p className="text-sm text-gray-500">Gross Salary</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(payroll.summary.totalDeductions)}</p>
                  <p className="text-sm text-gray-500">Deductions</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(payroll.summary.netSalary)}</p>
                  <p className="text-sm text-gray-500">Net Payable</p>
                </div>
              </div>

              {/* Payslips Table */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Payslips for {payroll.period.monthName} {payroll.period.year}
                </h2>
                
                {payroll.payslips.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payslips generated for this month</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm font-medium text-gray-500 border-b">
                          <th className="pb-3 pr-4">Employee</th>
                          <th className="pb-3 pr-4">Work Days</th>
                          <th className="pb-3 pr-4">Gross</th>
                          <th className="pb-3 pr-4">Deductions</th>
                          <th className="pb-3 pr-4">Net Pay</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payroll.payslips.map((slip) => (
                          <tr key={slip.employee.id} className="text-sm">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-800">{slip.employee.name}</p>
                              <p className="text-gray-500 text-xs">{slip.employee.department}</p>
                            </td>
                            <td className="py-3 pr-4 text-gray-600">
                              {slip.attendance.payableDays} / {slip.attendance.totalWorkingDays}
                            </td>
                            <td className="py-3 pr-4 text-green-600 font-medium">
                              {formatCurrency(slip.earnings.grossSalary)}
                            </td>
                            <td className="py-3 pr-4 text-red-600">
                              {formatCurrency(slip.deductions.totalDeductions)}
                            </td>
                            <td className="py-3 pr-4 font-bold text-gray-800">
                              {formatCurrency(slip.netSalary)}
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => setShowPayslipModal({ 
                                  employeeId: slip.employee.id,
                                  name: slip.employee.name 
                                })}
                                className="text-primary-600 hover:underline text-sm"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {payroll.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-700 mb-2">
                      Failed to generate payslips for:
                    </p>
                    {payroll.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-600">
                        {err.name}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <SalaryModal
          employee={showSalaryModal}
          onClose={() => setShowSalaryModal(null)}
          onSave={() => {
            setShowSalaryModal(null);
            loadData();
          }}
        />
      )}

      {/* Payslip Modal */}
      {showPayslipModal && (
        <PayslipModal
          employeeId={showPayslipModal.employeeId}
          employeeName={showPayslipModal.name}
          onClose={() => setShowPayslipModal(null)}
        />
      )}
    </div>
  );
};

// Salary Edit Modal
const SalaryModal = ({ employee, onClose, onSave }) => {
  const [monthWage, setMonthWage] = useState(employee.salary?.monthWage || '');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  // Calculate preview
  useEffect(() => {
    if (monthWage && parseFloat(monthWage) > 0) {
      const wage = parseFloat(monthWage);
      const basic = wage * 0.50;
      const hra = basic * 0.50;
      const standardAllowance = 4167;
      const performanceBonus = basic * 0.0833;
      const lta = basic * 0.0833;
      const pfDeduction = basic * 0.12;
      const professionalTax = 200;
      const fixedAllowance = wage - (basic + hra + standardAllowance + performanceBonus + lta);
      const gross = wage;
      const net = gross - pfDeduction - professionalTax;

      setPreview({
        basic: Math.round(basic),
        hra: Math.round(hra),
        standardAllowance,
        performanceBonus: Math.round(performanceBonus),
        lta: Math.round(lta),
        fixedAllowance: Math.round(fixedAllowance),
        pfDeduction: Math.round(pfDeduction),
        professionalTax,
        gross: Math.round(gross),
        net: Math.round(net),
      });
    } else {
      setPreview(null);
    }
  }, [monthWage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monthWage || parseFloat(monthWage) <= 0) {
      toast.error('Please enter a valid month wage');
      return;
    }

    setSubmitting(true);
    try {
      const res = await payrollService.upsertSalaryStructure(employee.employeeId, {
        monthWage: parseFloat(monthWage),
        effectiveFrom,
      });
      if (res.success) {
        toast.success('Salary structure saved');
        onSave();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save salary');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Salary Structure - {employee.name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Month Wage (CTC)</label>
              <input
                type="number"
                value={monthWage}
                onChange={(e) => setMonthWage(e.target.value)}
                className="input-field"
                placeholder="e.g., 50000"
                min="0"
                required
              />
            </div>
            <div>
              <label className="input-label">Effective From</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {preview && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-700">Salary Breakdown Preview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Earnings</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">{formatCurrency(preview.basic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA</span>
                      <span className="font-medium">{formatCurrency(preview.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard Allowance</span>
                      <span className="font-medium">{formatCurrency(preview.standardAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Bonus</span>
                      <span className="font-medium">{formatCurrency(preview.performanceBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LTA</span>
                      <span className="font-medium">{formatCurrency(preview.lta)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixed Allowance</span>
                      <span className="font-medium">{formatCurrency(preview.fixedAllowance)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-medium text-green-600">
                      <span>Gross Salary</span>
                      <span>{formatCurrency(preview.gross)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Deductions</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Provident Fund (12%)</span>
                      <span className="font-medium text-red-600">{formatCurrency(preview.pfDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Tax</span>
                      <span className="font-medium text-red-600">{formatCurrency(preview.professionalTax)}</span>
                    </div>
                  </div>
                  <div className="mt-8 pt-2 border-t">
                    <div className="flex justify-between text-lg font-bold text-primary-600">
                      <span>Net Salary</span>
                      <span>{formatCurrency(preview.net)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payslip View Modal
const PayslipModal = ({ employeeId, employeeName, onClose }) => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadPayslip();
  }, [selectedMonth]);

  const loadPayslip = async () => {
    setLoading(true);
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const res = await payrollService.getPayslip(employeeId, year, month);
      if (res.success) setPayslip(res.data);
    } catch (err) {
      console.error('Failed to load payslip:', err);
      setPayslip(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const navigateMonth = (direction) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Payslip</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-gray-700 min-w-[140px] text-center">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : !payslip ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No payslip available for this month</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Employee Info */}
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Employee Name</p>
                  <p className="font-medium">{payslip.employee.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employee ID</p>
                  <p className="font-medium">{payslip.employee.loginId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium">{payslip.employee.department || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pay Period</p>
                  <p className="font-medium">{payslip.period.monthName} {payslip.period.year}</p>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Attendance</h3>
              <div className="grid grid-cols-4 gap-4 text-sm text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{payslip.attendance.totalWorkingDays}</p>
                  <p className="text-gray-500">Working Days</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{payslip.attendance.presentDays}</p>
                  <p className="text-gray-500">Present</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{payslip.attendance.leaveDays}</p>
                  <p className="text-gray-500">Leave</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{payslip.attendance.payableDays}</p>
                  <p className="text-gray-500">Payable</p>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-700 mb-3">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Allowance</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.standardAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Bonus</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.performanceBonus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LTA</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.lta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fixed Allowance</span>
                    <span className="font-medium">{formatCurrency(payslip.earnings.fixedAllowance)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2 font-bold">
                    <span>Gross Earnings</span>
                    <span>{formatCurrency(payslip.earnings.grossSalary)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-700 mb-3">Deductions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Provident Fund</span>
                    <span className="font-medium">{formatCurrency(payslip.deductions.pfDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax</span>
                    <span className="font-medium">{formatCurrency(payslip.deductions.professionalTax)}</span>
                  </div>
                  {payslip.deductions.lossOfPay > 0 && (
                    <div className="flex justify-between">
                      <span>Loss of Pay</span>
                      <span className="font-medium">{formatCurrency(payslip.deductions.lossOfPay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-red-200 pt-2 font-bold">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(payslip.deductions.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-primary-600 rounded-xl p-4 text-white text-center">
              <p className="text-sm opacity-80">Net Salary</p>
              <p className="text-3xl font-bold">{formatCurrency(payslip.netSalary)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Employee Payroll View (Non-Admin)
const EmployeePayrollView = () => {
  const { user } = useAuth();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadPayslip();
  }, [selectedMonth]);

  const loadPayslip = async () => {
    setLoading(true);
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const res = await payrollService.getMyPayslip(year, month);
      if (res.success) setPayslip(res.data);
    } catch (err) {
      console.error('Failed to load payslip:', err);
      setPayslip(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const navigateMonth = (direction) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Payslip</h1>
        <p className="text-gray-500">View your monthly payslip</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm w-fit">
        <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium text-gray-700 min-w-[140px] text-center">
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !payslip ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No payslip available for this month</p>
          <p className="text-sm text-gray-400 mt-1">
            Contact HR if you believe this is an error
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Payslip content similar to PayslipModal */}
          <div className="card bg-primary-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Employee Name</p>
                <p className="font-medium">{payslip.employee.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Employee ID</p>
                <p className="font-medium">{payslip.employee.loginId}</p>
              </div>
              <div>
                <p className="text-gray-500">Department</p>
                <p className="font-medium">{payslip.employee.department || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Pay Period</p>
                <p className="font-medium">{payslip.period.monthName} {payslip.period.year}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-sm text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{payslip.attendance.totalWorkingDays}</p>
                <p className="text-gray-500">Working Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{payslip.attendance.presentDays}</p>
                <p className="text-gray-500">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{payslip.attendance.leaveDays}</p>
                <p className="text-gray-500">Leave</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{payslip.attendance.payableDays}</p>
                <p className="text-gray-500">Payable</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-green-50">
              <h3 className="font-semibold text-green-700 mb-3">Earnings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Basic Salary</span><span className="font-medium">{formatCurrency(payslip.earnings.basicSalary)}</span></div>
                <div className="flex justify-between"><span>HRA</span><span className="font-medium">{formatCurrency(payslip.earnings.hra)}</span></div>
                <div className="flex justify-between"><span>Standard Allowance</span><span className="font-medium">{formatCurrency(payslip.earnings.standardAllowance)}</span></div>
                <div className="flex justify-between"><span>Performance Bonus</span><span className="font-medium">{formatCurrency(payslip.earnings.performanceBonus)}</span></div>
                <div className="flex justify-between"><span>LTA</span><span className="font-medium">{formatCurrency(payslip.earnings.lta)}</span></div>
                <div className="flex justify-between"><span>Fixed Allowance</span><span className="font-medium">{formatCurrency(payslip.earnings.fixedAllowance)}</span></div>
                <div className="flex justify-between border-t border-green-200 pt-2 font-bold">
                  <span>Gross Earnings</span>
                  <span>{formatCurrency(payslip.earnings.grossSalary)}</span>
                </div>
              </div>
            </div>

            <div className="card bg-red-50">
              <h3 className="font-semibold text-red-700 mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Provident Fund</span><span className="font-medium">{formatCurrency(payslip.deductions.pfDeduction)}</span></div>
                <div className="flex justify-between"><span>Professional Tax</span><span className="font-medium">{formatCurrency(payslip.deductions.professionalTax)}</span></div>
                {payslip.deductions.lossOfPay > 0 && (
                  <div className="flex justify-between"><span>Loss of Pay</span><span className="font-medium">{formatCurrency(payslip.deductions.lossOfPay)}</span></div>
                )}
                <div className="flex justify-between border-t border-red-200 pt-2 font-bold">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(payslip.deductions.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-primary-600 text-white text-center">
            <p className="text-sm opacity-80">Net Salary</p>
            <p className="text-3xl font-bold">{formatCurrency(payslip.netSalary)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
