/**
 * Admin dashboard overview page
 * Displays system statistics and provides quick access to admin features
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/admin/AdminLayout';
import { useAdminDashboardStats } from '../hooks/useAdmin';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href?: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

/**
 * Admin dashboard overview component.
 * Provides system statistics and quick access to admin features.
 */
export default function AdminDashboard() {
  // Fetch real dashboard statistics
  const { data: dashboardStats, isLoading, error } = useAdminDashboardStats();

  // Handle loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Đang tải thống kê..." />
        </div>
      </AdminLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Không thể tải thống kê
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Có lỗi xảy ra khi tải dữ liệu thống kê. Vui lòng thử lại.</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Create stats array with real data
  const stats: StatCard[] = [
    {
      title: 'Tổng người dùng',
      value: dashboardStats?.totalUsers?.toLocaleString() || '0',
      change: '',
      changeType: 'neutral',
      icon: UsersIcon,
      href: '/admin/users',
    },
    {
      title: 'Câu hỏi trong ngân hàng',
      value: dashboardStats?.totalQuestions?.toLocaleString() || '0',
      change: '',
      changeType: 'neutral',
      icon: AcademicCapIcon,
      href: '/admin/questions',
    },
    {
      title: 'Bài kiểm tra',
      value: dashboardStats?.totalExams?.toLocaleString() || '0',
      change: '',
      changeType: 'neutral',
      icon: DocumentTextIcon,
      href: '/admin/exams',
    },
    {
      title: 'Lượt thi trong tháng',
      value: dashboardStats?.totalSubmissions?.toLocaleString() || '0',
      change: '',
      changeType: 'neutral',
      icon: ChartBarIcon,
      href: '/admin/results',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Thêm người dùng mới',
      description: 'Tạo tài khoản cho học sinh hoặc giáo viên',
      href: '/admin/users',
      icon: PlusIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Tạo câu hỏi',
      description: 'Thêm câu hỏi mới vào ngân hàng đề thi',
      href: '/admin/questions',
      icon: AcademicCapIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Tạo bài kiểm tra',
      description: 'Thiết lập bài kiểm tra mới từ ngân hàng câu hỏi',
      href: '/admin/exams/create',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Xem báo cáo',
      description: 'Thống kê và phân tích kết quả học tập',
      href: '/admin/analytics',
      icon: EyeIcon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Tổng quan hệ thống
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Dashboard quản trị nền tảng GMATHS Education
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <dt>
                <div className="absolute bg-primary-500 rounded-md p-3">
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {stat.title}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase'
                        ? 'text-green-600'
                        : stat.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {stat.change}
                  </p>
                )}
                {stat.href && (
                  <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link
                        to={stat.href}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Xem chi tiết
                        <span className="sr-only"> {stat.title}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </dd>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div>
                  <span
                    className={`rounded-lg inline-flex p-3 ${action.color} text-white`}
                  >
                    <action.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity - Placeholder for future implementation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Hoạt động gần đây
            </h3>
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tính năng theo dõi hoạt động sẽ được triển khai trong phiên bản tiếp theo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 