/**
 * Admin API client functions for user management
 */

import type {
  UserListItem,
  UserCreateForm,
  UserUpdateForm,
  UserFilters,
  UserListResponse,
  BulkUploadResult,
} from '../types/admin';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Builds query string from user filters object and pagination.
 * @param filters - User filtering and sorting options.
 * @param page - Page number (1-based).
 * @param limit - Number of items per page.
 * @returns Query string for API request.
 */
function buildQueryString(
  filters: Partial<UserFilters>,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();
  
  // Add pagination parameters
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  // Add filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * Fetches paginated list of users with filtering and sorting.
 * @param filters - Filtering and pagination options.
 * @param page - Page number (1-based).
 * @param limit - Number of items per page.
 * @returns Promise resolving to user list response.
 */
export async function fetchUsers(
  filters: Partial<UserFilters> = {},
  page: number = 1,
  limit: number = 20
): Promise<UserListResponse> {
  const queryString = buildQueryString(filters, page, limit);
  const url = `${API_BASE_URL}/api/admin/users?${queryString}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Không thể tải danh sách người dùng: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // Handle backend response format with success wrapper
  if (result.success && result.data) {
    return result.data;
  }
  
  // Fallback if response is already in the expected format
  return result;
}

/**
 * Fetches a single user by ID.
 * @param userId - User ID to fetch.
 * @returns Promise resolving to user data.
 */
export async function fetchUser(userId: string): Promise<UserListItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Không thể tải thông tin người dùng: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Creates a new user.
 * @param userData - User creation form data.
 * @returns Promise resolving to created user data.
 */
export async function createUser(userData: UserCreateForm): Promise<UserListItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tạo người dùng mới');
  }
  
  return response.json();
}

/**
 * Updates an existing user.
 * @param userId - User ID to update.
 * @param userData - User update form data.
 * @returns Promise resolving to updated user data.
 */
export async function updateUser(userId: string, userData: UserUpdateForm): Promise<UserListItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể cập nhật thông tin người dùng');
  }
  
  return response.json();
}

/**
 * Deletes a user by ID.
 * @param userId - User ID to delete.
 * @returns Promise resolving when deletion is complete.
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể xóa người dùng');
  }
}

/**
 * Uploads CSV file for bulk user import.
 * @param file - CSV file to upload.
 * @param overwrite - Whether to overwrite existing users.
 * @returns Promise resolving to upload result.
 */
export async function uploadUsersCSV(file: File, overwrite: boolean = false): Promise<BulkUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('overwrite', String(overwrite));
  
  const response = await fetch(`${API_BASE_URL}/api/admin/users/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tải lên tệp CSV');
  }
  
  return response.json();
}

/**
 * Downloads CSV template for user import.
 * @returns Promise resolving to blob for download.
 */
export async function downloadCSVTemplate(): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/template`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Không thể tải xuống mẫu CSV');
  }
  
  return response.blob();
} 