import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import type { LoginForm as LoginFormData } from '../types/auth';

// Validation schema using Zod with Vietnamese error messages
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

/**
 * Login form component with Vietnamese UI and form validation
 * Handles user authentication with loading states and error messages
 */
const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Handle form submission
   */
  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email
        </label>
        <div className="relative">
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`input-field ${errors.email ? 'input-field-error' : ''}`}
            placeholder="Nhập email của bạn"
          />
          {errors.email && (
            <div className="mt-2 flex items-center">
              <svg className="w-4 h-4 text-error-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-error-600" role="alert">
                {errors.email.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`input-field pr-10 ${errors.password ? 'input-field-error' : ''}`}
            placeholder="Nhập mật khẩu của bạn"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <div className="mt-2 flex items-center">
            <svg className="w-4 h-4 text-error-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error-600" role="alert">
              {errors.password.message}
            </p>
          </div>
        )}
      </div>

      {/* Login Error */}
      {loginError && (
        <div className="alert-error">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-error-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" role="alert">
              {loginError}
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Link */}
      <div className="flex items-center justify-end">
        <div className="text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoggingIn}
          className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </div>

      {/* Registration Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-500 transition-colors hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {/* Demo Credentials */}
      <div className="mt-6 alert-info">
        <h4 className="text-sm font-semibold text-primary-900 mb-2">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tài khoản demo:
        </h4>
        <div className="text-sm text-primary-700 space-y-1">
          <p><strong>Admin:</strong> admin@gmaths.edu.vn / admin123</p>
          <p><strong>Sinh viên:</strong> student@gmaths.edu.vn / student123</p>
        </div>
      </div>
    </form>
  );
};

export default LoginForm; 