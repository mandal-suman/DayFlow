import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import attendanceService from '../services/attendanceService';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Plane,
  Check,
  X,
  Filter,
  Download,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [teamOverview, setTeamOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('list'); // 'list' or 'calendar'

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // Load own history and summary
      const [historyRes, summaryRes] = await Promise.all([
        attendanceService.getAttendanceHistory({ year, month }),
        attendanceService.getAttendanceSummary(user.id, year, month),
      ]);

      if (historyRes.success) {
        setAttendanceHistory(historyRes.data);
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }

      // Load team overview for admins
      if (isAdmin) {
        const overviewRes = await attendanceService.getTeamOverview();
        if (overviewRes.success) {
          setTeamOverview(overviewRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Present
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            Absent
          </span>
        );
      case 'OnLeave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Plane className="w-3 h-3" />
            On Leave
          </span>
        );
      case 'Half Day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            Half Day
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceHistory.find(a => a.date?.split('T')[0] === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

      let bgColor = 'bg-gray-50';
      let textColor = 'text-gray-600';
      let icon = null;

      if (attendance) {
        switch (attendance.status) {
          case 'Present':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            icon = <Check className="w-3 h-3" />;
            break;
          case 'Absent':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            icon = <X className="w-3 h-3" />;
            break;
          case 'OnLeave':
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
            icon = <Plane className="w-3 h-3" />;
            break;
        }
      } else if (isWeekend) {
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-400';
      }

      days.push(
        <div
          key={day}
          className={`p-2 min-h-[60px] ${bgColor} ${textColor} rounded-lg transition-all hover:ring-2 hover:ring-primary-300 ${
            isToday ? 'ring-2 ring-primary-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isToday ? 'bg-primary-600 text-white px-1.5 py-0.5 rounded' : ''}`}>
              {day}
            </span>
            {icon}
          </div>
          {attendance?.totalHours && (
            <p className="text-xs mt-1 opacity-75">{attendance.totalHours}h</p>
          )}
        </div>
      );
    }

    return (
      <div className="card">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(name => (
            <div key={name} className="text-center text-xs font-medium text-gray-500 py-2">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500">Track your attendance and work hours</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-700 min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm font-medium ${
                view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 text-sm font-medium ${
                view === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl text-white">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{summary?.presentDays || 0}</p>
              <p className="text-sm text-green-600">Present Days</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-xl text-white">
              <X className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{summary?.absentDays || 0}</p>
              <p className="text-sm text-yellow-600">Absent Days</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl text-white">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{summary?.leaveDays || 0}</p>
              <p className="text-sm text-blue-600">Leave Days</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500 rounded-xl text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">{summary?.payableDays || 0}</p>
              <p className="text-sm text-primary-600">Payable Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Overview for Admins */}
      {isAdmin && teamOverview && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Today's Team Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{teamOverview.totalEmployees}</p>
              <p className="text-sm text-gray-500">Total Employees</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{teamOverview.present}</p>
              <p className="text-sm text-green-500">Present</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{teamOverview.absent}</p>
              <p className="text-sm text-yellow-500">Absent</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{teamOverview.onLeave}</p>
              <p className="text-sm text-blue-500">On Leave</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance View */}
      {view === 'calendar' ? (
        renderCalendarView()
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Attendance History
            </h2>
            <p className="text-sm text-gray-500">
              Total Hours: <span className="font-semibold">{summary?.totalHours || 0}h</span>
            </p>
          </div>

          {attendanceHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attendance records for this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500 border-b">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Check In</th>
                    <th className="pb-3 pr-4">Check Out</th>
                    <th className="pb-3 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendanceHistory.map((record) => (
                    <tr key={record.id} className="text-sm">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-700">
                          {formatDate(record.date)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatTime(record.checkInTime)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-700">
                        {record.totalHours ? `${record.totalHours}h` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
