import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import type { PasswordResetForm as PasswordResetFormData } from '../../types/auth';

// Validation schema using Zod with Vietnamese error messages
const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
});

/**
 * Password reset form component with Vietnamese UI
 * Handles password reset email request with success/error states
 */
const PasswordResetForm: React.FC = () => {
  const { 
    resetPassword, 
    isResettingPassword, 
    resetPasswordError, 
    resetPasswordSuccess 
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  /**
   * Handle form submission
   */
  const onSubmit = (data: PasswordResetFormData) => {
    resetPassword(data);
  };

  // Show success state if password reset was successful
  if (resetPasswordSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Email đã được gửi!
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          Chúng tôi đã gửi liên kết đặt lại mật khẩu đến{' '}
          <span className="font-medium">{getValues('email')}</span>.{' '}
          Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
        </p>
        
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Không nhận được email? Kiểm tra thư mục spam hoặc thử lại sau 5 phút.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Gửi lại email
            </button>
            
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1">
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nhập email của bạn"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Reset Error */}
      {resetPasswordError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800" role="alert">
            {resetPasswordError}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={isResettingPassword}
          loadingText="Đang gửi email..."
          disabled={isResettingPassword}
        >
          Gửi liên kết đặt lại
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center justify-between text-sm">
        <Link
          to="/login"
          className="font-medium text-gray-600 hover:text-primary-600 transition-colors"
        >
          ← Quay lại đăng nhập
        </Link>
        
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          Tạo tài khoản mới
        </Link>
      </div>

      {/* Security Note */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Vì lý do bảo mật, chúng tôi sẽ không thông báo nếu email này đã được đăng ký hay chưa.
        </p>
      </div>
    </form>
  );
};

export default PasswordResetForm; 