/**
 * Authentication-related TypeScript interfaces
 */

export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetForm {
  email: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  message: string;
  field?: string;
} 