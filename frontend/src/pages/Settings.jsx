import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Building2,
  Calendar,
  DollarSign,
  Bell,
  Shield,
  Save,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  // Settings state (would be loaded from backend in production)
  const [settings, setSettings] = useState({
    company: {
      name: 'Dayflow HRMS',
      address: '123 Business Park, Tech City',
      phone: '+91 9876543210',
      email: 'hr@dayflow.com'
    },
    leave: {
      paidLeavePerYear: 12,
      sickLeavePerYear: 6,
      carryForwardLimit: 5
    },
    payroll: {
      payDay: 28,
      pfPercentage: 12,
      professionalTax: 200,
      standardAllowance: 4167
    },
    attendance: {
      workStartTime: '09:00',
      workEndTime: '18:00',
      graceMinutes: 15,
      halfDayHours: 4
    }
  });

  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSave = async () => {
    setSaving(true);
    // In production, this would save to backend
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Settings saved successfully');
    setSaving(false);
  };

  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'leave', label: 'Leave Policy', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'attendance', label: 'Attendance', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500">Configure system settings and policies</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <div className="card p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Company Information</h2>
                  <p className="text-sm text-gray-500">Basic company details</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="input-label">Company Name</label>
                  <input
                    type="text"
                    value={settings.company.name}
                    onChange={(e) => updateSetting('company', 'name', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Address</label>
                  <textarea
                    value={settings.company.address}
                    onChange={(e) => updateSetting('company', 'address', e.target.value)}
                    className="input-field"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input
                    type="text"
                    value={settings.company.phone}
                    onChange={(e) => updateSetting('company', 'phone', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">HR Email</label>
                  <input
                    type="email"
                    value={settings.company.email}
                    onChange={(e) => updateSetting('company', 'email', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Leave Policy Settings */}
          {activeTab === 'leave' && (
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Leave Policy</h2>
                  <p className="text-sm text-gray-500">Configure leave allowances</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Paid Leave Per Year</label>
                  <input
                    type="number"
                    value={settings.leave.paidLeavePerYear}
                    onChange={(e) => updateSetting('leave', 'paidLeavePerYear', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Annual paid leave allocation</p>
                </div>
                <div>
                  <label className="input-label">Sick Leave Per Year</label>
                  <input
                    type="number"
                    value={settings.leave.sickLeavePerYear}
                    onChange={(e) => updateSetting('leave', 'sickLeavePerYear', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Annual sick leave allocation</p>
                </div>
                <div>
                  <label className="input-label">Carry Forward Limit</label>
                  <input
                    type="number"
                    value={settings.leave.carryForwardLimit}
                    onChange={(e) => updateSetting('leave', 'carryForwardLimit', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max leaves carried to next year</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Leave Types</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• <strong>Paid Leave:</strong> Fully paid time off</li>
                    <li>• <strong>Sick Leave:</strong> Medical leave with pay</li>
                    <li>• <strong>Unpaid Leave:</strong> No limit, deducted from salary</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === 'payroll' && (
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Payroll Configuration</h2>
                  <p className="text-sm text-gray-500">Salary calculation parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Pay Day</label>
                  <input
                    type="number"
                    value={settings.payroll.payDay}
                    onChange={(e) => updateSetting('payroll', 'payDay', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="31"
                  />
                  <p className="text-xs text-gray-500 mt-1">Day of month for salary credit</p>
                </div>
                <div>
                  <label className="input-label">PF Percentage (%)</label>
                  <input
                    type="number"
                    value={settings.payroll.pfPercentage}
                    onChange={(e) => updateSetting('payroll', 'pfPercentage', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    max="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provident fund deduction rate</p>
                </div>
                <div>
                  <label className="input-label">Professional Tax (₹)</label>
                  <input
                    type="number"
                    value={settings.payroll.professionalTax}
                    onChange={(e) => updateSetting('payroll', 'professionalTax', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed monthly deduction</p>
                </div>
                <div>
                  <label className="input-label">Standard Allowance (₹)</label>
                  <input
                    type="number"
                    value={settings.payroll.standardAllowance}
                    onChange={(e) => updateSetting('payroll', 'standardAllowance', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed monthly allowance</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Salary Structure Formula</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>Basic Salary = 50% of CTC</div>
                  <div>HRA = 50% of Basic</div>
                  <div>Performance Bonus = 8.33% of Basic</div>
                  <div>LTA = 8.33% of Basic</div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Attendance Rules</h2>
                  <p className="text-sm text-gray-500">Working hours and policies</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Work Start Time</label>
                  <input
                    type="time"
                    value={settings.attendance.workStartTime}
                    onChange={(e) => updateSetting('attendance', 'workStartTime', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Work End Time</label>
                  <input
                    type="time"
                    value={settings.attendance.workEndTime}
                    onChange={(e) => updateSetting('attendance', 'workEndTime', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Grace Period (minutes)</label>
                  <input
                    type="number"
                    value={settings.attendance.graceMinutes}
                    onChange={(e) => updateSetting('attendance', 'graceMinutes', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">Late arrival grace period</p>
                </div>
                <div>
                  <label className="input-label">Half Day Hours</label>
                  <input
                    type="number"
                    value={settings.attendance.halfDayHours}
                    onChange={(e) => updateSetting('attendance', 'halfDayHours', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="8"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum hours for half day</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-sm text-purple-700">
                  <p className="font-medium">Attendance Status</p>
                  <ul className="mt-1 space-y-1 text-purple-600">
                    <li>• <strong>Present:</strong> Checked in for the day</li>
                    <li>• <strong>Absent:</strong> No check-in recorded</li>
                    <li>• <strong>On Leave:</strong> Approved leave for the day</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
