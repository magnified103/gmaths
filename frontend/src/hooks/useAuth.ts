import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI, isStaff } from '../api/auth';

/**
 * Authentication hook providing login, registration, and user management
 * Now connected to real backend API endpoints with role-based navigation support.
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user query
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authAPI.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if token is invalid
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.accessToken);
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      // Navigate based on user permissions after login
      if (isStaff(data.user)) {
        navigate('/admin');
      } else {
        navigate('/student/dashboard');
      }
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.accessToken);
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      // Navigate based on user permissions after registration
      if (isStaff(data.user)) {
        navigate('/admin');
      } else {
        navigate('/student/dashboard');
      }
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: authAPI.resetPassword,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      localStorage.removeItem('auth-token');
      navigate('/login');
    },
  });

  return {
    // User state
    user,
    isAuthenticated: !!user,
    isLoadingUser,
    
    // Login
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message,
    
    // Registration
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error?.message,
    
    // Password reset
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error?.message,
    resetPasswordSuccess: resetPasswordMutation.isSuccess,
    
    // Logout
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
