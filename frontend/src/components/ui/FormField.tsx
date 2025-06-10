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
  register?: any; // More flexible type for react-hook-form register function
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
  const renderInput = () => {
    const baseClasses = `
      w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
      ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    `;

    if (type === 'select' && options) {
      return (
        <select
          id={id}
          className={baseClasses}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...(register ? register(id) : {})}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'password' && showPasswordToggle) {
      return (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id={id}
            className={`${baseClasses} pr-10`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            {...(register ? register(id) : {})}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={onTogglePassword}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      );
    }

    return (
      <input
        type={type}
        id={id}
        className={baseClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...(register ? register(id) : {})}
      />
    );
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
} 