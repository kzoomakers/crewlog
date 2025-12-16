import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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
  const [currentCalendar, setCurrentCalendar] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      setUser(response.data.user);
      setCalendars(response.data.calendars || []);
      setCurrentCalendar(response.data.currentCalendar || null);
    } catch (error) {
      setUser(null);
      setCalendars([]);
      setCurrentCalendar(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    setUser(response.data.user);
    setCalendars(response.data.calendars || []);
    setCurrentCalendar(response.data.currentCalendar || null);
    return response.data;
  };

  const register = async (email, password, firstName, lastName) => {
    const response = await api.post('/api/v1/auth/register', {
      email,
      password,
      firstName,
      lastName
    });
    setUser(response.data.user);
    setCalendars(response.data.calendars || []);
    setCurrentCalendar(response.data.currentCalendar || null);
    return response.data;
  };

  const logout = async () => {
    await api.post('/api/v1/auth/logout');
    setUser(null);
    setCalendars([]);
    setCurrentCalendar(null);
  };

  const forgotPassword = async (email) => {
    return await api.post('/api/v1/auth/forgot', { email });
  };

  const restorePassword = async (token, password) => {
    const response = await api.post(`/api/v1/auth/restore/${token}`, { password });
    if (response.data.user) {
      setUser(response.data.user);
      setCalendars(response.data.calendars || []);
      setCurrentCalendar(response.data.currentCalendar || null);
    }
    return response.data;
  };

  const updateProfile = async (firstName, lastName) => {
    const response = await api.put('/api/v1/users/', { firstName, lastName });
    setUser(prev => ({ ...prev, first_name: firstName, last_name: lastName }));
    return response.data;
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await api.post('/api/v1/users/password', { oldPassword, newPassword });
  };

  const resendVerificationEmail = async () => {
    return await api.post('/api/v1/users/resend_email');
  };

  const switchCalendar = async (calendarId) => {
    const response = await api.post('/api/v1/calendars/default', { calendarId });
    setCurrentCalendar(response.data.calendar);
    return response.data;
  };

  const value = {
    user,
    currentCalendar,
    calendars,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    restorePassword,
    updateProfile,
    changePassword,
    resendVerificationEmail,
    switchCalendar,
    checkAuth,
    setCurrentCalendar,
    setCalendars
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;