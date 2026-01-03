import { useState, useEffect } from 'react';
import attendanceService from '../services/attendanceService';
import { Clock, LogIn, LogOut, Plane, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceWidget = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await attendanceService.getTodayStatus();
      if (response.success) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to load attendance status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (action) => {
    setMarking(true);
    try {
      const response = await attendanceService.markAttendance(action);
      if (response.success) {
        toast.success(response.message);
        loadStatus();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to mark attendance';
      toast.error(message);
    } finally {
      setMarking(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusDisplay = () => {
    if (!status) return null;

    switch (status.status) {
      case 'Present':
        return {
          icon: <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />,
          text: 'Present',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'OnLeave':
        return {
          icon: <Plane className="w-4 h-4 text-blue-500" />,
          text: `On ${status.leaveType || ''} Leave`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      default:
        return {
          icon: <span className="w-3 h-3 bg-yellow-500 rounded-full" />,
          text: 'Not Checked In',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();
  const isCheckedIn = status?.checkInTime && !status?.checkOutTime;
  const isCompleted = status?.checkInTime && status?.checkOutTime;
  const isOnLeave = status?.status === 'OnLeave';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Today's Attendance
        </h2>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Status Display */}
      <div className={`${statusDisplay.bgColor} rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <p className={`font-medium ${statusDisplay.color}`}>
                {statusDisplay.text}
              </p>
              {status?.checkInTime && (
                <p className="text-sm text-gray-500">
                  In: {formatTime(status.checkInTime)}
                  {status.checkOutTime && ` • Out: ${formatTime(status.checkOutTime)}`}
                </p>
              )}
            </div>
          </div>
          {status?.totalHours && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">{status.totalHours}</p>
              <p className="text-xs text-gray-500">hours</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isOnLeave ? (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">You're on approved leave today</span>
        </div>
      ) : isCompleted ? (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Attendance completed for today</span>
        </div>
      ) : (
        <div className="flex gap-3">
          {!isCheckedIn ? (
            <button
              onClick={() => handleMark('checkIn')}
              disabled={marking}
              className="flex-1 btn-success py-3 flex items-center justify-center gap-2"
            >
              {marking ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              Check In
            </button>
          ) : (
            <button
              onClick={() => handleMark('checkOut')}
              disabled={marking}
              className="flex-1 btn-danger py-3 flex items-center justify-center gap-2"
            >
              {marking ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              Check Out
            </button>
          )}
        </div>
      )}

      {/* Working Hours Info */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Standard working hours: 9:00 AM - 6:00 PM
      </p>
    </div>
  );
};

export default AttendanceWidget;
