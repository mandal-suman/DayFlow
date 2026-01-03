import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AttendanceWidget from '../components/AttendanceWidget';
import attendanceService from '../services/attendanceService';
import reportService from '../services/reportService';
import announcementService from '../services/announcementService';
import { Users, Clock, Calendar, DollarSign, TrendingUp, UserCheck, FileText, Briefcase, Megaphone, Plus, X, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [personalStats, setPersonalStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [isAdmin, user]);

  const loadDashboardData = async () => {
    try {
      // Load announcements for everyone
      try {
        const announcementsRes = await announcementService.getActive();
        if (announcementsRes.success && Array.isArray(announcementsRes.data)) {
          setAnnouncements(announcementsRes.data);
        }
      } catch (annErr) {
        console.error('Failed to load announcements:', annErr);
      }

      if (isAdmin) {
        // Load dashboard analytics for admins
        const analyticsRes = await reportService.getDashboardAnalytics();
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      } else if (user?.employeeId) {
        // Load personal attendance summary
        const now = new Date();
        const summaryRes = await attendanceService.getAttendanceSummary(
          user.employeeId, 
          now.getMonth() + 1,
          now.getFullYear()
        );
        
        if (summaryRes.success) {
          setPersonalStats(summaryRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementCreated = (newAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev].slice(0, 10));
    setShowAnnouncementModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const stats = isAdmin
    ? [
        { label: 'Active Employees', value: analytics?.employees?.active || '—', icon: Users, color: 'bg-blue-500' },
        { label: 'Present Today', value: analytics?.attendance?.presentToday || '—', icon: UserCheck, color: 'bg-green-500' },
        { label: 'On Leave Today', value: analytics?.attendance?.onLeaveToday || '—', icon: Calendar, color: 'bg-yellow-500' },
        { label: 'Pending Leaves', value: analytics?.leaves?.pendingRequests || '—', icon: Clock, color: 'bg-red-500' },
      ]
    : [
        { label: 'Days Present', value: personalStats?.presentDays || '—', icon: UserCheck, color: 'bg-green-500' },
        { label: 'Leaves Taken', value: personalStats?.leaveDays || '—', icon: Calendar, color: 'bg-yellow-500' },
        { label: 'Payable Days', value: personalStats?.payableDays || '—', icon: TrendingUp, color: 'bg-blue-500' },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100">
          {isAdmin
            ? 'Here\'s what\'s happening in your organization today.'
            : 'Here\'s your quick overview for today.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Widget */}
        <AttendanceWidget />

        {/* Admin Extra Stats / Employee Announcements */}
        {isAdmin && analytics ? (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Organization Overview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{analytics.employees.departments}</p>
                    <p className="text-sm text-purple-600">Departments</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{analytics.attendance.attendanceRate}%</p>
                    <p className="text-sm text-green-600">Attendance Rate</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(analytics.payroll.monthlyTotal)}</p>
                    <p className="text-sm text-blue-600">Monthly Payroll Budget</p>
                  </div>
                </div>
              </div>
            </div>
            {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600 mb-2">Top Departments</p>
                <div className="space-y-2">
                  {analytics.departmentBreakdown.slice(0, 3).map((dept, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{dept.name}</span>
                      <span className="text-sm font-medium text-gray-900">{dept.count} employees</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnnouncementsCard 
            announcements={announcements} 
            isAdmin={isAdmin}
            onPostNew={() => setShowAnnouncementModal(true)}
          />
        )}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <>
          <AnnouncementsCard 
            announcements={announcements} 
            isAdmin={isAdmin}
            onPostNew={() => setShowAnnouncementModal(true)}
          />
          <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={() => navigate('/create-user')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors"
            >
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Employee</span>
            </button>
            <button 
              onClick={() => navigate('/attendance')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors"
            >
              <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Attendance</span>
            </button>
            <button 
              onClick={() => navigate('/leaves')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors"
            >
              <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Leaves</span>
            </button>
            <button 
              onClick={() => navigate('/payroll')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors"
            >
              <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Payroll</span>
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors"
            >
              <FileText className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Reports</span>
            </button>
          </div>
        </div>
        </>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementModal
          onClose={() => setShowAnnouncementModal(false)}
          onCreated={handleAnnouncementCreated}
        />
      )}
    </div>
  );
};

// Announcements Card Component
const AnnouncementsCard = ({ announcements = [], isAdmin, onPostNew }) => {
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'important':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'important':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary-600" />
          Announcements
        </h2>
        {isAdmin && (
          <button
            onClick={onPostNew}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Post New
          </button>
        )}
      </div>
      
      {(!announcements || announcements.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No announcements yet</p>
          {isAdmin && (
            <button
              onClick={onPostNew}
              className="mt-2 text-sm text-primary-600 hover:underline"
            >
              Create the first announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-3 rounded-lg ${getPriorityStyles(announcement.priority)}`}
            >
              <div className="flex items-start gap-2">
                {getPriorityIcon(announcement.priority)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{announcement.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{formatDate(announcement.created_at)}</span>
                    {announcement.created_by_name && (
                      <>
                        <span>•</span>
                        <span>{announcement.created_by_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Announcement Modal Component
const AnnouncementModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await announcementService.create({
        title: title.trim(),
        content: content.trim(),
        priority,
        expiresAt: expiresAt || null
      });
      
      if (res.success) {
        toast.success('Announcement posted successfully');
        onCreated(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            Post Announcement
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Announcement title"
              required
            />
          </div>

          <div>
            <label className="input-label">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field"
              rows="4"
              placeholder="Write your announcement here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="input-label">Expires On (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
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
              {submitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
