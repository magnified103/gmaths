import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Authentication layout component with GMATHS branding
 * Provides consistent layout for login, registration, and password reset pages
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* GMATHS Logo and Branding */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <BrandLogo variant="auth" size="lg" linkTo="/" />
        </div>
        
        {/* Page Title */}
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        
        {/* Subtitle if provided */}
        {subtitle && (
          <p className="text-center text-sm text-gray-600 mb-8">
            {subtitle}
          </p>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-gray-100 backdrop-blur-sm">
          {children}
        </div>
      </div>

      {/* Footer link back to home */}
      <div className="text-center mt-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại trang chủ
        </Link>
      </div>
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>
    </div>
  );
};

export default AuthLayout; 