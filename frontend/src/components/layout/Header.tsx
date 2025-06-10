import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';

/**
 * Header component with Vietnamese navigation and GMATHS branding
 * Provides main navigation for the platform
 */
const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <BrandLogo linkTo="/" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Bảng điều khiển
            </Link>
            <Link
              to="/exams"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Bài kiểm tra
            </Link>
            <Link
              to="/practice"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Luyện tập
            </Link>
            <Link
              to="/results"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Kết quả
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 