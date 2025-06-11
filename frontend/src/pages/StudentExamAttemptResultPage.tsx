
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, UserIcon, AcademicCapIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/admin/AdminLayout';
import { ExamResults } from '../components/exam/ExamResults';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import { useStudentExamAttemptResults } from '../hooks/useGrading';

/**
 * Admin page for viewing a specific student's exam attempt results
 * Route: /admin/results/exams/:examId/students/:studentId/attempts/:attemptNumber
 */
export default function StudentExamAttemptResultPage() {
  const { examId, studentId, attemptNumber } = useParams<{
    examId: string;
    studentId: string;
    attemptNumber: string;
  }>();
  const navigate = useNavigate();

  const {
    data: result,
    isLoading,
    error
  } = useStudentExamAttemptResults(
    examId || '',
    studentId || '',
    parseInt(attemptNumber || '1'),
    !!(examId && studentId && attemptNumber)
  );

  const handleBackToStudent = () => {
    navigate(`/admin/results/students/${studentId}`);
  };

  const handleBackToExam = () => {
    navigate(`/admin/results/exams/${examId}`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Đang tải kết quả bài thi..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert
            type="error"
            title="Lỗi tải dữ liệu"
            message="Không thể tải kết quả bài thi của học sinh. Vui lòng thử lại sau."
          />
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleBackToStudent}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Quay lại hồ sơ học sinh
            </button>
            <button
              onClick={handleBackToExam}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Quay lại kết quả bài thi
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!result) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert
            type="warning"
            title="Không tìm thấy kết quả"
            message="Không tìm thấy kết quả cho lần thi này."
          />
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleBackToStudent}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Quay lại hồ sơ học sinh
            </button>
            <button
              onClick={handleBackToExam}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Quay lại kết quả bài thi
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link to="/admin/results" className="hover:text-gray-700">
                  Quản lý kết quả
                </Link>
                <span>/</span>
                <Link 
                  to={`/admin/results/exams/${examId}`}
                  className="hover:text-gray-700"
                >
                  {result.examTitle}
                </Link>
                <span>/</span>
                <Link 
                  to={`/admin/results/students/${studentId}`}
                  className="hover:text-gray-700"
                >
                  {result.studentName}
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  Lần thi {attemptNumber}
                </span>
              </nav>
              
              <h1 className="text-3xl font-bold text-gray-900">
                Kết quả chi tiết - Lần thi {attemptNumber}
              </h1>
              <p className="mt-2 text-gray-600">
                Xem chi tiết kết quả lần thi của học sinh
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleBackToStudent}
                className="btn-secondary"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Hồ sơ học sinh
              </button>
              <button
                onClick={handleBackToExam}
                className="btn-secondary"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Tất cả kết quả
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Học sinh</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.studentName}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Điểm số</p>
                <p className={`text-lg font-semibold ${getGradeColor(result.percentage)}`}>
                  {result.score}/{result.totalPoints} ({result.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Thời gian làm bài</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(result.timeSpent)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                result.passed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {result.passed ? '✓' : '✗'}
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Kết quả</p>
                <p className={`text-lg font-semibold ${
                  result.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.passed ? 'Đạt' : 'Không đạt'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attempt Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin lần thi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Lần thi số</p>
              <p className="text-base font-medium text-gray-900">
                {result.attemptNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
              <p className="text-base font-medium text-gray-900">
                {result.attemptStartedAt ? formatDate(result.attemptStartedAt) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Thời gian nộp bài</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(result.submittedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <ExamResults
          result={result}
          showDetailedAnswers={true}
          showStatistics={true}
        />
      </div>
    </AdminLayout>
  );
} 