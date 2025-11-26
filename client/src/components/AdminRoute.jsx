// client/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner

  // protect: must be logged and admin
  if (!user || String(user.user_type || user.userType).toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
