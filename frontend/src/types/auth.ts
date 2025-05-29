/**
 * Authentication-related TypeScript interfaces
 */

// Backend uses uppercase enum values
export type UserRole = 'STUDENT' | 'ADMIN';

// Frontend display uses lowercase for UI consistency
export type DisplayRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole; // Now matches backend
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