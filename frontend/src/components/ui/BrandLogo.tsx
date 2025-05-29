import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  variant?: 'default' | 'auth' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

/**
 * Reusable GMATHS brand logo component
 * Uses gnmath.jpg image with fallback to text-based logo
 * Consolidates all logo variations across the application
 */
export default function BrandLogo({
  variant = 'default',
  size = 'md',
  showText = true,
  className = '',
  linkTo = '/',
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-16 h-16',
  };

  const imageSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  // Handle image load error by falling back to text logo
  const handleImageError = () => {
    setImageError(true);
  };

  // Fallback text-based logo (original implementation)
  const textLogo = (
    <div 
      className={`${sizeClasses[size]} ${
        variant === 'auth' 
          ? 'bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg transform hover:scale-105 transition-transform'
          : variant === 'admin'
          ? 'bg-primary-600 rounded-md'
          : 'bg-primary-600 rounded-md'
      } flex items-center justify-center`}
    >
      <span className={`text-white font-bold ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm'
      }`}>
        GM
      </span>
    </div>
  );

  // Image-based logo
  const imageLogo = (
    <img
      src="/gnmath.jpg"
      alt="GMATHS Logo"
      className={`${imageSizeClasses[size]} object-contain ${
        variant === 'auth' 
          ? 'rounded-xl shadow-lg transform hover:scale-105 transition-transform'
          : variant === 'admin'
          ? 'rounded-md'
          : 'rounded-md'
      }`}
      onError={handleImageError}
    />
  );

  const iconContent = (
    <div className="flex items-center space-x-2">
      {/* Use image logo if available, fallback to text logo */}
      {!imageError ? imageLogo : textLogo}
      
      {showText && (
        <div className={variant === 'auth' ? 'text-center' : ''}>
          <span className={`${textSizeClasses[size]} font-bold ${
            variant === 'auth' 
              ? 'bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent'
              : 'text-gray-900'
          }`}>
            GMATHS
          </span>
          {variant === 'auth' && (
            <p className="text-sm text-gray-600 font-medium">Education Platform</p>
          )}
          {variant === 'admin' && (
            <p className="text-xs text-gray-500">Admin</p>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={className}>
        {iconContent}
      </Link>
    );
  }

  return <div className={className}>{iconContent}</div>;
} 