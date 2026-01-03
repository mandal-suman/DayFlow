import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('dayflow_token');
    const savedUser = localStorage.getItem('dayflow_user');

    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setRequirePasswordChange(parsedUser.isFirstLogin || false);
    }
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    const response = await authService.login(loginId, password);
    
    if (response.success) {
      const { token, user: userData } = response.data;
      
      localStorage.setItem('dayflow_token', token);
      localStorage.setItem('dayflow_user', JSON.stringify(userData));
      
      setUser(userData);
      setRequirePasswordChange(userData.isFirstLogin);
      
      return { success: true, requirePasswordChange: userData.isFirstLogin };
    }
    
    throw new Error(response.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setUser(null);
    setRequirePasswordChange(false);
  };

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    localStorage.setItem('dayflow_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const completePasswordChange = () => {
    setRequirePasswordChange(false);
    if (user) {
      updateUser({ isFirstLogin: false });
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    requirePasswordChange,
    login,
    logout,
    updateUser,
    completePasswordChange,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
