import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  MapPin,
  CreditCard,
  Globe,
  User,
  Briefcase,
  Shield,
  Edit,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('public');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const isSelf = currentUser?.employeeId === parseInt(userId);
  const canEdit = isAdmin || isSelf;
  const canViewPrivate = isAdmin || isSelf;
  const canViewSalary = isAdmin;

  useEffect(() => {
    loadEmployee();
  }, [userId]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const response = await userService.getUserProfile(userId);
      if (response.success) {
        setEmployee(response.data);
        setEditData(response.data);
      }
    } catch (err) {
      toast.error('Failed to load employee profile');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send editable fields based on role
      const allowedFields = isSelf && !isAdmin 
        ? ['phone', 'homeAddress', 'emergencyContact', 'emergencyPhone']
        : Object.keys(editData);
      
      const dataToSend = {};
      allowedFields.forEach(field => {
        const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (editData[snakeCase] !== undefined) {
          dataToSend[field] = editData[snakeCase];
        }
      });

      await userService.updateProfile(userId, dataToSend);
      toast.success('Profile updated successfully');
      setEditing(false);
      loadEmployee();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditData(employee);
    setEditing(false);
  };

  const tabs = [
    { id: 'public', label: 'Public Info', icon: User },
    { id: 'private', label: 'Private Info', icon: Shield, hidden: !canViewPrivate },
    { id: 'salary', label: 'Salary Info', icon: CreditCard, hidden: !canViewSalary },
  ].filter(tab => !tab.hidden);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Employee Profile</h1>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-800">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-500">{employee.department || 'No Department'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {employee.login_id}
              </code>
              <span className={`badge ${employee.role === 'Admin' ? 'badge-info' : 'bg-gray-100 text-gray-800'}`}>
                {employee.role}
              </span>
              <span className={`badge ${employee.is_active ? 'badge-success' : 'badge-danger'}`}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'public' && (
            <PublicInfo 
              employee={employee} 
              editing={editing && isAdmin}
              editData={editData}
              onChange={handleEditChange}
            />
          )}
          {activeTab === 'private' && canViewPrivate && (
            <PrivateInfo 
              employee={employee} 
              editing={editing}
              editData={editData}
              onChange={handleEditChange}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'salary' && canViewSalary && (
            <SalaryInfo employee={employee} />
          )}
        </div>
      </div>
    </div>
  );
};

// Public Info Tab
const PublicInfo = ({ employee, editing, editData, onChange }) => {
  const fields = [
    { icon: Mail, label: 'Work Email', value: employee.work_email, field: 'work_email', editable: true },
    { icon: Building, label: 'Department', value: employee.department, field: 'department', editable: true },
    { icon: User, label: 'Manager', value: employee.manager_name, field: null },
    { icon: Calendar, label: 'Joining Date', value: employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '—', field: null },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <field.icon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{field.label}</p>
            {editing && field.editable ? (
              <input
                type="text"
                name={field.field}
                value={editData[field.field] || ''}
                onChange={onChange}
                className="input-field mt-1"
              />
            ) : (
              <p className="font-medium text-gray-800">{field.value || '—'}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Private Info Tab
const PrivateInfo = ({ employee, editing, editData, onChange, isAdmin }) => {
  const fields = [
    { icon: Mail, label: 'Personal Email', value: employee.email, field: 'email', adminOnly: true },
    { icon: Phone, label: 'Phone', value: employee.phone, field: 'phone', editable: true },
    { icon: MapPin, label: 'Home Address', value: employee.home_address, field: 'home_address', editable: true },
    { icon: Globe, label: 'Nationality', value: employee.nationality, field: 'nationality', adminOnly: true },
    { icon: CreditCard, label: 'Bank Account', value: employee.bank_account_number ? `****${employee.bank_account_number.slice(-4)}` : null, field: 'bank_account_number', adminOnly: true },
    { icon: Building, label: 'Bank Name', value: employee.bank_name, field: 'bank_name', adminOnly: true },
    { icon: User, label: 'Emergency Contact', value: employee.emergency_contact, field: 'emergency_contact', editable: true },
    { icon: Phone, label: 'Emergency Phone', value: employee.emergency_phone, field: 'emergency_phone', editable: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, index) => {
        const canEditField = editing && (field.editable || (isAdmin && field.adminOnly));
        
        return (
          <div key={index} className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <field.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{field.label}</p>
              {canEditField ? (
                <input
                  type="text"
                  name={field.field}
                  value={editData[field.field] || ''}
                  onChange={onChange}
                  className="input-field mt-1"
                />
              ) : (
                <p className="font-medium text-gray-800">{field.value || '—'}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Salary Info Tab (Admin only)
const SalaryInfo = ({ employee }) => {
  return (
    <div className="text-center py-12">
      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">Salary Information</h3>
      <p className="text-gray-500 mb-4">No salary structure configured for this employee.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-amber-800 flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4" />
          Salary management will be available in Phase 5
        </p>
      </div>
    </div>
  );
};

export default EmployeeProfile;
