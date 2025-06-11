/**
 * Admin Results Overview Page
 * Provides comprehensive dashboard for viewing and managing all exam results
 * Displays statistics and quick access to detailed per-exam and per-student views
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/admin/AdminLayout';
import { useGradingDashboardStats, useExamSummaries, useStudentSummaries } from '../hooks/useGrading';



/**
 * Statistics card component for admin results dashboard
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
 * Main Admin Results Page component
 */
export default function AdminResultsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'exams' | 'students'>('overview');
  
  // API hooks
  const { data: stats, isLoading: statsLoading, error: statsError } = useGradingDashboardStats();
  const { data: examSummaries, isLoading: examsLoading, error: examsError } = useExamSummaries();
  const { data: studentSummaries, isLoading: studentsLoading, error: studentsError } = useStudentSummaries();

  // Filter data based on search term
  const filteredExams = examSummaries?.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredStudents = studentSummaries?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPerformanceColor = (performance: 'excellent' | 'good' | 'average' | 'needs_improvement') => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'needs_improvement': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceText = (performance: 'excellent' | 'good' | 'average' | 'needs_improvement') => {
    switch (performance) {
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Tốt';
      case 'average': return 'Trung bình';
      case 'needs_improvement': return 'Cần cải thiện';
      default: return 'Chưa đánh giá';
    }
  };

  // Handle loading and error states
  if (statsLoading || examsLoading || studentsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thống kê kết quả...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (statsError || examsError || studentsError) {
    const errorMessage = statsError?.message || examsError?.message || studentsError?.message || 'Đã xảy ra lỗi khi tải dữ liệu';
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý kết quả thi
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Tổng quan và quản lý tất cả kết quả thi trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Tổng quan', icon: ChartBarIcon },
              { key: 'exams', label: 'Theo bài thi', icon: DocumentTextIcon },
              { key: 'students', label: 'Theo học sinh', icon: UserGroupIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`${
                  selectedTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Tổng số bài nộp"
                  value={stats.totalSubmissions.toLocaleString()}
                  icon={DocumentTextIcon}
                  color="blue"
                  trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                  title="Đã chấm điểm"
                  value={stats.gradedSubmissions.toLocaleString()}
                  icon={CheckCircleIcon}
                  color="green"
                  trend={{ value: 8, isPositive: true }}
                />
                <StatCard
                  title="Chờ chấm điểm"
                  value={stats.pendingGrading.toLocaleString()}
                  icon={ClockIcon}
                  color="yellow"
                />
                <StatCard
                  title="Tỷ lệ đậu"
                  value={`${stats.passRate}%`}
                  icon={ArrowTrendingUpIcon}
                  color="purple"
                  trend={{ value: 5.2, isPositive: true }}
                />
              </div>
            )}

            {/* Recent Activity Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hoạt động gần đây</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Bài thi có nhiều kết quả nhất</h4>
                  <div className="space-y-2">
                    {examSummaries?.slice(0, 3).map((exam) => (
                      <div key={exam.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{exam.title}</span>
                        <span className="font-medium">{exam.completedStudents} bài nộp</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Học sinh hoạt động nhiều nhất</h4>
                  <div className="space-y-2">
                    {studentSummaries?.slice(0, 3).map((student) => (
                      <div key={student.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{student.name}</span>
                        <span className="font-medium">{student.completedExams} bài đã làm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {selectedTab === 'exams' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                  Lọc
                </button>
              </div>
            </div>

            {/* Exams List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách bài thi</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <div key={exam.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{exam.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            exam.status === 'active' ? 'bg-green-100 text-green-800' :
                            exam.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {exam.status === 'active' ? 'Đang hoạt động' :
                             exam.status === 'archived' ? 'Đã lưu trữ' : 'Bản nháp'}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Học sinh:</span> {exam.completedStudents}/{exam.totalStudents}
                          </div>
                          <div>
                            <span className="font-medium">Điểm TB:</span> {exam.averageScore.toFixed(1)}
                          </div>
                          <div>
                            <span className="font-medium">Cao nhất:</span> {exam.highestScore.toFixed(1)}
                          </div>
                          <div>
                            <span className="font-medium">Tỷ lệ đậu:</span> {exam.passRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/results/exams/${exam.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </Link>
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          Xuất dữ liệu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {selectedTab === 'students' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm học sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                  Lọc
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách học sinh</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceColor(student.overallPerformance)}`}>
                            {getPerformanceText(student.overallPerformance)}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Bài thi:</span> {student.completedExams}/{student.totalExams}
                          </div>
                          <div>
                            <span className="font-medium">Điểm TB:</span> {student.averageScore.toFixed(1)}
                          </div>
                          <div>
                            <span className="font-medium">Hoạt động cuối:</span> {new Date(student.lastActivity).toLocaleDateString('vi-VN')}
                          </div>
                          <div>
                            <span className="font-medium">Tỷ lệ hoàn thành:</span> {((student.completedExams / student.totalExams) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/results/students/${student.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 