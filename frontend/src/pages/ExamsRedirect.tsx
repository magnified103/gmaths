import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../api/auth';
import FullScreenLoader from '../components/ui/FullScreenLoader';

/**
 * Exams redirect component that routes users to appropriate exam list based on role
 * Admin users -> /admin/exams
 * Student users -> /student/exams
 */
const ExamsRedirect: React.FC = () => {
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
  if (isAdmin(user.role)) {
    return <Navigate to="/admin/exams" replace />;
  } else {
    return <Navigate to="/student/exams" replace />;
  }
};

export default ExamsRedirect; 