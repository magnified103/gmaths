import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  LockClosedIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useExamAvailability } from '../hooks/useExams';
import type { Exam } from '../types/exams';

interface ExamCardProps {
  exam: Exam;
}

/**
 * ExamCard component for displaying exam information in student list
 * Shows exam details and provides take exam functionality
 */
export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: availability, isLoading: loadingAvailability } = useExamAvailability(exam.id);

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}p`;
    }
    return `${mins} phút`;
  };

  const handleTakeExam = async () => {
    if (loadingAvailability) {
      return;
    }

    if (!availability?.available) {
      return;
    }

    if (availability.requiresPassword) {
      setShowPasswordModal(true);
      return;
    }

    // Navigate directly to exam if no password required
    navigate(`/exams/${exam.id}/take`);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    setPasswordError('');

    // Store password temporarily for ExamInterface to use
    sessionStorage.setItem(`exam-${exam.id}-password`, password.trim());

    // Close modal and reset state
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');

    // Navigate to exam with password stored
    navigate(`/exams/${exam.id}/take`);
  };

  const getAvailabilityStatus = () => {
    if (loadingAvailability) return 'Đang kiểm tra...';
    if (!availability) return 'Không xác định';
    if (!availability.available) return availability.reason || 'Không khả dụng';
    if (availability.requiresPassword) return 'Yêu cầu mật khẩu';
    return 'Sẵn sàng';
  };

  const getStatusColor = () => {
    if (loadingAvailability || !availability) return 'text-gray-500';
    if (!availability.available) return 'text-red-600';
    if (availability.requiresPassword) return 'text-amber-600';
    return 'text-green-600';
  };

  const canTakeExam = availability?.available && !loadingAvailability;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {exam.title}
              </h3>
              {exam.description && (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {exam.description}
                </p>
              )}
            </div>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getAvailabilityStatus()}
            </div>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
              <span>{exam.questionCount} câu hỏi</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span>{formatDuration(exam.settings.timeLimit)}</span>
            </div>
            
            {exam.settings.startDate && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>Bắt đầu: {formatDate(exam.settings.startDate)}</span>
              </div>
            )}
            
            {exam.settings.endDate && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>Kết thúc: {formatDate(exam.settings.endDate)}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          {exam.instructions && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Hướng dẫn:
              </h4>
              <p className="text-sm text-blue-800">
                {exam.instructions}
              </p>
            </div>
          )}

          {/* Settings Info */}
          <div className="flex flex-wrap gap-2 mb-4">
            {exam.settings.password && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                <LockClosedIcon className="w-3 h-3 mr-1" />
                Có mật khẩu
              </span>
            )}
            {exam.settings.maxAttempts > 1 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Tối đa {exam.settings.maxAttempts} lần
              </span>
            )}
            {exam.settings.shuffleQuestions && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Câu hỏi ngẫu nhiên
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Tổng điểm: {exam.totalPoints} điểm
            </div>
            
            <Button
              onClick={handleTakeExam}
              disabled={!canTakeExam}
              variant="primary"
              icon={<PlayIcon className="w-4 h-4" />}
            >
              {loadingAvailability ? 'Đang kiểm tra...' : 'Làm bài thi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordError('');
        }}
        title="Nhập mật khẩu bài thi"
        size="sm"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
            <LockClosedIcon className="w-5 h-5 text-amber-600 mr-2" />
            <p className="text-amber-700 text-sm">
              Bài thi này yêu cầu mật khẩu để truy cập. Vui lòng liên hệ giảng viên để được cấp mật khẩu.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu bài thi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
              disabled={loadingAvailability}
              autoFocus
            />
            {passwordError && (
              <div className="mt-2 flex items-center text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{passwordError}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError('');
              }}
              variant="secondary"
              fullWidth
              disabled={loadingAvailability}
            >
              Hủy
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              variant="primary"
              fullWidth
              isLoading={loadingAvailability}
              disabled={!password.trim()}
            >
              {loadingAvailability ? 'Đang xác thực...' : 'Vào bài thi'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}; 