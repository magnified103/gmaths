// React import removed - using JSX without explicit React reference

interface StatusBadgeProps {
  status: 'admin' | 'student' | 'verified' | 'unverified' | 'active' | 'inactive' | 'success' | 'error' | 'warning' | 'info';
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Reusable status badge component for consistent status indicators
 * throughout the application
 */
export default function StatusBadge({
  status,
  label,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  const statusClasses = {
    admin: 'bg-purple-100 text-purple-800',
    student: 'bg-blue-100 text-blue-800',
    verified: 'bg-green-100 text-green-800',
    unverified: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`
      ${baseClasses}
      ${sizeClasses[size]}
      ${statusClasses[status]}
      ${className}
    `.trim().replace(/\s+/g, ' ')}>
      {label}
    </span>
  );
} 