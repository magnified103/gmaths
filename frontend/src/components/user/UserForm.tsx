/**
 * User form component for creating and editing users
 * with comprehensive validation and Vietnamese interface
 * Refactored to use reusable UI components
 */

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import type { UserListItem } from '../../types/admin';
import { createUser, updateUser } from '../../api/admin';
import { fetchRoles } from '../../api/roles';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import { MultiSelect } from '../ui/MultiSelect';

interface UserFormProps {
  user?: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation schema for user creation
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được quá 50 ký tự')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và ký tự .-_'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255, 'Email không được quá 255 ký tự'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt'),
  roles: z.array(z.string()),
});

// Validation schema for user update
const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được quá 50 ký tự')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và ký tự .-_'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255, 'Email không được quá 255 ký tự'),
  roles: z.array(z.string()),
  emailVerified: z.boolean(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

/**
 * Create form component for new users.
 */
function CreateUserForm({ onSubmit, isSubmitting, submitError, availableRoles, isLoadingRoles }: {
  onSubmit: (data: CreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  availableRoles: { value: string; label: string }[];
  isLoadingRoles: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roles: [],
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = methods;

  useEffect(() => {
    reset({
      username: '',
      email: '',
      password: '',
      roles: [],
    });
  }, [reset]);

  return (
    <FormProvider {...methods}>
      <form id="create-user-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 pb-4 sm:px-6">
          {/* Submit Error */}
          {submitError && (
            <Alert 
              type="error" 
              message={submitError} 
              className="mb-4"
            />
          )}

          <div className="space-y-4 overflow-visible">
            {/* Username */}
            <FormField
              id="username"
              label="Tên đăng nhập"
              type="text"
              placeholder="Nhập tên đăng nhập"
              required
              error={errors.username?.message}
              register={register}
            />

            {/* Email */}
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="Nhập địa chỉ email"
              required
              error={errors.email?.message}
              register={register}
            />

            {/* Password */}
            <FormField
              id="password"
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              required
              error={errors.password?.message}
              helpText="Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              register={register}
            />

            {/* Role */}
            <MultiSelect
              name="roles"
              label="Vai trò"
              options={availableRoles}
              error={errors.roles?.message}
              disabled={isLoadingRoles}
              placeholder="Chọn vai trò..."
            />
          </div>
        </div>

      </form>
    </FormProvider>
  );
}

/**
 * Update form component for existing users.
 */
function UpdateUserForm({ user, onSubmit, isSubmitting, submitError, availableRoles, isLoadingRoles }: {
  user: UserListItem;
  onSubmit: (data: UpdateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  availableRoles: { value: string; label: string }[];
  isLoadingRoles: boolean;
}) {
  const methods = useForm<UpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      roles: Array.from(user.roles),
      emailVerified: user.emailVerified,
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = methods;

  useEffect(() => {
    reset({
      username: user.username,
      email: user.email,
      roles: Array.from(user.roles),
      emailVerified: user.emailVerified,
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <form id="update-user-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 pb-4 sm:px-6">
          {/* Submit Error */}
          {submitError && (
            <Alert 
              type="error" 
              message={submitError} 
              className="mb-4"
            />
          )}

          <div className="space-y-4 overflow-visible">
            {/* Username */}
            <FormField
              id="username"
              label="Tên đăng nhập"
              type="text"
              placeholder="Nhập tên đăng nhập"
              required
              error={errors.username?.message}
              register={register}
            />

            {/* Email */}
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="Nhập địa chỉ email"
              required
              error={errors.email?.message}
              register={register}
            />

            {/* Role */}
            <MultiSelect
              name="roles"
              label="Vai trò"
              options={availableRoles}
              error={errors.roles?.message}
              disabled={isLoadingRoles}
              placeholder="Chọn vai trò..."
            />

            {/* Email Verified */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailVerified"
                {...register('emailVerified')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-900">
                Email đã được xác thực
              </label>
            </div>
          </div>
        </div>

      </form>
    </FormProvider>
  );
}

/**
 * Main UserForm component using the reusable Modal component.
 */
export default function UserForm({ user, isOpen, onClose, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!user;

  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isOpen, // Only fetch when the modal is open
  });

  const availableRoles = rolesData?.map(role => ({
    value: role.slug,
    label: role.name,
  })) || [];

  useEffect(() => {
    if (rolesError) {
      setSubmitError('Không thể tải danh sách vai trò. Vui lòng thử lại.');
    }
  }, [rolesError]);

  const handleCreateSubmit = async (data: CreateFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert display role to backend role format
      const backendData = {
        ...data,
        roles: Array.from(data.roles),
      };
      await createUser(backendData);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (data: UpdateFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert display role to backend role format
      const backendData = {
        ...data,
        roles: Array.from(data.roles),
      };
      await updateUser(user.id, backendData);
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
      title={isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      subtitle={isEditing ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản người dùng mới'}
      size="lg"
      footer={
        <>
          <button
            type="submit"
            form={isEditing ? 'update-user-form' : 'create-user-form'} // Assign form ID
            disabled={isSubmitting}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
          >
            {isSubmitting ? (
              <ButtonSpinner text={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'} />
            ) : (
              isEditing ? 'Cập nhật người dùng' : 'Tạo người dùng'
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
      {isEditing && user ? (
        <UpdateUserForm
          user={user}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          availableRoles={availableRoles}
          isLoadingRoles={isLoadingRoles}
        />
      ) : (
        <CreateUserForm
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          availableRoles={availableRoles}
          isLoadingRoles={isLoadingRoles}
        />
      )}
    </Modal>
  );
}
