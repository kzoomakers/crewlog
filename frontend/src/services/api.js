import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      if (error.response.status === 401) {
        // Redirect to login if unauthorized
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/register' &&
            window.location.pathname !== '/forgot' &&
            !window.location.pathname.startsWith('/restore/')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Event API
export const eventApi = {
  getEvents: (start, end) => api.get('/api/v1/calendars/events/', { params: { start, end } }),
  createEvent: (data) => api.post('/api/v1/calendars/events/', data),
  updateEvent: (data) => api.post('/api/v1/calendars/events/', data),
  deleteEvent: (data) => api.delete('/api/v1/calendars/events/', { data }),
  getEventDetails: (eventId) => api.get(`/api/v1/calendars/events/${eventId}/details`),
  updateRecurrentEvent: (data) => api.post('/api/v1/calendars/events/recurrent', data),
  deleteRecurrentEvent: (data) => api.delete('/api/v1/calendars/events/recurrent', { data }),
  saveShift: (data) => api.post('/api/v1/calendars/events/shifts', data),
};

// Calendar API
export const calendarApi = {
  createCalendar: (name) => api.post('/api/v1/calendars/', { calendarName: name }),
  deleteCalendar: () => api.delete('/api/v1/calendars/'),
  shareCalendar: (roleName, expirationDays, noExpiration) => 
    api.post('/api/v1/calendars/share', { roleName, expirationDays, noExpiration }),
  changeShare: (userId, roleNameShares) => 
    api.put('/api/v1/calendars/share', { userId, roleNameShares }),
  saveSettings: (settings) => api.post('/api/v1/calendars/settings', settings),
  setDefault: (calendarId) => api.post('/api/v1/calendars/default', { calendarId }),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get('/api/v1/admin/users'),
  getUser: (userId) => api.get(`/api/v1/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/api/v1/admin/users/${userId}`, data),
  toggleAdmin: (userId) => api.post(`/api/v1/admin/users/${userId}/toggle-admin`),
  resetPassword: (userId, newPassword) => 
    api.post(`/api/v1/admin/users/${userId}/reset-password`, { newPassword }),
  sendResetEmail: (userId) => api.post(`/api/v1/admin/users/${userId}/send-reset-email`),
  verifyUser: (userId) => api.post(`/api/v1/admin/users/${userId}/verify`),
  deleteUser: (userId) => api.delete(`/api/v1/admin/users/${userId}/delete`),
  
  // Email configs
  getEmailConfigs: () => api.get('/api/v1/admin/email/configs'),
  createEmailConfig: (data) => api.post('/api/v1/admin/email/configs', data),
  updateEmailConfig: (configId, data) => api.put(`/api/v1/admin/email/configs/${configId}`, data),
  deleteEmailConfig: (configId) => api.delete(`/api/v1/admin/email/configs/${configId}/delete`),
  activateEmailConfig: (configId) => api.post(`/api/v1/admin/email/configs/${configId}/activate`),
  testEmail: (toEmail) => api.post('/api/v1/admin/email/test', { to_email: toEmail }),
  testConnection: () => api.post('/api/v1/admin/email/test-connection'),
};