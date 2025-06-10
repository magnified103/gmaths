import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  BookOpenIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ExamCard } from '../components/ExamCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useTakeableExams } from '../hooks/useExams';
import type { ExamFilters } from '../types/exams';

/**
 * Student exam list page - displays all available exams for students to take
 * Includes search, filtering, and easy access to exam taking
 */
export default function StudentExamListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExamFilters>({
    sortBy: 'startDate',
    sortOrder: 'asc',
  });

  const {
    data: examResponse,
    isLoading,
    error,
    refetch,
  } = useTakeableExams({
    ...filters,
    search: searchTerm,
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key: keyof ExamFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const exams = examResponse?.exams || [];
  const hasExams = exams.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center py-4 text-sm text-gray-500">
            <Link 
              to="/student/dashboard" 
              className="flex items-center hover:text-gray-700 transition-colors"
            >
              <HomeIcon className="w-4 h-4 mr-1" />
              Bảng điều khiển
            </Link>
            <ChevronRightIcon className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Danh sách bài thi</span>
          </div>
          
          {/* Page Header */}
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Danh sách bài thi
                </h1>
                <p className="mt-2 text-gray-600">
                  Chọn bài thi để bắt đầu làm bài
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  to="/student/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Quay về dashboard
                </Link>
                {hasExams && (
                  <div className="text-sm text-gray-500">
                    {exams.length} bài thi khả dụng
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm kiếm bài thi..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Toggle and Sort */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Bộ lọc
              </button>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="startDate-asc">Ngày bắt đầu (Gần nhất)</option>
                <option value="startDate-desc">Ngày bắt đầu (Xa nhất)</option>
                <option value="title-asc">Tên A-Z</option>
                <option value="title-desc">Tên Z-A</option>
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu từ
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc đến
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({
                        sortBy: 'startDate',
                        sortOrder: 'asc',
                      });
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Đang tải danh sách bài thi..." />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              Có lỗi xảy ra khi tải danh sách bài thi
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : !hasExams ? (
          <EmptyState
            icon={<BookOpenIcon className="w-16 h-16 text-gray-400" />}
            title="Chưa có bài thi nào"
            description="Hiện tại chưa có bài thi nào khả dụng. Vui lòng quay lại sau hoặc liên hệ với giáo viên."
            action={{
              label: 'Quay về dashboard',
              onClick: () => window.location.href = '/student/dashboard',
              variant: 'primary',
              icon: <HomeIcon className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {hasExams && (
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <BookOpenIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {exams.length}
                  </div>
                  <div className="text-sm text-gray-600">Bài thi khả dụng</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(
                      exams.reduce((acc, exam) => acc + exam.settings.timeLimit, 0) / exams.length || 0
                    )} phút
                  </div>
                  <div className="text-sm text-gray-600">Thời gian trung bình</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <BookOpenIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(
                      exams.reduce((acc, exam) => acc + exam.totalPoints, 0) / exams.length || 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Điểm số trung bình</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 