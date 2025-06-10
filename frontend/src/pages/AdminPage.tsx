/**
 * Admin dashboard page for user management
 * Integrates UserList, UserForm, and BulkUpload components
 * Refactored to use extensible AdminLayout
 */

import { useState } from 'react';
import { UserPlusIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
// useQueryClient import removed - not used in this component
import AdminLayout from '../components/admin/AdminLayout';
import UserList from '../components/user/UserList';
import UserForm from '../components/user/UserForm';
import BulkUpload from '../components/user/BulkUpload';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/ui/Button';
import type { UserListItem } from '../types/admin';

/**
 * Admin users page component - handles user management functionality.
 * Part of the extensible admin dashboard system.
 */
export default function AdminPage() {
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // const queryClient = useQueryClient(); // Not used in current implementation

  /**
   * Opens user form for creating new user.
   */
  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setIsUserFormOpen(true);
  };

  /**
   * Opens user form for editing existing user.
   * @param user - User to edit.
   */
  const handleEditUser = (user: UserListItem) => {
    setSelectedUser(user);
    setFormMode('edit');
    setIsUserFormOpen(true);
  };

  /**
   * Closes user form modal.
   */
  const handleCloseUserForm = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    setTimeout(() => {
      setFormMode('create');
    }, 150); // Small delay to prevent visual flash
  };

  /**
   * Handles successful user form submission.
   */
  const handleUserFormSuccess = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    setTimeout(() => {
      setFormMode('create');
    }, 150);
  };

  /**
   * Opens bulk upload modal.
   */
  const handleOpenBulkUpload = () => {
    setIsBulkUploadOpen(true);
  };

  /**
   * Closes bulk upload modal.
   */
  const handleCloseBulkUpload = () => {
    setIsBulkUploadOpen(false);
  };

  /**
   * Handles successful bulk upload.
   */
  const handleBulkUploadSuccess = () => {
    setIsBulkUploadOpen(false);
    // UserList will automatically refetch due to query invalidation
  };

  return (
    <AdminLayout>
      {/* Page Header with Actions */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý người dùng
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Tạo, chỉnh sửa và quản lý tài khoản người dùng trong hệ thống
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleOpenBulkUpload}
                icon={<CloudArrowUpIcon className="h-5 w-5" />}
              >
                Nhập CSV
              </Button>
              <button
                type="button"
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Thêm người dùng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <ErrorBoundary fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải danh sách người dùng</h3>
              <p className="text-gray-600 mb-4">Không thể hiển thị danh sách người dùng. Vui lòng tải lại trang.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Tải lại
              </button>
            </div>
          </div>
        }>
          <UserList
            onCreateUser={handleCreateUser}
            onEditUser={handleEditUser}
          />
        </ErrorBoundary>
      </div>

      {/* User Form Modal */}
      <UserForm
        user={formMode === 'edit' ? selectedUser : null}
        isOpen={isUserFormOpen}
        onClose={handleCloseUserForm}
        onSuccess={handleUserFormSuccess}
      />

      {/* Bulk Upload Modal */}
      <BulkUpload
        isOpen={isBulkUploadOpen}
        onClose={handleCloseBulkUpload}
        onSuccess={handleBulkUploadSuccess}
      />
    </AdminLayout>
  );
} 