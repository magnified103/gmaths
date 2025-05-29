import type { LoginForm, RegistrationForm, PasswordResetForm, AuthResponse, User, UserRole, DisplayRole } from '../types/auth';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Convert backend role to display role for UI consistency.
 * @param role - Backend role (uppercase).
 * @returns Display role (lowercase).
 */
export function roleToDisplay(role: UserRole): DisplayRole {
  return role.toLowerCase() as DisplayRole;
}

/**
 * Check if user has admin role.
 * @param role - User role from backend.
 * @returns True if user is admin.
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Base fetch wrapper with error handling for Vietnamese error messages.
 * @param url - API endpoint URL.
 * @param options - Fetch options.
 * @returns Promise resolving to response data.
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth-token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || 'Đã xảy ra lỗi không xác định';
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Authentication API client for real backend integration.
 */
export const authAPI = {
  /**
   * Login user with email and password.
   * @param data - Login form data.
   * @returns Promise resolving to authentication response.
   */
  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    return {
      user: {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: response.token,
      refreshToken: response.token, // Using same token for now
    };
  },

  /**
   * Register new user account.
   * @param data - Registration form data.
   * @returns Promise resolving to authentication response.
   */
  async register(data: RegistrationForm): Promise<AuthResponse> {
    const response = await apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    });

    return {
      user: {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: response.token,
      refreshToken: response.token, // Using same token for now
    };
  },

  /**
   * Request password reset for user account.
   * @param data - Password reset form data.
   * @returns Promise resolving to success message.
   */
  async resetPassword(data: PasswordResetForm): Promise<{ message: string }> {
    const response = await apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
      }),
    });

    return {
      message: response.message,
    };
  },

  /**
   * Logout current user.
   * @returns Promise resolving when logout completes.
   */
  async logout(): Promise<void> {
    try {
      // Don't set Content-Type header for requests without body
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Logout failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Logout on client side even if server call fails
      console.warn('Server logout failed, proceeding with client logout:', error);
    } finally {
      localStorage.removeItem('auth-token');
    }
  },

  /**
   * Get current authenticated user.
   * @returns Promise resolving to current user or null if not authenticated.
   */
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return null;
    }

    try {
      const response = await apiFetch<{ user: User }>('/auth/me');
      
      return {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // If token is invalid, remove it and return null
      localStorage.removeItem('auth-token');
      return null;
    }
  },
}; 