/**
 * ExamForm component for creating and editing exams
 * Provides comprehensive exam configuration with Vietnamese UI
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Settings, Eye, Lock, Shield } from 'lucide-react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { 
  CreateExamRequest, 
  UpdateExamRequest, 
  ExamSettings, 
  FeedbackType, 
  NavigationType,
  ExamStatus 
} from '../types/exams';

interface ExamFormProps {
  initialData?: Partial<CreateExamRequest & { id: string; status: ExamStatus }>;
  onSubmit: (data: CreateExamRequest | UpdateExamRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

/**
 * ExamForm component with comprehensive configuration options
 */
export const ExamForm: React.FC<ExamFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create'
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateExamRequest>({
    title: '',
    description: '',
    instructions: '',
    timeLimit: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResults: true,
    showCorrectAnswers: false,
    feedbackType: 'AFTER_EXAM' as FeedbackType,
    navigationType: 'FREE' as NavigationType,
    allowReview: true,
    requireFullscreen: false,
    preventCopyPaste: false,
    password: '',
    startDate: '',
    endDate: '',
    questionIds: [],
    questionPoints: {},
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Format date for input fields
  useEffect(() => {
    if (initialData?.startDate && !formData.startDate) {
      const date = new Date(initialData.startDate);
      setFormData(prev => ({
        ...prev,
        startDate: date.toISOString().slice(0, 16)
      }));
    }
    if (initialData?.endDate && !formData.endDate) {
      const date = new Date(initialData.endDate);
      setFormData(prev => ({
        ...prev,
        endDate: date.toISOString().slice(0, 16)
      }));
    }
  }, [initialData]);

  /**
   * Handle input changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề bài thi là bắt buộc';
    }

    if (formData.timeLimit <= 0) {
      newErrors.timeLimit = 'Thời gian thi phải lớn hơn 0';
    }

    if (formData.maxAttempts <= 0) {
      newErrors.maxAttempts = 'Số lần thi phải lớn hơn 0';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        newErrors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    // Only validate questions for edit mode, not create mode (questions selected in step 2)
    if (mode === 'edit' && formData.questionIds.length === 0) {
      newErrors.questions = 'Phải chọn ít nhất một câu hỏi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'edit' && initialData?.id) {
        await onSubmit({
          ...formData,
          id: initialData.id
        } as UpdateExamRequest);
      } else {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-blue-600" />
          Thông tin cơ bản
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề bài thi *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập tiêu đề bài thi"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả về bài thi này"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hướng dẫn làm bài
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hướng dẫn chi tiết cho học sinh về cách làm bài thi"
            />
          </div>
        </div>
      </div>

      {/* Exam Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Cài đặt bài thi
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian làm bài (phút) *
            </label>
            <input
              type="number"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.timeLimit ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.timeLimit && (
              <p className="mt-1 text-sm text-red-600">{errors.timeLimit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần thi tối đa *
            </label>
            <input
              type="number"
              name="maxAttempts"
              value={formData.maxAttempts}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxAttempts ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.maxAttempts && (
              <p className="mt-1 text-sm text-red-600">{errors.maxAttempts}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hiển thị kết quả
            </label>
            <select
              name="feedbackType"
              value={formData.feedbackType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="IMMEDIATE">Ngay lập tức</option>
              <option value="AFTER_EXAM">Sau khi thi xong</option>
              <option value="NEVER">Không hiển thị</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kiểu điều hướng
            </label>
            <select
              name="navigationType"
              value={formData.navigationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FREE">Tự do</option>
              <option value="LINEAR">Tuần tự</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="shuffleQuestions"
              checked={formData.shuffleQuestions}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Xáo trộn câu hỏi</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="shuffleAnswers"
              checked={formData.shuffleAnswers}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Xáo trộn đáp án</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="showResults"
              checked={formData.showResults}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Hiển thị điểm số</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="showCorrectAnswers"
              checked={formData.showCorrectAnswers}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Hiển thị đáp án đúng</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="allowReview"
              checked={formData.allowReview}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Cho phép xem lại</span>
          </label>
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
          Lập lịch thi
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian bắt đầu
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian kết thúc
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-600" />
            Cài đặt bảo mật
          </h3>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Ẩn bớt' : 'Hiển thị thêm'}
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu bài thi (tùy chọn)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Để trống nếu không cần mật khẩu"
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireFullscreen"
                  checked={formData.requireFullscreen}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Yêu cầu toàn màn hình</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="preventCopyPaste"
                  checked={formData.preventCopyPaste}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Chặn sao chép/dán</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Question Selection Status - Only show in edit mode */}
      {mode === 'edit' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {formData.questionIds.length} câu hỏi
            </span>
          </div>
          {errors.questions && (
            <p className="mt-1 text-sm text-red-600">{errors.questions}</p>
          )}
        </div>
      )}

      {/* Next Step Info - Only show in create mode */}
      {mode === 'create' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Bước tiếp theo: Chọn câu hỏi cho bài thi
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-700">
            Sau khi hoàn thành thông tin cơ bản, bạn sẽ chọn câu hỏi từ ngân hàng câu hỏi
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Hủy
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang lưu...
            </>
          ) : (
            <>
              {mode === 'create' ? (
                <>
                  Tiếp tục đến chọn câu hỏi
                  <ChevronRightIcon className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Cập nhật bài thi'
              )}
            </>
          )}
        </button>
      </div>
    </form>
  );
}; 