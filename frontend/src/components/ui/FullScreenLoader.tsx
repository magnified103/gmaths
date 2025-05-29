import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FullScreenLoaderProps {
  message?: string;
  variant?: 'center' | 'page';
  showSpinner?: boolean;
  className?: string;
}

/**
 * Reusable full-screen loader component for consistent loading states
 * across the application
 */
export default function FullScreenLoader({
  message = 'Đang tải...',
  variant = 'center',
  showSpinner = true,
  className = '',
}: FullScreenLoaderProps) {
  const containerClasses = variant === 'page' 
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'min-h-screen flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        {showSpinner && <LoadingSpinner size="lg" />}
        {message && (
          <p className={`text-gray-600 ${showSpinner ? 'mt-4' : ''}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
} 