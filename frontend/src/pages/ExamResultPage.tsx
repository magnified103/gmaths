/**
 * Individual Exam Result Page
 * Displays detailed results for a specific exam attempt
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useMyExamResults, useExamAttemptResults } from '../hooks/useGrading';
import Layout from '../components/layout/Layout';
import { ExamResults } from '../components/exam/ExamResults';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Main ExamResultPage component
 * Supports both routes:
 * - /student/exams/:examId/result (backwards compatibility - uses latest attempt)
 * - /student/exams/:examId/attempts/:attemptNumber/result (specific attempt)
 */
export default function ExamResultPage() {
  const { examId, attemptNumber } = useParams<{ examId: string; attemptNumber?: string }>();
  const navigate = useNavigate();

  // Use attempt-specific hook if attemptNumber is provided, otherwise get latest attempt
  const {
    data: latestResult,
    isLoading: latestLoading,
    error: latestError,
  } = useMyExamResults(examId || '', !!examId && !attemptNumber);

  const {
    data: attemptResult,
    isLoading: attemptLoading,
    error: attemptError,
  } = useExamAttemptResults(
    examId || '', 
    attemptNumber ? parseInt(attemptNumber, 10) : 0, 
    !!examId && !!attemptNumber
  );

  // Use the appropriate result and loading state
  const result = attemptNumber ? attemptResult : latestResult;
  const resultLoading = attemptNumber ? attemptLoading : latestLoading;
  const resultError = attemptNumber ? attemptError : latestError;

  /**
   * Handle retake exam
   */
  const handleRetakeExam = () => {
    if (examId) {
      navigate(`/exams/${examId}/take`);
    }
  };

  /**
   * Handle view leaderboard
   */
  const handleViewLeaderboard = () => {
    // Navigate to leaderboard page (to be implemented)
    alert('Tính năng xem bảng xếp hạng sẽ được bổ sung trong phiên bản tới.');
  };

  /**
   * Handle download certificate (placeholder)
   */
  const handleDownloadCertificate = () => {
    // TODO: Implement certificate download functionality
    alert('Tính năng tải chứng chỉ sẽ được bổ sung trong phiên bản tới.');
  };

  /**
   * Handle back navigation
   * If viewing specific attempt, go back to attempts list
   * Otherwise go back to main results list
   */
  const handleBackToResults = () => {
    if (attemptNumber) {
      // Coming from specific attempt - go back to attempts list
      navigate(`/student/exams/${examId}/attempts`);
    } else {
      // Coming from main results - go back to results list
      navigate('/student/results');
    }
  };

  if (!examId) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Lỗi</h3>
              <p className="text-red-700">Không tìm thấy ID bài thi.</p>
              <Button
                variant="secondary"
                onClick={handleBackToResults}
                className="mt-4"
              >
                Quay lại danh sách kết quả
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (resultLoading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Đang tải kết quả thi..." />
      </Layout>
    );
  }

  if (resultError || !result) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Không thể tải kết quả thi
              </h3>
              <p className="text-red-700 mb-4">
                {resultError instanceof Error 
                  ? resultError.message 
                  : 'Đã xảy ra lỗi khi tải kết quả thi. Vui lòng thử lại sau.'}
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
        {/* Navigation Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={handleBackToResults}
            className="mb-4"
          >
            Quay lại danh sách kết quả
          </Button>
        </div>

        {/* Exam Results Component */}
        <ExamResults
          result={result}
          showDetailedAnswers={true}
          showStatistics={true}
          onRetakeExam={handleRetakeExam}
          onViewLeaderboard={handleViewLeaderboard}
          onDownloadCertificate={handleDownloadCertificate}
        />
      </div>
    </Layout>
  );
} 