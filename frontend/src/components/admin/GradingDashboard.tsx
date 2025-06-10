/**
 * Admin grading dashboard component
 * Provides comprehensive grading management and analytics
 */

import React, { useState } from 'react';
import {
  useGradingDashboardStats,
} from '../../hooks/useGrading';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

/**
 * Statistics card component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Main GradingDashboard component
 */
export const GradingDashboard: React.FC = () => {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // API hooks
  const { data: stats, isLoading: statsLoading, error: statsError } = useGradingDashboardStats();
  // const regradeExam = useRegradeExam(); // For future implementation
  // const exportResults = useExportExamResults(); // For future implementation

  // Future implementation: Exam regrade and export functionality
  // const handleRegrade = async (examId: string) => {
  //   try {
  //     const result = await regradeExam.mutateAsync(examId);
  //     setNotification({
  //       type: 'success',
  //       message: `Đã chấm lại thành công ${result.regradedCount}/${result.totalSubmissions} bài thi`,
  //     });
  //   } catch (error) {
  //     setNotification({
  //       type: 'error',
  //       message: error instanceof Error ? error.message : 'Lỗi khi chấm lại bài thi',
  //     });
  //   }
  // };

  // const handleExport = async (examId: string) => {
  //   try {
  //     await exportResults.mutateAsync(examId);
  //     setNotification({
  //       type: 'success',
  //       message: 'Đã xuất kết quả thành công',
  //     });
  //   } catch (error) {
  //     setNotification({
  //       type: 'error',
  //       message: error instanceof Error ? error.message : 'Lỗi khi xuất kết quả',
  //     });
  //   }
  // };

  /**
   * Clear notification
   */
  const clearNotification = () => {
    setNotification(null);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thống kê chấm điểm...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">
            {statsError instanceof Error ? statsError.message : 'Đã xảy ra lỗi khi tải thống kê'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển chấm điểm</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi quá trình chấm điểm</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm ${
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {notification.message}
            </p>
            <button
              onClick={clearNotification}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng số bài nộp"
            value={stats.totalSubmissions.toLocaleString()}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Đã chấm điểm"
            value={stats.gradedSubmissions.toLocaleString()}
            subtitle={`${((stats.gradedSubmissions / stats.totalSubmissions) * 100).toFixed(1)}%`}
            icon={CheckCircleIcon}
            color="green"
          />
          <StatCard
            title="Chờ chấm điểm"
            value={stats.pendingGrading.toLocaleString()}
            icon={ClockIcon}
            color="yellow"
          />
          <StatCard
            title="Tỷ lệ đạt"
            value={`${stats.passRate.toFixed(1)}%`}
            icon={TrophyIcon}
            color="purple"
          />
        </div>
      )}

      {/* Future: Exam Management Table would go here */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quản lý bài thi</h3>
        <p className="text-gray-600">
          Tính năng quản lý chi tiết từng bài thi sẽ được triển khai trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}; 