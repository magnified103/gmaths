/**
 * ExamBuilderPage - Complete exam creation interface
 * Combines exam configuration, question selection, and preview functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ExamForm } from '../components/exam/ExamForm';
import { QuestionSelector } from '../components/question/QuestionSelector';
import { ExamPreview } from '../components/exam/ExamPreview';
import { useQuestions } from '../hooks/useQuestions';
import { useCreateExam } from '../hooks/useExams';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import type { CreateExamRequest, UpdateExamRequest } from '../types/exams';
import type { Question } from '../types/questions';

/**
 * ExamBuilderPage component with step-by-step exam creation
 */
export const ExamBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hooks
  const createExamMutation = useCreateExam();
  const { data: questionsData, isLoading: questionsLoading, error: questionsError } = useQuestions({}, 1, 1000);
  
  // State management
  const [currentStep, setCurrentStep] = useState<'form' | 'questions' | 'preview'>('form');
  const [examData, setExamData] = useState<CreateExamRequest>({
    title: '',
    description: '',
    instructions: '',
    timeLimit: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResults: true,
    showCorrectAnswers: false,
    feedbackType: 'AFTER_EXAM',
    navigationType: 'FREE',
    allowReview: true,
    requireFullscreen: false,
    preventCopyPaste: false,
    password: '',
    startDate: '',
    endDate: '',
    questionIds: [],
    questionPoints: {}
  });
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handle exam form submission with validation
   */
  const handleExamSubmit = async (data: CreateExamRequest | UpdateExamRequest) => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate exam data
    const errors: Record<string, string> = {};
    
    if (!data.title?.trim()) {
      errors.title = 'Tên bài thi không được để trống';
    }
    
    if (!data.timeLimit || data.timeLimit <= 0) {
      errors.timeLimit = 'Thời gian làm bài phải lớn hơn 0';
    }
    
    if (!data.maxAttempts || data.maxAttempts <= 0) {
      errors.maxAttempts = 'Số lần làm bài phải lớn hơn 0';
    }
    
    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.dateRange = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setExamData(data as CreateExamRequest);
    setCurrentStep('questions');
  };

  /**
   * Handle question selection changes with validation
   */
  const handleQuestionsChange = (questionIds: string[], questionPoints?: Record<string, number>) => {
    setExamData(prev => ({
      ...prev,
      questionIds,
      questionPoints: questionPoints || {}
    }));

    // Update selected questions for preview
    if (questionsData?.questions) {
      const selected = questionsData.questions.filter(q => questionIds.includes(q.id));
      setSelectedQuestions(selected);
    }
  };

  /**
   * Handle final exam creation with comprehensive error handling
   */
  const handleCreateExam = async () => {
    if (examData.questionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi cho bài thi');
      return;
    }
    
    try {
      await createExamMutation.mutateAsync(examData);
      alert('Bài thi đã được tạo thành công!');
      navigate('/admin/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài thi';
      alert(errorMessage);
    }
  };

  /**
   * Handle navigation with confirmation
   */
  const handleNavigation = (path: string) => {
    if (examData.title || examData.questionIds.length > 0) {
      const confirmed = window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?');
      if (!confirmed) return;
    }
    navigate(path);
  };

  /**
   * Render step navigation with progress indicators
   */
  const renderStepNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-8">
        <div className={`flex items-center space-x-2 ${
          currentStep === 'form' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'form' ? 'bg-blue-100 text-blue-600' : 
            examData.title ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {examData.title ? '✓' : '1'}
          </div>
          <span className="font-medium">Thông tin bài thi</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${
          currentStep === 'questions' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'questions' ? 'bg-blue-100 text-blue-600' : 
            examData.questionIds.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {examData.questionIds.length > 0 ? '✓' : '2'}
          </div>
          <span className="font-medium">Chọn câu hỏi</span>
          {examData.questionIds.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {examData.questionIds.length} câu
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-500">
            3
          </div>
          <span className="font-medium">Hoàn thành</span>
        </div>
      </div>
    </div>
  );

  /**
   * Render current step content with loading and error states
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'form':
        return (
          <div className="max-w-4xl mx-auto">
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-6">
                <Alert
                  type="error"
                  title="Vui lòng kiểm tra lại thông tin"
                  message="Có một số lỗi trong form cần được sửa"
                />
              </div>
            )}
            <ExamForm
              initialData={examData}
              onSubmit={handleExamSubmit}
              onCancel={() => handleNavigation('/admin')}
              mode="create"
            />
          </div>
        );
      
      case 'questions':
        if (questionsLoading) {
          return (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Đang tải danh sách câu hỏi..." />
            </div>
          );
        }

        if (questionsError) {
          return (
            <div className="max-w-4xl mx-auto">
              <Alert
                type="error"
                title="Lỗi tải dữ liệu"
                message="Không thể tải danh sách câu hỏi. Vui lòng thử lại."
              />
              <div className="mt-4 flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep('form')}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          );
        }

        if (!questionsData?.questions?.length) {
          return (
            <div className="max-w-4xl mx-auto">
              <Alert
                type="warning"
                title="Chưa có câu hỏi nào"
                message="Bạn cần tạo câu hỏi trước khi có thể tạo bài thi."
              />
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Hướng dẫn tạo bài thi
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tạo câu hỏi trước</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Bạn cần có ít nhất một câu hỏi trong ngân hàng câu hỏi để tạo bài thi.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Quay lại tạo bài thi</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Sau khi có câu hỏi, bạn có thể quay lại đây để tạo bài thi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep('form')}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={() => navigate('/admin/questions')}
                >
                  Tạo câu hỏi ngay
                </Button>
              </div>
            </div>
          );
        }
        
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chọn câu hỏi cho bài thi</h2>
                <p className="text-gray-600 mt-1">
                  Bài thi: <strong>{examData.title}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Đã chọn {examData.questionIds.length} câu hỏi từ {questionsData.questions.length} câu có sẵn
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={examData.questionIds.length === 0}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xem trước
                </button>
                <button
                  onClick={() => setCurrentStep('form')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <Button
                  onClick={handleCreateExam}
                  disabled={examData.questionIds.length === 0 || createExamMutation.isPending}
                  isLoading={createExamMutation.isPending}
                  loadingText="Đang tạo bài thi..."
                >
                  Tạo bài thi
                </Button>
              </div>
            </div>
            
            <QuestionSelector
              selectedQuestions={examData.questionIds}
              onQuestionsChange={handleQuestionsChange}
              maxQuestions={50}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-6 py-4 flex items-center space-x-4">
            <button
              onClick={() => handleNavigation('/admin')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo bài thi mới</h1>
              <p className="text-gray-600">
                Tạo bài thi trắc nghiệm với câu hỏi và cài đặt tùy chỉnh
              </p>
            </div>
          </div>
          {renderStepNavigation()}
        </div>

        {/* Content */}
        <div className="py-8 px-6">
          {renderStepContent()}
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <ExamPreview
            examData={examData}
            questions={selectedQuestions}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}; 