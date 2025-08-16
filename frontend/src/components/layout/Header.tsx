import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDownIcon, UserIcon, LogOutIcon } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import { isStaff } from '../../api/auth';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Header component with Vietnamese navigation and GMATHS branding
 * Now authentication-aware with role-based navigation
 */
const Header: React.FC = () => {
  const { user, isAuthenticated, isLoadingUser, logout, isLoggingOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { name: 'Trang chủ', href: '/', current: location.pathname === '/' },
        { name: 'Về chúng tôi', href: '/about', current: location.pathname === '/about' },
        { name: 'Liên hệ', href: '/contact', current: location.pathname === '/contact' },
      ];
    }

    if (isStaff(user)) {
      return [
        { name: 'Bảng điều khiển', href: '/admin', current: location.pathname === '/admin' },
        { name: 'Quản lý người dùng', href: '/admin/users', current: location.pathname === '/admin/users' },
        { name: 'Ngân hàng câu hỏi', href: '/admin/questions', current: location.pathname === '/admin/questions' },
        { name: 'Quản lý bài thi', href: '/admin/exams', current: location.pathname.startsWith('/admin/exams') },
        { name: 'Kết quả thi', href: '/admin/results', current: location.pathname.startsWith('/admin/results') },
      ];
    } else {
      return [
        { name: 'Bảng điều khiển', href: '/student/dashboard', current: location.pathname === '/student/dashboard' },
        { name: 'Bài kiểm tra', href: '/student/exams', current: location.pathname === '/student/exams' },
        { name: 'Luyện tập', href: '/practice', current: location.pathname === '/practice' },
        { name: 'Kết quả', href: '/student/results', current: location.pathname === '/student/results' },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <BrandLogo linkTo="/" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoadingUser ? (
              <div className="w-8 h-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : isAuthenticated && user ? (
              // Authenticated user menu
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden sm:block">{user.username}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs">{user.email}</div>
                      <div className="text-xs capitalize">
                        {isStaff(user) ? 'Quản trị viên' : 'Học sinh'}
                      </div>
                    </div>
                    <Link
                      to={isStaff(user) ? '/admin' : '/student/dashboard'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <LogOutIcon className="w-4 h-4 inline mr-2" />
                      {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Non-authenticated user actions
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
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile user actions */}
              {!isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{user?.username}</div>
                    <div className="text-xs">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header; 