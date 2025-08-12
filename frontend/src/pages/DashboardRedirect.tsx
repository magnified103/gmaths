import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../api/auth';
import FullScreenLoader from '../components/ui/FullScreenLoader';

/**
 * Dashboard redirect component that routes users to appropriate dashboard based on role
 * Admin users -> /admin
 * Student users -> /student/dashboard
 */
const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoadingUser } = useAuth();

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return <FullScreenLoader message="Đang chuyển hướng..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (isAdmin(user)) {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/student/dashboard" replace />;
  }
};

export default DashboardRedirect; 