/**
 * Admin dashboard page for user management
 * Integrates UserList, UserForm, and BulkUpload components
 */

import React, { useState } from 'react';
import { UserPlusIcon, CloudArrowUpIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import BulkUpload from '../components/BulkUpload';
import ErrorBoundary from '../components/ErrorBoundary';
import type { UserListItem } from '../types/admin';

/**
 * Main admin page component for user management.
 * Provides interface for viewing, creating, editing, and bulk importing users.
 */
export default function AdminPage() {
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [userFormKey, setUserFormKey] = useState(0);

  const queryClient = useQueryClient();

  /**
   * Handles opening the user creation form.
   */
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserFormOpen(true);
  };

  /**
   * Handles opening the user edit form.
   * @param user - User to edit.
   */
  const handleEditUser = (user: UserListItem) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  /**
   * Handles closing the user form.
   */
  const handleCloseUserForm = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    // Force re-render of UserForm by changing key
    setUserFormKey(prev => prev + 1);
  };

  /**
   * Handles successful user form submission.
   * Refreshes the user list and closes the form.
   */
  const handleUserFormSuccess = () => {
    // Invalidate user list queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['users'] });
    handleCloseUserForm();
  };

  /**
   * Handles opening the bulk upload modal.
   */
  const handleOpenBulkUpload = () => {
    setIsBulkUploadOpen(true);
  };

  /**
   * Handles closing the bulk upload modal.
   */
  const handleCloseBulkUpload = () => {
    setIsBulkUploadOpen(false);
  };

  /**
   * Handles successful bulk upload.
   * Refreshes the user list and closes the modal.
   */
  const handleBulkUploadSuccess = () => {
    // Invalidate user list queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['users'] });
    handleCloseBulkUpload();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header with Actions */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bảng điều khiển quản trị
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý người dùng và cấu hình hệ thống
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-3">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <HomeIcon className="-ml-1 mr-2 h-5 w-5" />
                  Trang chủ
                </Link>
                <button
                  type="button"
                  onClick={handleOpenBulkUpload}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                  Tải lên CSV
                </button>
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
          }>
            <UserList
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
            />
          </ErrorBoundary>
        </div>

        {/* User Form Modal */}
        <UserForm
          key={userFormKey}
          user={selectedUser}
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
      </div>
    </ErrorBoundary>
  );
} 