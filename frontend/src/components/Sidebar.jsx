import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Settings,
  UserPlus,
  FileText,
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users, adminOnly: true },
    { path: '/attendance', label: 'Attendance', icon: Clock },
    { path: '/leaves', label: 'Leaves', icon: Calendar },
    { path: '/payroll', label: 'Payroll', icon: DollarSign },
    { path: '/reports', label: 'Reports', icon: FileText, adminOnly: true },
  ];

  const adminItems = [
    { path: '/create-user', label: 'Create User', icon: UserPlus },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600">Dayflow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => (
            <NavItem key={item.path} item={item} />
          ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminItems.map(item => (
              <NavItem key={item.path} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Dayflow HRMS v0.6.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
