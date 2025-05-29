import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: { value: string; label: string }[];
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  disabled?: boolean;
  className?: string;
  register?: (name: string) => object; // For react-hook-form register function
}

/**
 * Reusable form field component with consistent styling and validation display.
 * Supports various input types including password toggle and select dropdown.
 */
export default function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  helpText,
  value,
  onChange,
  options,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  disabled = false,
  className = '',
  register,
}: FormFieldProps) {
  const baseInputClasses = `
    block w-full rounded-md border-gray-300 shadow-sm 
    focus:ring-blue-500 focus:border-blue-500 
    disabled:bg-gray-50 disabled:text-gray-500
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  const inputProps = {
    id,
    placeholder,
    disabled,
    className: baseInputClasses,
    ...(register ? register(id) : { value, onChange }),
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="mt-1 relative">
        {type === 'select' ? (
          <select {...inputProps}>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              {...inputProps}
              type={showPasswordToggle && showPassword ? 'text' : type}
              className={showPasswordToggle ? `${baseInputClasses} pr-10` : baseInputClasses}
            />
            {showPasswordToggle && onTogglePassword && (
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-primary-600 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center">
          <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
} 