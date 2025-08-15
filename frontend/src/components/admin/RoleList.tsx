import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { fetchRoles, deleteRole, type Role } from '../../api/roles';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface RoleListProps {
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
}

export default function RoleList({ onCreateRole, onEditRole }: RoleListProps) {
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: roles,
    isLoading,
    isError,
    error,
  } = useQuery<Role[], Error>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteRoleMutation = useMutation<void, Error, string>({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(err.message || 'Failed to delete role.');
    },
  });

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.slug);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
    setDeleteError(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
        <p className="ml-2 text-gray-600">Đang tải vai trò...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Alert
          type="error"
          message={error?.message || 'Không thể tải vai trò. Vui lòng thử lại.'}
          className="mb-4"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Role Table */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          {roles && roles.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tên
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Slug
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mô tả
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quyền hạn
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Chỉnh sửa</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.slug}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          role.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {permission}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Không có quyền hạn</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Chỉnh sửa vai trò"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa vai trò"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Không tìm thấy vai trò nào. Nhấp vào "Tạo vai trò mới" để thêm.
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {roles && (!roles || !Array.isArray(roles) || roles.length === 0) && (
        <div className="mt-6 text-center py-12 bg-white shadow rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Không có vai trò nào
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu bằng cách tạo vai trò mới.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onCreateRole}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Tạo vai trò mới
            </button>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {!isLoading && !isError && (!roles || !Array.isArray(roles)) && (
        <div className="mt-6 text-center py-12 bg-white shadow rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu</h3>
          <p className="mt-1 text-sm text-gray-500">Không thể tải danh sách vai trò.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Xác nhận xóa vai trò"
        subtitle={`Bạn có chắc chắn muốn xóa vai trò "${roleToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteRoleMutation.isPending}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
            >
              {deleteRoleMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
            <button
              type="button"
              onClick={cancelDelete}
              disabled={deleteRoleMutation.isPending}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Hủy
            </button>
          </>
        }
      >
        {deleteError && (
          <Alert type="error" message={deleteError} className="mb-4" />
        )}
      </Modal>
    </div>
  );
}
