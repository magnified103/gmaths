/**
 * User form component for creating and editing users
 * with comprehensive validation and Vietnamese interface
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { UserListItem, UserCreateForm, UserUpdateForm } from '../types/admin';
import { createUser, updateUser } from '../api/admin';

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
  role: z.enum(['student', 'admin'], {
    errorMap: () => ({ message: 'Vai trò không hợp lệ' }),
  }),
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
  role: z.enum(['student', 'admin'], {
    errorMap: () => ({ message: 'Vai trò không hợp lệ' }),
  }),
  emailVerified: z.boolean(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

/**
 * Create form component for new users.
 */
function CreateUserForm({ onSubmit, isSubmitting, submitError }: {
  onSubmit: (data: CreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'student',
    },
  });

  useEffect(() => {
    reset({
      username: '',
      email: '',
      password: '',
      role: 'student',
    });
  }, [reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-4 pb-4 sm:px-6">
        {/* Submit Error */}
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{submitError}</div>
          </div>
        )}

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              {...register('username')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.username ? 'border-red-300' : ''
              }`}
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : ''
              }`}
              placeholder="Nhập địa chỉ email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password')}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                  errors.password ? 'border-red-300' : ''
                }`}
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
            </p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              {...register('role')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-300' : ''
              }`}
            >
              <option value="student">Học sinh</option>
              <option value="admin">Quản trị viên</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            'Tạo mới'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Update form component for existing users.
 */
function UpdateUserForm({ user, onSubmit, isSubmitting, submitError }: {
  user: UserListItem;
  onSubmit: (data: UpdateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });

  useEffect(() => {
    reset({
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  }, [user, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-4 pb-4 sm:px-6">
        {/* Submit Error */}
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{submitError}</div>
          </div>
        )}

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              {...register('username')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.username ? 'border-red-300' : ''
              }`}
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : ''
              }`}
              placeholder="Nhập địa chỉ email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              {...register('role')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-300' : ''
              }`}
            >
              <option value="student">Học sinh</option>
              <option value="admin">Quản trị viên</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Email Verified */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailVerified"
                {...register('emailVerified')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-700">
                Email đã được xác thực
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Đánh dấu nếu địa chỉ email của người dùng đã được xác thực
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            'Cập nhật'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * User form component for creating and editing users.
 * @param user - User data for editing (null for creation).
 * @param isOpen - Whether the form modal is open.
 * @param onClose - Callback when form is closed.
 * @param onSuccess - Callback when form is successfully submitted.
 */
export default function UserForm({ user, isOpen, onClose, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(user);

  /**
   * Handles form submission for both create and update operations.
   * @param data - Form data to submit.
   */
  const handleCreateSubmit = async (data: CreateFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createUser(data as UserCreateForm);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form submission for update operations.
   * @param data - Form data to submit.
   */
  const handleUpdateSubmit = async (data: UpdateFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateUser(user.id, data as UserUpdateForm);
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form cancellation and cleanup.
   */
  const handleCancel = () => {
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        />

        {/* Modal content */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {isEditing ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Conditional Form Rendering */}
          {isEditing && user ? (
            <UpdateUserForm
              user={user}
              onSubmit={handleUpdateSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          ) : (
            <CreateUserForm
              onSubmit={handleCreateSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}

          {/* Cancel Button */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 