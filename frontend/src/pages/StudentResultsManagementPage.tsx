/**
 * Student Results Management Page
 * Allows admin to view and manage all exam results for a specific student
 * Includes detailed breakdown, performance analytics, and exam history
 */

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useStudentInfoAndStats, useStudentResults } from '../hooks/useGrading';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  joinedAt: string;
  lastActivity: string;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  overallPerformance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}



interface StudentStatistics {
  totalExamsCompleted: number;
  totalExamsAvailable: number;
  averageScore: number;
  averagePercentage: number;
  averageTime: number;
  bestScore: number;
  worstScore: number;
  passRate: number;
  totalTimeSpent: number;
  streakDays: number;
  completionRate: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
}

/**
 * Main Student Results Management component
 */
export default function StudentResultsManagementPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'exam' | 'time' | 'submitted'>('submitted');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch real data using hooks
  const { 
    data: studentInfoData, 
    isLoading: isLoadingInfo, 
    error: infoError 
  } = useStudentInfoAndStats(studentId || '', !!studentId);

  const { 
    data: studentResults, 
    isLoading: isLoadingResults, 
    error: resultsError 
  } = useStudentResults(studentId || '', !!studentId);

  // Convert StudentExamHistory to StudentExamResult format - always call this hook
  const mockResults = useMemo(() => {
    if (!studentResults) return [];
    
    return studentResults.map((result) => ({
      id: result.id,
      examId: result.examId,
      examTitle: result.examTitle,
      score: result.score,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.passed,
      timeSpent: result.timeSpent,
      submittedAt: result.submittedAt,
      gradedAt: result.gradedAt,
      attemptNumber: result.attemptNumber,
      correctAnswers: Math.floor(result.percentage / 100 * 20), // Estimated based on percentage
      totalQuestions: 20, // Default estimate
      isAutoSubmit: result.isAutoSubmit,
      examCategory: 'Chưa phân loại', // Default category
      rank: undefined,
      totalParticipants: undefined
    }));
  }, [studentResults]);

  // Filter and sort results - always call this hook
  const filteredAndSortedResults = useMemo(() => {
    let filtered = mockResults.filter(result => {
      const matchesSearch = result.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'passed' && result.passed) ||
                           (statusFilter === 'failed' && !result.passed);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'exam':
          aValue = a.examTitle;
          bValue = b.examTitle;
          break;
        case 'time':
          aValue = a.timeSpent;
          bValue = b.timeSpent;
          break;
        case 'submitted':
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [mockResults, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle loading states
  if (isLoadingInfo || isLoadingResults) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu học sinh..." />
        </div>
      </AdminLayout>
    );
  }

  // Handle errors
  if (infoError || resultsError) {
    return (
      <AdminLayout>
        <EmptyState
          icon={<XCircleIcon className="w-12 h-12 text-red-500" />}
          title="Lỗi tải dữ liệu"
          description={infoError?.message || resultsError?.message || 'Không thể tải thông tin học sinh'}
          action={{
            label: 'Quay lại danh sách',
            onClick: () => window.history.back(),
            variant: 'secondary'
          }}
        />
      </AdminLayout>
    );
  }

  // Handle case where student is not found
  if (!studentInfoData || !studentResults) {
    return (
      <AdminLayout>
        <EmptyState
          icon={<UserIcon className="w-12 h-12 text-gray-400" />}
          title="Không tìm thấy học sinh"
          description="Học sinh này không tồn tại hoặc bạn không có quyền truy cập"
          action={{
            label: 'Quay lại danh sách',
            onClick: () => window.history.back(),
            variant: 'secondary'
          }}
        />
      </AdminLayout>
    );
  }

  const { studentInfo, statistics: mockStats } = studentInfoData;

  const getPerformanceColor = (performance: StudentInfo['overallPerformance']) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'needs_improvement': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceText = (performance: StudentInfo['overallPerformance']) => {
    switch (performance) {
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Tốt';
      case 'average': return 'Trung bình';
      case 'needs_improvement': return 'Cần cải thiện';
      default: return 'Chưa đánh giá';
    }
  };

  const getTrendIcon = (trend: StudentStatistics['performanceTrend']) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/results"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {studentInfo.name}
                    </h1>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{studentInfo.email}</span>
                      <span>•</span>
                      <span>Mã SV: {studentInfo.studentId}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceColor(studentInfo.overallPerformance)}`}>
                        {getPerformanceText(studentInfo.overallPerformance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bài thi hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStats.totalExamsCompleted}/{mockStats.totalExamsAvailable}
                </p>
                <p className="text-xs text-gray-500">
                  Tỷ lệ: {mockStats.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Điểm trung bình</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStats.averageScore.toFixed(1)}/10
                </p>
                <p className="text-xs text-gray-500">
                  {mockStats.averagePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tỷ lệ đậu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStats.passRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  Cao nhất: {mockStats.bestScore}/10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Thời gian TB</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(mockStats.averageTime)}
                </p>
                <p className="text-xs text-gray-500">
                  Tổng: {formatTime(mockStats.totalTimeSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích hiệu suất</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Xu hướng</h4>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTrendIcon(mockStats.performanceTrend)}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {mockStats.performanceTrend === 'improving' ? 'Đang cải thiện' :
                     mockStats.performanceTrend === 'declining' ? 'Đang giảm' : 'Ổn định'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {mockStats.streakDays} ngày hoạt động liên tiếp
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Điểm mạnh</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hình học</span>
                  <span className="text-sm font-medium text-green-600">8.9/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Đại số</span>
                  <span className="text-sm font-medium text-blue-600">7.8/10</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Cần cải thiện</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Giải tích</span>
                  <span className="text-sm font-medium text-red-600">4.5/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Thời gian làm bài</span>
                  <span className="text-sm font-medium text-yellow-600">Cần nhanh hơn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2 px-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tất cả kết quả</option>
              <option value="passed">Đã đậu</option>
              <option value="failed">Chưa đậu</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="submitted">Ngày nộp</option>
              <option value="score">Điểm số</option>
              <option value="exam">Tên bài thi</option>
              <option value="time">Thời gian làm</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="py-2 px-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Lịch sử thi ({filteredAndSortedResults.length})
              </h3>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Xuất dữ liệu
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài thi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xếp hạng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần thi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {result.examTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.examCategory} • {result.correctAnswers}/{result.totalQuestions} câu đúng
                          {result.isAutoSubmit && <span className="ml-2 text-orange-600">(Tự động nộp)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {result.score}/{result.totalPoints}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        #{result.rank}/{result.totalParticipants}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.rank && result.totalParticipants && 
                          `Top ${Math.round((result.rank / result.totalParticipants) * 100)}%`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(result.timeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.attemptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                      <div className="text-xs text-gray-500">
                        {new Date(result.submittedAt).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.passed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Đậu
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Chưa đậu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/results/exams/${result.examId}/students/${studentId}/attempts/${result.attemptNumber}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="w-4 h-4 inline mr-1" />
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedResults.length === 0 && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có kết quả</h3>
              <p className="mt-1 text-sm text-gray-500">
                Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </div>

        {/* Student Info */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Thông tin học sinh</h2>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Tham gia</p>
              <p className="text-2xl font-bold text-gray-900">{formatDate(studentInfo.joinedAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Hoạt động cuối</p>
              <p className="text-2xl font-bold text-gray-900">{formatDate(studentInfo.lastActivity)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bài thi đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">{studentInfo.completedExams}/{studentInfo.totalExams}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Điểm trung bình</p>
              <p className="text-2xl font-bold text-gray-900">{studentInfo.averageScore}/10</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 