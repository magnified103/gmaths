/**
 * Admin-related TypeScript interfaces for user management
 */

import type { UserRole, DisplayRole } from './auth';

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateForm {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateForm {
  username: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface UserFilters {
  search: string;
  role: 'all' | DisplayRole;
  emailVerified: 'all' | 'verified' | 'unverified';
  sortBy: 'username' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder: 'asc' | 'desc';
}

export interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: BulkUploadError[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
}

export interface CSVUserRow {
  username: string;
  email: string;
  password: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 