import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import { MultiSelect } from '../ui/MultiSelect';
import {
  type Role,
  createRole,
  updateRole,
  fetchAllPermissions,
} from '../../api/roles';

interface RoleFormProps {
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation schema for role creation
const createRoleSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug là bắt buộc')
    .regex(/^[a-z0-9-]+$/, 'Slug phải là chữ thường, chữ số và có thể chứa dấu gạch ngang'),
  name: z.string().min(1, 'Tên là bắt buộc'),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

// Validation schema for role update
const updateRoleSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc').optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

type CreateFormData = z.infer<typeof createRoleSchema>;
type UpdateFormData = z.infer<typeof updateRoleSchema>;

function CreateRoleForm({
  onSubmit,
  isSubmitting,
  submitError,
  availablePermissions,
  isLoadingPermissions,
}: {
  onSubmit: (data: CreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  availablePermissions: { value: string; label: string }[];
  isLoadingPermissions: boolean;
}) {
  const methods = useForm<CreateFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      slug: '',
      name: '',
      description: '',
      permissions: [],
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = methods;

  useEffect(() => {
    reset({
      slug: '',
      name: '',
      description: '',
      permissions: [],
    });
  }, [reset]);

  return (
    <FormProvider {...methods}>
      <form id="create-role-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 pb-4 sm:px-6">
          {submitError && (
            <Alert type="error" message={submitError} className="mb-4" />
          )}

          <div className="space-y-4 overflow-visible">
            <FormField
              id="slug"
              label="Slug"
              type="text"
              placeholder="ví dụ: student, admin"
              required
              error={errors.slug?.message}
              register={register}
              helpText="Mã định danh duy nhất cho vai trò (chữ thường, chữ số, có thể chứa dấu gạch ngang)"
            />

            <FormField
              id="name"
              label="Tên"
              type="text"
              placeholder="ví dụ: Học sinh, Quản trị viên"
              required
              error={errors.name?.message}
              register={register}
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                id="description"
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
                  bg-white
                `}
                placeholder="Mô tả ngắn gọn về vai trò"
                {...register('description')}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <MultiSelect
              name="permissions"
              label="Quyền hạn"
              options={availablePermissions}
              error={errors.permissions?.message}
              disabled={isLoadingPermissions}
              placeholder="Chọn quyền hạn..."
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function UpdateRoleForm({
  role,
  onSubmit,
  isSubmitting,
  submitError,
  availablePermissions,
  isLoadingPermissions,
}: {
  role: Role;
  onSubmit: (data: UpdateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  availablePermissions: { value: string; label: string }[];
  isLoadingPermissions: boolean;
}) {
  const methods = useForm<UpdateFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = methods;

  useEffect(() => {
    reset({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  }, [role, reset]);

  return (
    <FormProvider {...methods}>
      <form id="update-role-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 pb-4 sm:px-6">
          {submitError && (
            <Alert type="error" message={submitError} className="mb-4" />
          )}

          <div className="space-y-4 overflow-visible">
            <FormField
              id="name"
              label="Name"
              type="text"
              placeholder="e.g., Student, Administrator"
              required
              error={errors.name?.message}
              register={register}
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
                  bg-white
                `}
                placeholder="A brief description of the role"
                {...register('description')}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <MultiSelect
              name="permissions"
              label="Permissions"
              options={availablePermissions}
              error={errors.permissions?.message}
              disabled={isLoadingPermissions}
              placeholder="Select permissions..."
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

export default function RoleForm({ role, isOpen, onClose, onSuccess }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!role;

  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    error: permissionsError,
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchAllPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isOpen, // Only fetch when the modal is open
  });

  const availablePermissions =
    permissionsData?.map((perm) => ({
      value: perm,
      label: perm,
    })) || [];

  useEffect(() => {
    if (permissionsError) {
      setSubmitError('Không thể tải quyền hạn. Vui lòng thử lại.');
    }
  }, [permissionsError]);

  const handleCreateSubmit = async (data: CreateFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createRole(data);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (data: UpdateFormData) => {
    if (!role) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateRole(role.slug, data);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={isEditing ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
      subtitle={isEditing ? 'Cập nhật thông tin vai trò' : 'Xác định một vai trò mới và quyền hạn của nó'}
      size="lg"
      footer={
        <>
          <button
            type="submit"
            form={isEditing ? 'update-role-form' : 'create-role-form'}
            disabled={isSubmitting}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
          >
            {isSubmitting ? (
              <ButtonSpinner text={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'} />
            ) : (
              isEditing ? 'Cập nhật vai trò' : 'Tạo vai trò'
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Hủy
          </button>
        </>
      }
    >
      {isEditing && role ? (
        <UpdateRoleForm
          role={role}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          availablePermissions={availablePermissions}
          isLoadingPermissions={isLoadingPermissions}
        />
      ) : (
        <CreateRoleForm
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          availablePermissions={availablePermissions}
          isLoadingPermissions={isLoadingPermissions}
        />
      )}
    </Modal>
  );
}
