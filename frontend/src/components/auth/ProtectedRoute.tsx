import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../api/auth';
import type { DisplayRole } from '../../types/auth';
import FullScreenLoader from '../ui/FullScreenLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: DisplayRole;
  redirectTo?: string;
}

/**
 * Protected route component that checks authentication and role-based access.
 * Redirects to login if not authenticated or to home if insufficient permissions.
 * @param children - Child components to render if access is granted.
 * @param requiredRole - Required user role to access this route (lowercase for UI).
 * @param redirectTo - Custom redirect path (defaults to /login or /).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  redirectTo 
}) => {
  const { user, isAuthenticated, isLoadingUser } = useAuth();

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return <FullScreenLoader message="Đang kiểm tra quyền truy cập..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo || '/login'} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const hasAccess = requiredRole === 'admin' ? isAdmin(user.role) : !isAdmin(user.role);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="w-16 h-16 mx-auto bg-error-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Không có quyền truy cập
              </h1>
              <p className="text-gray-600 mb-6">
                Bạn không có quyền truy cập vào khu vực này. 
                {requiredRole === 'admin' 
                  ? ' Chỉ quản trị viên mới có thể truy cập.' 
                  : ' Vui lòng liên hệ quản trị viên.'}
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn-primary mr-4"
              >
                Quay lại
              </button>
              <Navigate to={redirectTo || '/'} replace />
            </div>
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute; 