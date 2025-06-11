/**
 * Exam Results Management Page
 * Allows admin to view and manage all student results for a specific exam
 * Includes detailed breakdown, filters, export, and result management
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useExamResultsForExam, useExamInfoAndStats, useExportExamResults } from '../hooks/useGrading';



/**
 * Statistics card component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
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
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
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
 * Main Exam Results Management component
 */
export default function ExamResultsManagementPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'time' | 'submitted'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  // Fetch real data using hooks
  const { 
    data: examInfoData, 
    isLoading: isLoadingInfo, 
    error: infoError 
  } = useExamInfoAndStats(examId || '', !!examId);

  const { 
    data: examResults, 
    isLoading: isLoadingResults, 
    error: resultsError 
  } = useExamResultsForExam(examId || '', !!examId);

  const exportMutation = useExportExamResults();

  // Memoized computations - MUST be called before any early returns
  const filteredAndSortedResults = useMemo(() => {
    // Handle case where data is not loaded yet
    if (!examResults) return [];
    
    let filtered = examResults.filter(result => {
      const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
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
        case 'name':
          aValue = a.studentName;
          bValue = b.studentName;
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
  }, [examResults, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle loading states
  if (isLoadingInfo || isLoadingResults) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu kết quả..." />
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
          description={infoError?.message || resultsError?.message || 'Không thể tải thông tin bài kiểm tra'}
          action={{
            label: 'Quay lại danh sách',
            onClick: () => navigate('/admin/results'),
            variant: 'secondary'
          }}
        />
      </AdminLayout>
    );
  }

  // Handle case where exam is not found
  if (!examInfoData || !examResults) {
    return (
      <AdminLayout>
        <EmptyState
          icon={<DocumentTextIcon className="w-12 h-12 text-gray-400" />}
          title="Không tìm thấy bài kiểm tra"
          description="Bài kiểm tra này không tồn tại hoặc bạn không có quyền truy cập"
          action={{
            label: 'Quay lại danh sách',
            onClick: () => navigate('/admin/results'),
            variant: 'secondary'
          }}
        />
      </AdminLayout>
    );
  }

  const { examInfo, statistics: mockStats } = examInfoData;


  const handleSelectAll = () => {
    if (selectedResults.length === filteredAndSortedResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(filteredAndSortedResults.map(r => r.id));
    }
  };

  const handleSelectResult = (resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    );
  };

  const handleExportSelected = async () => {
    if (!examId) return;
    
    try {
      await exportMutation.mutateAsync(examId);
      // Note: The actual filtering by selected IDs would need to be implemented on the backend
      console.log('Export successful for selected results');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportAll = async () => {
    if (!examId) return;
    
    try {
      await exportMutation.mutateAsync(examId);
      console.log('Export successful for all results');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {examInfo.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý kết quả thi - {mockStats.completedStudents}/{mockStats.totalStudents} học sinh đã hoàn thành
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">{examInfo.totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng điểm</p>
              <p className="text-2xl font-bold text-gray-900">{examInfo.totalPoints}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Điểm đậu</p>
              <p className="text-2xl font-bold text-gray-900">{examInfo.passingScore}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Thời gian</p>
              <p className="text-2xl font-bold text-gray-900">{examInfo.timeLimit} phút</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Học sinh đã hoàn thành"
            value={`${mockStats.completedStudents}/${mockStats.totalStudents}`}
            subtitle={`${((mockStats.completedStudents / mockStats.totalStudents) * 100).toFixed(1)}%`}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Điểm trung bình"
            value={mockStats.averageScore.toFixed(1)}
            subtitle={`${mockStats.averagePercentage.toFixed(1)}%`}
            icon={ChartBarIcon}
            color="green"
          />
          <StatCard
            title="Tỷ lệ đậu"
            value={`${mockStats.passRate.toFixed(1)}%`}
            subtitle={`${Math.round(mockStats.passRate / 100 * mockStats.completedStudents)} học sinh`}
            icon={TrophyIcon}
            color="purple"
          />
          <StatCard
            title="Thời gian TB"
            value={formatTime(Math.round(mockStats.averageTime))}
            subtitle={`Cao nhất: ${mockStats.highestScore} - Thấp nhất: ${mockStats.lowestScore}`}
            icon={ClockIcon}
            color="yellow"
          />
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tất cả</option>
                <option value="passed">Đã đậu</option>
                <option value="failed">Chưa đậu</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="score-desc">Điểm cao nhất</option>
                <option value="score-asc">Điểm thấp nhất</option>
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
                <option value="time-asc">Thời gian ngắn nhất</option>
                <option value="time-desc">Thời gian dài nhất</option>
                <option value="submitted-desc">Nộp mới nhất</option>
                <option value="submitted-asc">Nộp cũ nhất</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedResults.length > 0 && (
                <button
                  onClick={handleExportSelected}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Xuất ({selectedResults.length})
                </button>
              )}
              <button
                onClick={handleExportAll}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Xuất tất cả
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Kết quả chi tiết ({filteredAndSortedResults.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedResults.length === filteredAndSortedResults.length && filteredAndSortedResults.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
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
                    Kết quả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedResults.includes(result.id)}
                        onChange={() => handleSelectResult(result.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {result.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{result.studentName}</div>
                          <div className="text-sm text-gray-500">{result.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(result.percentage)}`}>
                          {result.score}/{examInfo.totalPoints} ({result.percentage}%)
                        </span>
                        {result.rank && result.rank <= 3 && (
                          <TrophyIcon className="w-4 h-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {result.correctAnswers}/{examInfo.totalQuestions} câu đúng
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(result.timeSpent)}
                      {result.isAutoSubmit && (
                        <div className="text-xs text-red-500">Tự động nộp</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Lần {result.attemptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(result.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.passed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Đạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Chưa đạt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/results/exams/${examId}/students/${result.studentId}/attempts/${result.attemptNumber}`}
                        className="text-primary-600 hover:text-primary-900 mr-3"
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
      </div>
    </AdminLayout>
  );
} 