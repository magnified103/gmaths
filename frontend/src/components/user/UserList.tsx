/**
 * User list component with search, filtering, and pagination
 * for admin user management interface
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { UserListItem, UserFilters } from '../../types/admin';
import { fetchUsers, deleteUser } from '../../api/admin';
import { isStaff } from '../../api/auth';

interface UserListProps {
  onCreateUser: () => void;
  onEditUser: (user: UserListItem) => void;
}

/**
 * User list component with filtering, sorting, and pagination.
 * @param onCreateUser - Callback when create user button is clicked.
 * @param onEditUser - Callback when edit user button is clicked.
 */
export default function UserList({ onCreateUser, onEditUser }: UserListProps) {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    emailVerified: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', filters, currentPage],
    queryFn: () => fetchUsers(filters, currentPage, itemsPerPage),
    placeholderData: (previousData) => previousData,
  });

  const queryClient = useQueryClient();

  /**
   * Handles search input changes with debounced effect.
   * @param value - Search input value.
   */
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  /**
   * Handles filter changes and resets to first page.
   * @param key - Filter property to update.
   * @param value - New filter value.
   */
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * Handles user deletion with confirmation.
   * @param user - User to delete.
   */
  const handleDeleteUser = async (user: UserListItem) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${user.username}"?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      alert(`Lỗi khi xóa người dùng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  };

  /**
   * Formats date string for display.
   * @param dateString - ISO date string.
   * @returns Formatted date string.
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  /**
   * Gets role display text in Vietnamese.
   * @param user - User object.
   * @returns Vietnamese role text.
   */
  const getRoleText = (user: UserListItem): string => {
    return isStaff(user) ? 'Quản trị' : 'Học sinh';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="mt-2 text-sm text-gray-700">
            Quản lý tài khoản học sinh và quản trị viên trong hệ thống
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={onCreateUser}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Tạo người dùng mới
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tìm kiếm theo tên đăng nhập hoặc email..."
              />
            </div>

            {/* Filter Toggle */}
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
                Bộ lọc
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 border-t pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">Tất cả</option>
                    <option value="student">Học sinh</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </div>

                {/* Email Verified Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Xác thực email</label>
                  <select
                    value={filters.emailVerified}
                    onChange={(e) => handleFilterChange('emailVerified', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">Tất cả</option>
                    <option value="verified">Đã xác thực</option>
                    <option value="unverified">Chưa xác thực</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sắp xếp theo</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="createdAt">Ngày tạo</option>
                    <option value="username">Tên đăng nhập</option>
                    <option value="email">Email</option>
                    <option value="lastLoginAt">Lần đăng nhập cuối</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thứ tự</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="desc">Mới nhất</option>
                    <option value="asc">Cũ nhất</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-6 text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải danh sách người dùng...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : 'Không thể tải danh sách người dùng'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Table */}
      {data && data.items && Array.isArray(data.items) && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xác thực
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần đăng nhập cuối
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((user: UserListItem) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isStaff(user)
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getRoleText(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.emailVerified ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <span className="ml-2 text-sm text-gray-900">
                          {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Xóa"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages && data.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                  disabled={currentPage === data.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' '}đến{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, data.totalItems)}
                    </span>
                    {' '}trong tổng số{' '}
                    <span className="font-medium">{data.totalItems}</span>
                    {' '}kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                      disabled={currentPage === data.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {data && (!data.items || !Array.isArray(data.items) || data.items.length === 0) && (
        <div className="mt-6 text-center py-12 bg-white shadow rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.search || filters.role !== 'all' || filters.emailVerified !== 'all' 
              ? 'Không tìm thấy người dùng nào' 
              : 'Không có người dùng nào'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.role !== 'all' || filters.emailVerified !== 'all'
              ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để hiển thị kết quả khác.'
              : 'Bắt đầu bằng cách tạo người dùng mới.'
            }
          </p>
          <div className="mt-6">
            {filters.search || filters.role !== 'all' || filters.emailVerified !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    search: '',
                    role: 'all',
                    emailVerified: 'all',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                  });
                  setCurrentPage(1);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateUser}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tạo người dùng mới
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debug Information */}
      {!isLoading && !error && !data && (
        <div className="mt-6 text-center py-12 bg-white shadow rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu</h3>
          <p className="mt-1 text-sm text-gray-500">Không thể tải danh sách người dùng.</p>
        </div>
      )}
    </div>
  );
}
