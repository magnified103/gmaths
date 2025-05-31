import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import BrandLogo from '../ui/BrandLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
  badge?: string | number;
}

/**
 * Extensible admin layout component with sidebar navigation for all admin features.
 * Designed to accommodate user management, test creation, post management, and analytics.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const navigation: NavigationItem[] = [
    { 
      name: 'Tổng quan', 
      href: '/admin', 
      icon: HomeIcon, 
      current: location.pathname === '/admin' 
    },
    { 
      name: 'Quản lý người dùng', 
      href: '/admin/users', 
      icon: UsersIcon, 
      current: location.pathname.startsWith('/admin/users') 
    },
    { 
      name: 'Ngân hàng câu hỏi', 
      href: '/admin/questions', 
      icon: AcademicCapIcon, 
      current: location.pathname.startsWith('/admin/questions') 
    },
    { 
      name: 'Quản lý bài kiểm tra', 
      href: '/admin/exams', 
      icon: DocumentTextIcon, 
      current: location.pathname.startsWith('/admin/exams') 
    },
    { 
      name: 'Bài viết & Thông báo', 
      href: '/admin/posts', 
      icon: DocumentTextIcon, 
      current: location.pathname.startsWith('/admin/posts') 
    },
    { 
      name: 'Thống kê & Báo cáo', 
      href: '/admin/analytics', 
      icon: ChartBarIcon, 
      current: location.pathname.startsWith('/admin/analytics') 
    },
    { 
      name: 'Cài đặt hệ thống', 
      href: '/admin/settings', 
      icon: CogIcon, 
      current: location.pathname.startsWith('/admin/settings') 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          {/* Brand */}
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <BrandLogo variant="admin" linkTo="/" />
            </div>

            {/* Navigation */}
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = item.current;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">A</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin</p>
                <Link
                  to="/logout"
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Đăng xuất
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <span className="sr-only">Mở menu</span>
            {/* Mobile menu icon */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 