import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useTakeableExams } from '../hooks/useExams';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface QuickStatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

/**
 * Student dashboard providing overview of available exams and quick actions
 * Serves as the main landing page for students after login
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  
  // Fetch available exams for dashboard preview
  const { data: examResponse, isLoading: loadingExams } = useTakeableExams({
    sortBy: 'startDate',
    sortOrder: 'asc',
  }, true);

  const exams = examResponse?.exams || [];
  const upcomingExams = exams.slice(0, 3); // Show first 3 upcoming exams
  
  // Quick stats for student
  const quickStats: QuickStatCard[] = [
    {
      title: 'Bài thi khả dụng',
      value: exams.length,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Sắp diễn ra',
      value: upcomingExams.length,
      icon: ClockIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Tổng điểm tích lũy',
      value: '0', // This would come from a user stats API
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Lần thi gần nhất',
      value: 'Chưa có', // This would come from user history
      icon: ChartBarIcon,
      color: 'bg-orange-500',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Xem tất cả bài thi',
      description: 'Duyệt qua danh sách đầy đủ các bài thi có sẵn',
      href: '/student/exams',
      icon: BookOpenIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Xem kết quả',
      description: 'Kiểm tra kết quả và lịch sử làm bài',
      href: '/student/results',
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Thông báo',
      description: 'Xem thông báo và tin tức từ giáo viên',
      href: '/student/announcements',
      icon: CalendarIcon,
      color: 'bg-purple-500',
    },
  ];

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Xin chào, {user?.username}!
          </h1>
          <p className="mt-2 text-gray-600">
            Chào mừng bạn trở lại nền tảng học tập GMATHS
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Exams */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Bài thi sắp diễn ra
                  </h2>
                  <Link
                    to="/student/exams"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Xem tất cả
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {loadingExams ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Đang tải..." />
                  </div>
                ) : upcomingExams.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {exam.title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {exam.settings.timeLimit} phút
                            </span>
                            <span className="flex items-center">
                              <BookOpenIcon className="w-4 h-4 mr-1" />
                              {exam.questionCount} câu
                            </span>
                            {exam.settings.startDate && (
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {formatDate(exam.settings.startDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/exams/${exam.id}/take`}
                          className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Làm bài
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Hiện tại chưa có bài thi nào</p>
                    <Link
                      to="/student/exams"
                      className="mt-2 text-blue-600 hover:text-blue-500"
                    >
                      Khám phá các bài thi khác
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Thao tác nhanh
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.title}
                      to={action.href}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md ${action.color} group-hover:opacity-90`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 group-hover:text-gray-700">
                            {action.title}
                          </p>
                          <p className="text-sm text-gray-500 group-hover:text-gray-600">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Hoạt động gần đây
                </h2>
              </div>
              
              <div className="p-6">
                <div className="text-center py-4">
                  <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chưa có hoạt động nào</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 