import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Check,
  X,
  AlertCircle,
  Plane,
  Filter,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const Leaves = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [teamSummary, setTeamSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [activeTab, setActiveTab] = useState('my-leaves');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarLeaves, setCalendarLeaves] = useState([]);

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendar();
    }
  }, [activeTab, currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceRes, leavesRes] = await Promise.all([
        leaveService.getBalance(),
        leaveService.getMyLeaves(),
      ]);

      if (balanceRes.success) setBalance(balanceRes.data);
      if (leavesRes.success) setMyLeaves(leavesRes.data);

      if (isAdmin) {
        const [pendingRes, summaryRes] = await Promise.all([
          leaveService.getPendingRequests(),
          leaveService.getTeamSummary(),
        ]);
        if (pendingRes.success) setPendingRequests(pendingRes.data);
        if (summaryRes.success) setTeamSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await leaveService.getLeaveCalendar(year, month);
      if (res.success) setCalendarLeaves(res.data);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      const res = await leaveService.approveLeave(leaveId);
      if (res.success) {
        toast.success('Leave approved successfully');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (leaveId, reason) => {
    try {
      const res = await leaveService.rejectLeave(leaveId, reason);
      if (res.success) {
        toast.success('Leave rejected');
        setShowRejectModal(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject leave');
    }
  };

  const handleCancel = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      const res = await leaveService.cancelLeave(leaveId);
      if (res.success) {
        toast.success('Leave request cancelled');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge-success">Approved</span>;
      case 'Pending':
        return <span className="badge-warning">Pending</span>;
      case 'Rejected':
        return <span className="badge-danger">Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case 'Paid':
        return <span className="badge-info">Paid Leave</span>;
      case 'Sick':
        return <span className="badge-warning">Sick Leave</span>;
      case 'Unpaid':
        return <span className="badge-danger">Unpaid Leave</span>;
      default:
        return <span className="badge">{type}</span>;
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">Request and manage your time off</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl text-white">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {balance?.paidLeaveRemaining || 0}
              </p>
              <p className="text-sm text-blue-600">Paid Leave</p>
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-2">
            {balance?.paidLeaveUsed || 0} / {balance?.paidLeaveTotal || 12} used
          </p>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-xl text-white">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {balance?.sickLeaveRemaining || 0}
              </p>
              <p className="text-sm text-yellow-600">Sick Leave</p>
            </div>
          </div>
          <p className="text-xs text-yellow-500 mt-2">
            {balance?.sickLeaveUsed || 0} / {balance?.sickLeaveTotal || 6} used
          </p>
        </div>

        {isAdmin && teamSummary && (
          <>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-xl text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {teamSummary.pendingRequests}
                  </p>
                  <p className="text-sm text-purple-600">Pending</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {teamSummary.onLeaveToday}
                  </p>
                  <p className="text-sm text-green-600">On Leave Today</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my-leaves')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'my-leaves'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Leaves
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Approvals
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'calendar'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Calendar
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-leaves' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Leave Requests</h2>
          {myLeaves.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No leave requests yet</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-3 text-primary-600 hover:underline"
              >
                Request your first leave
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500 border-b">
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Dates</th>
                    <th className="pb-3 pr-4">Days</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Reason</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myLeaves.map((leave) => (
                    <tr key={leave.id} className="text-sm">
                      <td className="py-3 pr-4">{getLeaveTypeBadge(leave.leaveType)}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {formatDate(leave.startDate)}
                        {leave.startDate !== leave.endDate && (
                          <> - {formatDate(leave.endDate)}</>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{leave.days}</td>
                      <td className="py-3 pr-4">{getStatusBadge(leave.status)}</td>
                      <td className="py-3 pr-4 text-gray-500 max-w-xs truncate">
                        {leave.reason || '-'}
                        {leave.rejectionReason && (
                          <p className="text-red-500 text-xs mt-1">
                            Rejected: {leave.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        {leave.status === 'Pending' && (
                          <button
                            onClick={() => handleCancel(leave.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && isAdmin && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Approvals</h2>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending leave requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-xl p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {request.employee.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{request.employee.name}</p>
                        <p className="text-sm text-gray-500">
                          {request.employee.department} • {request.employee.loginId}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="btn bg-green-600 text-white hover:bg-green-700 py-1.5 px-3 text-sm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowRejectModal(request)}
                        className="btn bg-red-600 text-white hover:bg-red-700 py-1.5 px-3 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pl-13 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">{request.leaveType} Leave</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dates</p>
                      <p className="font-medium">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">{request.days} day(s)</p>
                    </div>
                  </div>
                  {request.reason && (
                    <div className="mt-2 pl-13">
                      <p className="text-sm text-gray-500">Reason: {request.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Leave Calendar</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium min-w-[140px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <CalendarView 
            month={currentMonth} 
            leaves={calendarLeaves} 
          />
        </div>
      )}

      {/* Request Leave Modal */}
      {showRequestModal && (
        <LeaveRequestModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            loadData();
          }}
          balance={balance}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          request={showRejectModal}
          onClose={() => setShowRejectModal(null)}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

// Calendar View Component
const CalendarView = ({ month, leaves }) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  // Add empty cells
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 min-h-[80px]"></div>);
  }

  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = new Date().toDateString() === new Date(year, monthIndex, day).toDateString();
    const isWeekend = new Date(year, monthIndex, day).getDay() === 0 || new Date(year, monthIndex, day).getDay() === 6;

    // Find leaves for this day
    const dayLeaves = leaves.filter(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(year, monthIndex, day);
      return current >= start && current <= end;
    });

    days.push(
      <div
        key={day}
        className={`p-2 min-h-[80px] border border-gray-100 ${
          isWeekend ? 'bg-gray-50' : 'bg-white'
        } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
      >
        <span className={`text-sm font-medium ${isToday ? 'bg-primary-600 text-white px-1.5 py-0.5 rounded' : 'text-gray-700'}`}>
          {day}
        </span>
        <div className="mt-1 space-y-1">
          {dayLeaves.slice(0, 2).map((leave, idx) => (
            <div
              key={idx}
              className={`text-xs px-1.5 py-0.5 rounded truncate ${
                leave.leaveType === 'Paid' ? 'bg-blue-100 text-blue-700' :
                leave.leaveType === 'Sick' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}
              title={`${leave.employeeName} - ${leave.leaveType}`}
            >
              {leave.employeeName.split(' ')[0]}
            </div>
          ))}
          {dayLeaves.length > 2 && (
            <div className="text-xs text-gray-500">+{dayLeaves.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {dayNames.map(name => (
          <div key={name} className="text-center text-xs font-medium text-gray-500 py-2">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {days}
      </div>
    </div>
  );
};

// Leave Request Modal
const LeaveRequestModal = ({ onClose, onSuccess, balance }) => {
  const [form, setForm] = useState({
    leaveType: 'Paid',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await leaveService.requestLeave(form);
      if (res.success) {
        toast.success('Leave request submitted');
        onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Request Leave</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="input-field"
              required
            >
              <option value="Paid">Paid Leave ({balance?.paidLeaveRemaining || 0} remaining)</option>
              <option value="Sick">Sick Leave ({balance?.sickLeaveRemaining || 0} remaining)</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="input-label">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field"
                min={form.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <p className="text-primary-700">
                Duration: <span className="font-bold">{calculateDays()} day(s)</span>
              </p>
            </div>
          )}

          <div>
            <label className="input-label">Reason (Optional)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Brief reason for leave..."
            />
          </div>

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
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reject Modal
const RejectModal = ({ request, onClose, onReject }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setSubmitting(true);
    await onReject(request.id, reason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Reject Leave Request</h2>
        <p className="text-gray-500 mb-4">
          Rejecting leave request from {request.employee.name}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Reason for Rejection</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Please provide a reason..."
              required
            />
          </div>

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
              className="btn-danger flex-1"
              disabled={submitting}
            >
              {submitting ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Leaves;
