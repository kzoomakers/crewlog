import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import RestorePassword from './pages/auth/RestorePassword';
import Profile from './pages/auth/Profile';

// Main Pages
import Calendar from './pages/Calendar';
import Report from './pages/Report';
import Settings from './pages/Settings';
import Shares from './pages/Shares';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEmailSettings from './pages/admin/AdminEmailSettings';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/restore/:token" element={<RestorePassword />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Calendar />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/report" element={
          <PrivateRoute>
            <Report />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/shares" element={
          <PrivateRoute>
            <Shares />
          </PrivateRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute adminOnly>
            <AdminUsers />
          </PrivateRoute>
        } />
        <Route path="/admin/email" element={
          <PrivateRoute adminOnly>
            <AdminEmailSettings />
          </PrivateRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;