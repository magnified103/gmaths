import type { LoginForm, RegistrationForm, PasswordResetForm, AuthResponse, User } from '../types/auth';
import { API_BASE_URL } from './config';

/**
 * Check if user has admin permission.
 * @param user - User object from backend.
 * @returns True if user has the 'Admin:Read' permission.
 */
export function isStaff(user: User): boolean {
  return user.allPermissions.includes('Admin:Read');
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
        roles: response.user.roles,
        allPermissions: response.user.allPermissions,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
        lastLoginAt: response.user.lastLoginAt,
        emailVerified: response.user.emailVerified,
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
        roles: response.user.roles,
        allPermissions: response.user.allPermissions,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
        lastLoginAt: response.user.lastLoginAt,
        emailVerified: response.user.emailVerified,
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
    } catch (_error) {
      // Logout on client side even if server call fails
      console.warn('Server logout failed, proceeding with client logout:', _error);
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
      const response = await apiFetch<User>('/auth/me');

      return {
        id: response.id,
        email: response.email,
        username: response.username,
        roles: response.roles,
        allPermissions: response.allPermissions,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        lastLoginAt: response.lastLoginAt,
        emailVerified: response.emailVerified,
      };
    } catch (_error) {
      // If token is invalid, remove it and return null
      localStorage.removeItem('auth-token');
      return null;
    }
  },
};
