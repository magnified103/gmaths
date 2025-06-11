/**
 * Exam Attempts Page
 * Displays all attempts for a specific exam, allowing students to select which attempt results to view
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useExamAttempts } from '../hooks/useGrading';
import { useExam } from '../hooks/useExams';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { ArrowLeftIcon, EyeIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

/**
 * Main ExamAttemptsPage component
 */
export default function ExamAttemptsPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const {
    data: attempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useExamAttempts(examId || '', !!examId);

  const {
    data: exam,
    isLoading: examLoading,
  } = useExam(examId || '');

  /**
   * Format time duration
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
   * Get grade letter based on percentage
   */
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  /**
   * Handle view attempt results
   */
  const handleViewAttempt = (attemptNumber: number) => {
    navigate(`/student/exams/${examId}/attempts/${attemptNumber}/result`);
  };

  /**
   * Handle back to results list
   */
  const handleBackToResults = () => {
    navigate('/student/results');
  };

  /**
   * Handle retake exam
   */
  const handleRetakeExam = () => {
    if (examId) {
      navigate(`/exams/${examId}/take`);
    }
  };

  if (attemptsLoading || examLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" text="Đang tải danh sách lần thi..." />
        </div>
      </Layout>
    );
  }

  if (attemptsError || !attempts) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Không thể tải danh sách lần thi
              </h3>
              <p className="text-red-700 mb-4">
                {attemptsError instanceof Error 
                  ? attemptsError.message 
                  : 'Đã xảy ra lỗi khi tải danh sách lần thi. Vui lòng thử lại sau.'}
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="secondary"
                  onClick={handleBackToResults}
                  icon={<ArrowLeftIcon className="h-4 w-4" />}
                >
                  Quay lại danh sách kết quả
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={handleBackToResults}
                icon={<ArrowLeftIcon className="h-4 w-4" />}
                className="mb-4"
              >
                Quay lại danh sách kết quả
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Danh sách lần thi
              </h1>
              <p className="mt-2 text-gray-600">
                {exam?.title || `Bài thi ${examId}`}
              </p>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={handleRetakeExam}
                className="ml-4"
              >
                Thi lại
              </Button>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        {attempts.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {attempts.map((attempt) => (
                <li key={attempt.attemptNumber}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                #{attempt.attemptNumber}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900">
                                Lần thi #{attempt.attemptNumber}
                              </h3>
                              {attempt.submission && (
                                <div className="ml-3">
                                  {attempt.submission.passed ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>Bắt đầu: {formatDate(attempt.startedAt)}</span>
                              </div>
                              {attempt.completedAt && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  <span>Hoàn thành: {formatDate(attempt.completedAt)}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>Thời gian: {formatTime(attempt.timeSpent)}</span>
                              </div>
                            </div>

                            {attempt.submission && (
                              <div className="mt-2 flex items-center space-x-4">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Điểm số:</span>
                                  <span className={`ml-1 font-semibold ${getGradeColor(attempt.submission.percentage)}`}>
                                    {attempt.submission.score}/{attempt.submission.totalPoints}
                                  </span>
                                  <span className={`ml-1 ${getGradeColor(attempt.submission.percentage)}`}>
                                    ({attempt.submission.percentage.toFixed(1)}% - {getGradeLetter(attempt.submission.percentage)})
                                  </span>
                                </div>
                                {attempt.submission.isAutoSubmit && (
                                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    Nộp tự động
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {attempt.submission ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<EyeIcon className="h-4 w-4" />}
                            onClick={() => handleViewAttempt(attempt.attemptNumber)}
                          >
                            Xem kết quả
                          </Button>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Chưa hoàn thành
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={<ClockIcon className="h-12 w-12 text-gray-400" />}
            title="Chưa có lần thi nào"
            description="Bạn chưa thực hiện lần thi nào cho bài thi này."
            action={{
              label: 'Bắt đầu thi',
              onClick: handleRetakeExam,
              variant: 'primary',
            }}
          />
        )}
      </div>
    </Layout>
  );
} 