import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginForm, RegistrationForm, PasswordResetForm, AuthResponse, User } from '../types/auth';

// Mock API functions for development - will be replaced with real API calls in Step 1.2
const mockAuthAPI = {
  /**
   * Mock login function that simulates API call
   */
  login: async (data: LoginForm): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    if (data.email === 'admin@gmaths.edu.vn' && data.password === 'admin123') {
      return {
        user: {
          id: '1',
          email: 'admin@gmaths.edu.vn',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
    }
    
    if (data.email === 'student@gmaths.edu.vn' && data.password === 'student123') {
      return {
        user: {
          id: '2',
          email: 'student@gmaths.edu.vn',
          username: 'student',
          role: 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
    }
    
    throw new Error('Email hoặc mật khẩu không đúng');
  },

  /**
   * Mock registration function that simulates API call
   */
  register: async (data: RegistrationForm): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    if (data.email === 'existing@gmaths.edu.vn') {
      throw new Error('Email này đã được sử dụng');
    }
    
    return {
      user: {
        id: '3',
        email: data.email,
        username: data.username,
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  },

  /**
   * Mock password reset function that simulates API call
   */
  resetPassword: async (data: PasswordResetForm): Promise<{ message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    if (data.email === 'notfound@gmaths.edu.vn') {
      throw new Error('Không tìm thấy tài khoản với email này');
    }
    
    return {
      message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  },

  /**
   * Mock logout function
   */
  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('auth-token');
  },

  /**
   * Mock function to get current user
   */
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('auth-token');
    if (!token) return null;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock user based on stored token
    return {
      id: '2',
      email: 'student@gmaths.edu.vn',
      username: 'student',
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

/**
 * Authentication hook providing login, registration, and user management
 */
export const useAuth = () => {
  const queryClient = useQueryClient();

  // Get current user query
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: mockAuthAPI.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: mockAuthAPI.login,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.accessToken);
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: mockAuthAPI.register,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.accessToken);
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: mockAuthAPI.resetPassword,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: mockAuthAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
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