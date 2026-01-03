import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Eye,
  UserX,
  UserCheck,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Employees = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    department: '',
    isActive: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadDepartments();
  }, [isAdmin, navigate]);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, filters]);

  const loadDepartments = async () => {
    try {
      const response = await userService.getDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      };
      
      const response = await userService.getAllUsers(params);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      }
    } catch (err) {
      toast.error('Failed to load employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await userService.deactivateUser(userId);
        toast.success('User deactivated');
      } else {
        await userService.activateUser(userId);
        toast.success('User activated');
      }
      loadUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
    setActiveDropdown(null);
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await authService.resetPassword(userId);
      toast.success(`Password reset! New password: ${response.data.temporaryPassword}`);
    } catch (err) {
      toast.error('Failed to reset password');
    }
    setActiveDropdown(null);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge-success">Active</span>
    ) : (
      <span className="badge-danger">Inactive</span>
    );
  };

  const getRoleBadge = (role) => {
    return role === 'Admin' ? (
      <span className="badge-info">Admin</span>
    ) : (
      <span className="badge bg-gray-100 text-gray-800">Employee</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage all employees in your organization</p>
        </div>
        <button
          onClick={() => navigate('/create-user')}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or login ID..."
              value={filters.search}
              onChange={handleSearch}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-200' : ''}`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="input-label">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="input-field"
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="input-label">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="input-field"
              >
                <option value="">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Employee</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Login ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No employees found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {user.login_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.department || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.joining_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === user.employee_id ? null : user.employee_id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {activeDropdown === user.employee_id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                              <button
                                onClick={() => {
                                  navigate(`/employees/${user.employee_id}`);
                                  setActiveDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4" />
                                View Profile
                              </button>
                              <button
                                onClick={() => handleResetPassword(user.employee_id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                <KeyRound className="w-4 h-4" />
                                Reset Password
                              </button>
                              <hr />
                              <button
                                onClick={() => handleToggleStatus(user.employee_id, user.is_active)}
                                className={`w-full flex items-center gap-2 px-4 py-2 ${
                                  user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <UserX className="w-4 h-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} employees
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
