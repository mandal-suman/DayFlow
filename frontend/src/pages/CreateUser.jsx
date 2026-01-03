import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import userService from '../services/userService';
import { 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateUser = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Employee',
    joiningDate: new Date().toISOString().split('T')[0],
    department: '',
    managerId: '',
    phone: '',
    workEmail: '',
  });
  
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadMetadata();
  }, [isAdmin, navigate]);

  const loadMetadata = async () => {
    try {
      const [deptRes, mgrRes] = await Promise.all([
        userService.getDepartments(),
        userService.getManagers(),
      ]);
      setDepartments(deptRes.data || []);
      setManagers(mgrRes.data || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
      };
      
      // Remove empty fields
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });

      const response = await authService.createUser(dataToSend);
      
      if (response.success) {
        setCreatedUser(response.data);
        toast.success('User created successfully!');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create user';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateAnother = () => {
    setCreatedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Employee',
      joiningDate: new Date().toISOString().split('T')[0],
      department: '',
      managerId: '',
      phone: '',
      workEmail: '',
    });
  };

  // Success screen after user creation
  if (createdUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">User Created Successfully!</h2>
            <p className="text-gray-500 mt-1">Share the credentials below with the new employee</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Employee Name</p>
                <p className="font-medium text-gray-800">
                  {createdUser.user.first_name} {createdUser.user.last_name}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Login ID</p>
                <p className="font-mono font-semibold text-lg text-primary-600">
                  {createdUser.user.login_id}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(createdUser.user.login_id, 'loginId')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copiedField === 'loginId' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Temporary Password</p>
                <p className="font-mono font-semibold text-lg text-amber-600">
                  {createdUser.temporaryPassword}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(createdUser.temporaryPassword, 'password')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copiedField === 'password' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                The user will be prompted to change their password on first login.
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleCreateAnother}
              className="flex-1 btn-primary"
            >
              Create Another User
            </button>
            <button
              onClick={() => navigate('/employees')}
              className="flex-1 btn-secondary"
            >
              View All Employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New User</h1>
          <p className="text-gray-500">Add a new employee to the system</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="input-label">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="input-label">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="input-label">
                  Personal Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="john.doe@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="workEmail" className="input-label">
                  Work Email
                </label>
                <input
                  type="email"
                  id="workEmail"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="input-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="input-label">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="joiningDate" className="input-label">
                  Joining Date *
                </label>
                <input
                  type="date"
                  id="joiningDate"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="department" className="input-label">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Engineering"
                  list="departments"
                />
                <datalist id="departments">
                  {departments.map((dept, index) => (
                    <option key={index} value={dept} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="managerId" className="input-label">
                  Reporting Manager
                </label>
                <select
                  id="managerId"
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Manager</option>
                  {managers.map((mgr) => (
                    <option key={mgr.employee_id} value={mgr.employee_id}>
                      {mgr.first_name} {mgr.last_name} {mgr.department ? `(${mgr.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A unique Login ID will be auto-generated based on the employee's name and joining year. 
              A temporary password will be created and must be changed on first login.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary py-3 px-8"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
