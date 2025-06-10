/**
 * Exam results display component
 * Shows detailed exam results with score breakdown and statistics
 */

import React from 'react';
import { useMyExamResults } from '../hooks/useGrading';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

/**
 * Individual question result interface
 */
interface QuestionResult {
  questionId: string;
  questionContent: string;
  questionType: string;
  points: number;
  earnedPoints: number;
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer?: any;
  explanation?: string;
  timeSpent?: number;
}

/**
 * Complete exam result interface
 */
interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // in seconds
  submittedAt: string;
  gradedAt?: string;
  questionResults: QuestionResult[];
  rank?: number;
  totalStudents?: number;
  averageScore?: number;
  highestScore?: number;
}

/**
 * Props for ExamResults component
 */
interface ExamResultsProps {
  result: ExamResult;
  showDetailedAnswers?: boolean;
  showStatistics?: boolean;
  onRetakeExam?: () => void;
  onViewLeaderboard?: () => void;
  onDownloadCertificate?: () => void;
}

/**
 * ExamResults component for displaying comprehensive exam results
 */
export const ExamResults: React.FC<ExamResultsProps> = ({
  result,
  showDetailedAnswers = true,
  showStatistics = true,
  onRetakeExam,
  onViewLeaderboard,
  onDownloadCertificate,
}) => {
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
   * Calculate statistics
   */
  const correctAnswers = result.questionResults.filter(q => q.isCorrect).length;
  const totalQuestions = result.questionResults.length;
  const averageTimePerQuestion = result.timeSpent / totalQuestions;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {result.passed ? (
              <CheckCircleIconSolid className="w-16 h-16 text-green-500" />
            ) : (
              <XCircleIcon className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {result.examTitle}
          </h1>
          
          <div className="text-6xl font-bold mb-2">
            <span className={getGradeColor(result.percentage)}>
              {result.percentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="text-2xl font-semibold mb-4">
            <span className={getGradeColor(result.percentage)}>
              Điểm {getGradeLetter(result.percentage)} - {result.passed ? 'Đạt' : 'Không đạt'}
            </span>
          </div>
          
          <div className="text-lg text-gray-600">
            {result.score} / {result.totalPoints} điểm
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
          <div className="text-sm text-gray-600">Câu đúng</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <XCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
          <div className="text-sm text-gray-600">Câu sai</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <ClockIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{formatTime(result.timeSpent)}</div>
          <div className="text-sm text-gray-600">Thời gian làm bài</div>
        </div>
        
        {result.rank && (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">#{result.rank}</div>
            <div className="text-sm text-gray-600">Xếp hạng</div>
          </div>
        )}
      </div>

      {/* Statistics Section */}
      {showStatistics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2" />
            Thống kê chi tiết
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Kết quả của bạn</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Điểm số:</span>
                  <span className="font-semibold">{result.score}/{result.totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phần trăm:</span>
                  <span className="font-semibold">{result.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian trung bình/câu:</span>
                  <span className="font-semibold">{formatTime(Math.floor(averageTimePerQuestion))}</span>
                </div>
              </div>
            </div>
            
            {result.averageScore !== undefined && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">So sánh với lớp</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Điểm trung bình:</span>
                    <span className="font-semibold">{result.averageScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Điểm cao nhất:</span>
                    <span className="font-semibold">{result.highestScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng số học sinh:</span>
                    <span className="font-semibold">{result.totalStudents}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Thông tin bài thi</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ngày nộp bài:</span>
                  <span className="font-semibold">
                    {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian nộp:</span>
                  <span className="font-semibold">
                    {new Date(result.submittedAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                {result.gradedAt && (
                  <div className="flex justify-between">
                    <span>Ngày chấm điểm:</span>
                    <span className="font-semibold">
                      {new Date(result.gradedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question Results */}
      {showDetailedAnswers && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2" />
            Chi tiết từng câu hỏi
          </h2>
          
          <div className="space-y-4">
            {result.questionResults.map((question, index) => (
              <div 
                key={question.questionId}
                className={`border rounded-lg p-4 ${
                  question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-lg font-semibold mr-3">Câu {index + 1}</span>
                    {question.isCorrect ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {question.earnedPoints}/{question.points} điểm
                    </div>
                    {question.timeSpent && (
                      <div className="text-sm text-gray-600">
                        {formatTime(question.timeSpent)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div 
                  className="text-gray-800 mb-3"
                  dangerouslySetInnerHTML={{ __html: question.questionContent }}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Câu trả lời của bạn:</h4>
                    <div className={`p-2 rounded ${
                      question.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {typeof question.studentAnswer === 'string' 
                        ? question.studentAnswer 
                        : JSON.stringify(question.studentAnswer)
                      }
                    </div>
                  </div>
                  
                  {question.correctAnswer && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Đáp án đúng:</h4>
                      <div className="p-2 rounded bg-green-100">
                        {typeof question.correctAnswer === 'string' 
                          ? question.correctAnswer 
                          : JSON.stringify(question.correctAnswer)
                        }
                      </div>
                    </div>
                  )}
                </div>
                
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-800 mb-1">Giải thích:</h4>
                    <div 
                      className="text-blue-700"
                      dangerouslySetInnerHTML={{ __html: question.explanation }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {onRetakeExam && (
          <button
            onClick={onRetakeExam}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm lại bài thi
          </button>
        )}
        
        {onViewLeaderboard && (
          <button
            onClick={onViewLeaderboard}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Xem bảng xếp hạng
          </button>
        )}
        
        {onDownloadCertificate && result.passed && (
          <button
            onClick={onDownloadCertificate}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Tải chứng chỉ
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced ExamResults component that loads data from API
 */
interface ExamResultsContainerProps {
  examId: string;
  showDetailedAnswers?: boolean;
  showStatistics?: boolean;
  onRetakeExam?: () => void;
  onViewLeaderboard?: () => void;
  onDownloadCertificate?: () => void;
}

export const ExamResultsContainer: React.FC<ExamResultsContainerProps> = ({
  examId,
  ...props
}) => {
  const { data: result, isLoading, error } = useMyExamResults(examId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải kết quả</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải kết quả bài thi'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h2>
          <p className="text-gray-600">Kết quả bài thi không tồn tại hoặc chưa được chấm điểm.</p>
        </div>
      </div>
    );
  }

  return <ExamResults result={result} {...props} />;
}; 