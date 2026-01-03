import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import reportService from '../services/reportService';
import { 
  FileText, 
  Calendar,
  DollarSign,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(false);
  
  // Attendance report state
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [attendanceStartDate, setAttendanceStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [attendanceEndDate, setAttendanceEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Payroll report state
  const [payrollReport, setPayrollReport] = useState(null);
  const [payrollMonth, setPayrollMonth] = useState(new Date());
  
  // Leave report state
  const [leaveReport, setLeaveReport] = useState(null);
  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear());

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadAttendanceReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getAttendanceReport(attendanceStartDate, attendanceEndDate);
      if (res.success) setAttendanceReport(res.data);
    } catch (err) {
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollReport = async () => {
    setLoading(true);
    try {
      const year = payrollMonth.getFullYear();
      const month = payrollMonth.getMonth() + 1;
      const res = await reportService.getPayrollReport(year, month);
      if (res.success) setPayrollReport(res.data);
    } catch (err) {
      toast.error('Failed to load payroll report');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getLeaveReport(leaveYear);
      if (res.success) setLeaveReport(res.data);
    } catch (err) {
      toast.error('Failed to load leave report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') loadAttendanceReport();
    else if (activeTab === 'payroll') loadPayrollReport();
    else if (activeTab === 'leave') loadLeaveReport();
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const navigatePayrollMonth = (direction) => {
    setPayrollMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-500">Generate and export HR reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'attendance', label: 'Attendance', icon: Clock },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'leave', label: 'Leave', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="input-label">Start Date</label>
                <input
                  type="date"
                  value={attendanceStartDate}
                  onChange={(e) => setAttendanceStartDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">End Date</label>
                <input
                  type="date"
                  value={attendanceEndDate}
                  onChange={(e) => setAttendanceEndDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                onClick={loadAttendanceReport}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {attendanceReport && (
                <button
                  onClick={() => exportToCSV(attendanceReport.employees.map(e => ({
                    'Employee ID': e.login_id,
                    'Name': e.name,
                    'Department': e.department || '-',
                    'Present Days': e.present_days,
                    'Absent Days': e.absent_days,
                    'Leave Days': e.leave_days,
                    'Attendance %': `${e.attendance_percentage}%`,
                    'Avg Hours': e.avg_hours || '-'
                  })), 'attendance_report')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {attendanceReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{attendanceReport.summary.totalEmployees}</p>
                      <p className="text-sm text-blue-600">Total Employees</p>
                    </div>
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-green-50 to-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg text-white">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700">{attendanceReport.period.workingDays}</p>
                      <p className="text-sm text-green-600">Working Days</p>
                    </div>
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg text-white">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{attendanceReport.summary.avgAttendance}</p>
                      <p className="text-sm text-purple-600">Avg Attendance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Details</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-500 border-b">
                        <th className="pb-3 pr-4">Employee</th>
                        <th className="pb-3 pr-4">Department</th>
                        <th className="pb-3 pr-4 text-center">Present</th>
                        <th className="pb-3 pr-4 text-center">Absent</th>
                        <th className="pb-3 pr-4 text-center">Leave</th>
                        <th className="pb-3 pr-4 text-center">Avg Hours</th>
                        <th className="pb-3 text-center">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendanceReport.employees.map((emp) => (
                        <tr key={emp.employee_id} className="text-sm">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-800">{emp.name}</p>
                            <p className="text-gray-500 text-xs">{emp.login_id}</p>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{emp.department || '-'}</td>
                          <td className="py-3 pr-4 text-center text-green-600 font-medium">{emp.present_days}</td>
                          <td className="py-3 pr-4 text-center text-red-600 font-medium">{emp.absent_days}</td>
                          <td className="py-3 pr-4 text-center text-blue-600 font-medium">{emp.leave_days}</td>
                          <td className="py-3 pr-4 text-center text-gray-600">{emp.avg_hours || '-'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              emp.attendance_percentage >= 90 ? 'bg-green-100 text-green-700' :
                              emp.attendance_percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {emp.attendance_percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payroll Report */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Month Selector */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <button onClick={() => navigatePayrollMonth(-1)} className="p-1 hover:bg-gray-200 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-gray-700 min-w-[140px] text-center">
                  {payrollMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => navigatePayrollMonth(1)} className="p-1 hover:bg-gray-200 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={loadPayrollReport}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {payrollReport && (
                <button
                  onClick={() => exportToCSV(payrollReport.employees.map(e => ({
                    'Employee ID': e.loginId,
                    'Name': e.name,
                    'Department': e.department || '-',
                    'Month Wage': e.monthWage,
                    'Working Days': e.totalWorkingDays,
                    'Payable Days': e.payableDays,
                    'Gross Salary': e.grossSalary,
                    'PF Deduction': e.deductions.pf,
                    'Prof Tax': e.deductions.profTax,
                    'Net Salary': e.netSalary
                  })), 'payroll_report')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {payrollReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                  <p className="text-2xl font-bold text-blue-700">{payrollReport.summary.totalEmployees}</p>
                  <p className="text-sm text-blue-600">Employees</p>
                </div>
                <div className="card bg-gradient-to-br from-green-50 to-green-100">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(payrollReport.summary.totalGross)}</p>
                  <p className="text-sm text-green-600">Total Gross</p>
                </div>
                <div className="card bg-gradient-to-br from-red-50 to-red-100">
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(payrollReport.summary.totalDeductions)}</p>
                  <p className="text-sm text-red-600">Total Deductions</p>
                </div>
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(payrollReport.summary.totalNet)}</p>
                  <p className="text-sm text-purple-600">Net Payable</p>
                </div>
              </div>

              {/* Table */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Payroll Details - {payrollReport.period.monthName} {payrollReport.period.year}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-500 border-b">
                        <th className="pb-3 pr-4">Employee</th>
                        <th className="pb-3 pr-4">Department</th>
                        <th className="pb-3 pr-4 text-right">CTC</th>
                        <th className="pb-3 pr-4 text-center">Days</th>
                        <th className="pb-3 pr-4 text-right">Gross</th>
                        <th className="pb-3 pr-4 text-right">Deductions</th>
                        <th className="pb-3 text-right">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payrollReport.employees.map((emp) => (
                        <tr key={emp.employeeId} className="text-sm">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-800">{emp.name}</p>
                            <p className="text-gray-500 text-xs">{emp.loginId}</p>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{emp.department || '-'}</td>
                          <td className="py-3 pr-4 text-right text-gray-600">{formatCurrency(emp.monthWage)}</td>
                          <td className="py-3 pr-4 text-center text-gray-600">
                            {emp.payableDays}/{emp.totalWorkingDays}
                          </td>
                          <td className="py-3 pr-4 text-right text-green-600 font-medium">
                            {formatCurrency(emp.grossSalary)}
                          </td>
                          <td className="py-3 pr-4 text-right text-red-600">
                            {formatCurrency(emp.deductions.pf + emp.deductions.profTax)}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-800">
                            {formatCurrency(emp.netSalary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300">
                      <tr className="font-bold text-sm">
                        <td className="py-3 pr-4" colSpan="4">Total</td>
                        <td className="py-3 pr-4 text-right text-green-600">
                          {formatCurrency(payrollReport.summary.totalGross)}
                        </td>
                        <td className="py-3 pr-4 text-right text-red-600">
                          {formatCurrency(payrollReport.summary.totalDeductions)}
                        </td>
                        <td className="py-3 text-right text-primary-600">
                          {formatCurrency(payrollReport.summary.totalNet)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Leave Report */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          {/* Year Selector */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="input-label">Year</label>
                <select
                  value={leaveYear}
                  onChange={(e) => setLeaveYear(parseInt(e.target.value))}
                  className="input-field"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={loadLeaveReport}
                className="btn-primary mt-5"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {leaveReport && (
                <button
                  onClick={() => exportToCSV(leaveReport.employees.map(e => ({
                    'Employee ID': e.loginId,
                    'Name': e.name,
                    'Department': e.department || '-',
                    'Paid Leave Used': e.paidLeave.used,
                    'Paid Leave Balance': e.paidLeave.balance,
                    'Sick Leave Used': e.sickLeave.used,
                    'Sick Leave Balance': e.sickLeave.balance,
                    'Unpaid Leave': e.unpaidUsed
                  })), 'leave_report')}
                  className="btn-secondary flex items-center gap-2 mt-5"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {leaveReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                  <p className="text-2xl font-bold text-blue-700">{leaveReport.summary.totalEmployees}</p>
                  <p className="text-sm text-blue-600">Total Employees</p>
                </div>
                <div className="card bg-gradient-to-br from-green-50 to-green-100">
                  <p className="text-2xl font-bold text-green-700">{leaveReport.summary.totalPaidUsed}</p>
                  <p className="text-sm text-green-600">Total Paid Leave Used</p>
                </div>
                <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <p className="text-2xl font-bold text-yellow-700">{leaveReport.summary.totalSickUsed}</p>
                  <p className="text-sm text-yellow-600">Total Sick Leave Used</p>
                </div>
              </div>

              {/* Table */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Balance Report - {leaveReport.year}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-500 border-b">
                        <th className="pb-3 pr-4">Employee</th>
                        <th className="pb-3 pr-4">Department</th>
                        <th className="pb-3 pr-4 text-center" colSpan="2">Paid Leave</th>
                        <th className="pb-3 pr-4 text-center" colSpan="2">Sick Leave</th>
                        <th className="pb-3 text-center">Unpaid</th>
                      </tr>
                      <tr className="text-xs text-gray-400 border-b">
                        <th className="pb-2"></th>
                        <th className="pb-2"></th>
                        <th className="pb-2 text-center">Used</th>
                        <th className="pb-2 text-center">Balance</th>
                        <th className="pb-2 text-center">Used</th>
                        <th className="pb-2 text-center">Balance</th>
                        <th className="pb-2 text-center">Used</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leaveReport.employees.map((emp) => (
                        <tr key={emp.employeeId} className="text-sm">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-800">{emp.name}</p>
                            <p className="text-gray-500 text-xs">{emp.loginId}</p>
                          </td>
                          <td className="py-3 pr-4 text-gray-600">{emp.department || '-'}</td>
                          <td className="py-3 pr-4 text-center text-blue-600">{emp.paidLeave.used}</td>
                          <td className="py-3 pr-4 text-center font-medium text-green-600">{emp.paidLeave.balance}</td>
                          <td className="py-3 pr-4 text-center text-yellow-600">{emp.sickLeave.used}</td>
                          <td className="py-3 pr-4 text-center font-medium text-green-600">{emp.sickLeave.balance}</td>
                          <td className="py-3 text-center text-red-600">{emp.unpaidUsed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
