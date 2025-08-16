/**
 * Admin-related TypeScript interfaces for user management
 */

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  roles: string[];
  allPermissions: string[]; // Add this line
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateForm {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UserUpdateForm {
  username: string;
  email: string;
  roles: string[];
  emailVerified: boolean;
}

export interface UserFilters {
  search: string;
  role: 'all' | 'student' | 'staff' | 'superuser';
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
  items: UserListItem[];
  pageIndex: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}
