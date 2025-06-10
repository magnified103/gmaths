import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import type { RegistrationForm as RegistrationFormData } from '../../types/auth';

// Validation schema using Zod with Vietnamese error messages
const registrationSchema = z.object({
  username: z
    .string()
    .min(1, 'Vui lòng nhập tên người dùng')
    .min(3, 'Tên người dùng phải có ít nhất 3 ký tự')
    .max(20, 'Tên người dùng không được quá 20 ký tự')
    .regex(/^[a-zA-Z0-9._]+$/, 'Tên người dùng chỉ được chứa chữ cái, số, dấu chấm và dấu gạch dưới'),
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  confirmPassword: z
    .string()
    .min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

/**
 * Registration form component with Vietnamese UI and comprehensive validation
 * Handles user registration with email verification workflow
 */
const RegistrationForm: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { register: registerUser, isRegistering, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const password = watch('password');

  /**
   * Handle form submission
   */
  const onSubmit = (data: RegistrationFormData) => {
    registerUser(data);
  };

  /**
   * Get password strength indicator
   */
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      strength,
      label: labels[Math.min(strength - 1, 4)] || '',
      color: colors[Math.min(strength - 1, 4)] || 'bg-gray-300',
    };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Tên người dùng
        </label>
        <div className="mt-1">
          <input
            {...register('username')}
            type="text"
            autoComplete="username"
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              errors.username ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nhập tên người dùng"
          />
          {errors.username && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {errors.username.message}
            </p>
          )}
        </div>
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

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mật khẩu
        </label>
        <div className="mt-1 relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nhập mật khẩu"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Độ mạnh mật khẩu:</span>
              <span className="text-xs text-gray-600">{passwordStrength.label}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {errors.password && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Xác nhận mật khẩu
        </label>
        <div className="mt-1 relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nhập lại mật khẩu"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Registration Error */}
      {registerError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800" role="alert">
            {registerError}
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
          isLoading={isRegistering}
          loadingText="Đang tạo tài khoản..."
          disabled={isRegistering}
        >
          Đăng ký
        </Button>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      {/* Terms Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <Link to="/terms" className="text-primary-600 hover:text-primary-500">
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
            Chính sách bảo mật
          </Link>{' '}
          của GMATHS.
        </p>
      </div>
    </form>
  );
};

export default RegistrationForm; 