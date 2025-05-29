import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../api/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that redirects authenticated users away from auth pages.
 * This prevents users from accessing login/register pages when already logged in.
 */
export default function AuthGuard({ children, redirectTo }: AuthGuardProps) {
  const { user, isLoadingUser } = useAuth();

  // Show nothing while loading user state
  if (isLoadingUser) {
    return null;
  }

  // If user is authenticated, redirect them away
  if (user) {
    const defaultRedirect = isAdmin(user.role) ? '/admin' : '/';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  // User is not authenticated, show the protected content (login/register forms)
  return <>{children}</>;
} 