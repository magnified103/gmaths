import { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import RoleList from '../components/admin/RoleList';
import RoleForm from '../components/admin/RoleForm';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { Role } from '../api/roles';
import Button from '../components/ui/Button'; // Import Button component

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormMode('create');
    setIsRoleFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormMode('edit');
    setIsRoleFormOpen(true);
  };

  const handleCloseRoleForm = () => {
    setIsRoleFormOpen(false);
    setSelectedRole(null);
    setTimeout(() => {
      setFormMode('create');
    }, 150);
  };

  const handleRoleFormSuccess = () => {
    setIsRoleFormOpen(false);
    setSelectedRole(null);
    setTimeout(() => {
      setFormMode('create');
    }, 150);
  };

  return (
    <AdminLayout>
      {/* Page Header with Actions */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý vai trò
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Tạo, chỉnh sửa và quản lý vai trò người dùng và quyền hạn của họ.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={handleCreateRole}
                icon={<PlusIcon className="h-5 w-5" />}
              >
                Tạo vai trò mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <ErrorBoundary fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải danh sách vai trò</h3>
              <p className="text-gray-600 mb-4">Không thể hiển thị danh sách vai trò. Vui lòng tải lại trang.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Tải lại
              </button>
            </div>
          </div>
        }>
          <RoleList
            onCreateRole={handleCreateRole}
            onEditRole={handleEditRole}
          />
        </ErrorBoundary>
      </div>

      {/* Role Form Modal */}
      <RoleForm
        role={formMode === 'edit' ? selectedRole : null}
        isOpen={isRoleFormOpen}
        onClose={handleCloseRoleForm}
        onSuccess={handleRoleFormSuccess}
      />
    </AdminLayout>
  );
}
