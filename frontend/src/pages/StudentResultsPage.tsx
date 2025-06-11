/**
 * Student Results Page - Personal exam history and results
 * Displays all exam attempts by the current student with navigation to detailed results
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyResults } from '../hooks/useGrading';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';



/**
 * Stats card component for displaying quick statistics
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {subtitle && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                  {subtitle}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main StudentResultsPage component
 */
export default function StudentResultsPage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: results, isLoading, error } = useMyResults();

  /**
   * Format time duration
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  /**
   * Format date string
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * Get grade color based on percentage
   */
  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Get grade letter
   */
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  /**
   * Sort results based on current sort settings
   */
  const sortedResults = React.useMemo(() => {
    if (!results) return [];

    const sorted = [...results].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.submittedAt).getTime();
          bVal = new Date(b.submittedAt).getTime();
          break;
        case 'score':
          aVal = a.percentage;
          bVal = b.percentage;
          break;
        case 'title':
          aVal = a.examTitle.toLowerCase();
          bVal = b.examTitle.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return sorted;
  }, [results, sortBy, sortOrder]);

  /**
   * Calculate overall statistics
   */
  const stats = React.useMemo(() => {
    if (!results || results.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        passRate: 0,
        totalTimeSpent: 0,
      };
    }

    const totalExams = results.length;
    const averageScore = results.reduce((sum, result) => sum + result.percentage, 0) / totalExams;
    const bestScore = Math.max(...results.map(result => result.percentage));
    const passRate = (results.filter(result => result.passed).length / totalExams) * 100;
    const totalTimeSpent = results.reduce((sum, result) => sum + result.timeSpent, 0);

    return {
      totalExams,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      totalTimeSpent,
    };
  }, [results]);

  /**
   * View detailed results for an exam
   * If there are multiple attempts, navigate to attempts list
   * If there's only one attempt, navigate directly to that attempt's result
   */
  const handleViewResult = (examId: string, attemptNumber: number) => {
    // Check if there are multiple attempts for this exam
    const examAttempts = results?.filter(result => result.examId === examId) || [];
    
    if (examAttempts.length > 1) {
      // Multiple attempts - navigate to attempts list
      navigate(`/student/exams/${examId}/attempts`);
    } else {
      // Single attempt - navigate directly to the attempt result
      navigate(`/student/exams/${examId}/attempts/${attemptNumber}/result`);
    }
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSortBy: 'date' | 'score' | 'title') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Đang tải kết quả thi..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Lỗi tải kết quả thi
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Không thể tải kết quả thi của bạn. Vui lòng thử lại sau.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kết quả thi của tôi</h1>
          <p className="mt-2 text-sm text-gray-600">
            Xem lại các kết quả thi và theo dõi tiến độ học tập của bạn
          </p>
        </div>

        {results && results.length > 0 ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <StatsCard
                title="Tổng số bài thi"
                value={stats.totalExams}
                icon={DocumentTextIcon}
                color="text-blue-600"
              />
              <StatsCard
                title="Điểm trung bình"
                value={`${stats.averageScore}%`}
                icon={ChartBarIcon}
                color="text-green-600"
              />
              <StatsCard
                title="Điểm cao nhất"
                value={`${stats.bestScore}%`}
                icon={TrophyIcon}
                color="text-yellow-600"
              />
              <StatsCard
                title="Tỷ lệ đậu"
                value={`${stats.passRate}%`}
                icon={CheckCircleIcon}
                color="text-green-600"
              />
              <StatsCard
                title="Thời gian làm bài"
                value={formatTime(stats.totalTimeSpent)}
                icon={ClockIcon}
                color="text-purple-600"
              />
            </div>

            {/* Results Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Lịch sử làm bài ({sortedResults.length} bài)
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSortChange('date')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        sortBy === 'date'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ngày thi {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('score')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        sortBy === 'score'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Điểm số {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('title')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        sortBy === 'title'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tên bài thi {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                  </div>
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {sortedResults.map((result) => (
                  <li key={result.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {result.passed ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.examTitle}
                              </p>
                              {results?.filter(r => r.examId === result.examId).length > 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Lần {result.attemptNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(result.submittedAt)}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatTime(result.timeSpent)}
                              </div>
                              {result.isAutoSubmit && (
                                <StatusBadge
                                  status="warning"
                                  label="Tự động nộp"
                                  size="sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getGradeColor(result.percentage)}`}>
                            {getGradeLetter(result.percentage)} ({result.percentage.toFixed(1)}%)
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.score}/{result.totalPoints} điểm
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                          onClick={() => handleViewResult(result.examId, result.attemptNumber)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
            title="Chưa có kết quả thi"
            description="Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu làm bài thi đầu tiên của bạn."
            action={{
              label: 'Xem danh sách bài thi',
              onClick: () => navigate('/student/exams'),
              variant: 'primary',
              icon: <DocumentTextIcon className="h-4 w-4" />,
            }}
          />
        )}
      </div>
    </Layout>
  );
} 