/**
 * ExamEditPage - Edit existing exam interface
 * Provides editing capabilities for existing exams with validation
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ExamForm } from '../components/ExamForm';
import { QuestionSelector } from '../components/QuestionSelector';
import { ExamPreview } from '../components/ExamPreview';
import { useExam, useUpdateExam } from '../hooks/useExams';
import { useQuestions } from '../hooks/useQuestions';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import type { CreateExamRequest, UpdateExamRequest } from '../types/exams';
import type { Question } from '../types/questions';

/**
 * ExamEditPage component with step-by-step exam editing
 */
export default function ExamEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // API hooks
  const { data: exam, isLoading: examLoading, error: examError } = useExam(id!);
  const { data: questionsData } = useQuestions({}, 1, 1000);
  const updateExamMutation = useUpdateExam();

  // State management
  const [currentStep, setCurrentStep] = useState<'form' | 'questions' | 'preview'>('form');
  const [examData, setExamData] = useState<CreateExamRequest | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Initialize exam data when loaded
   */
  useEffect(() => {
    if (exam) {
      const initialData: CreateExamRequest = {
        title: exam.title,
        description: exam.description || '',
        instructions: exam.instructions || '',
        timeLimit: exam.settings.timeLimit,
        maxAttempts: exam.settings.maxAttempts,
        shuffleQuestions: exam.settings.shuffleQuestions,
        shuffleAnswers: exam.settings.shuffleAnswers,
        showResults: exam.settings.showResults,
        showCorrectAnswers: exam.settings.showCorrectAnswers,
        feedbackType: exam.settings.feedbackType,
        navigationType: exam.settings.navigationType,
        allowReview: exam.settings.allowReview,
        requireFullscreen: exam.settings.requireFullscreen,
        preventCopyPaste: exam.settings.preventCopyPaste,
        password: '', // Don't pre-fill password for security
        startDate: exam.settings.startDate ? new Date(exam.settings.startDate).toISOString().slice(0, 16) : '',
        endDate: exam.settings.endDate ? new Date(exam.settings.endDate).toISOString().slice(0, 16) : '',
        questionIds: exam.questions.map(q => q.questionId),
        questionPoints: exam.questions.reduce((acc, q) => {
          if (q.points) {
            acc[q.questionId] = q.points;
          }
          return acc;
        }, {} as Record<string, number>)
      };
      
      setExamData(initialData);
      
      // Update selected questions for preview
      if (questionsData?.questions) {
        const selected = questionsData.questions.filter(q => 
          exam.questions.some(eq => eq.questionId === q.id)
        );
        setSelectedQuestions(selected);
      }
    }
  }, [exam, questionsData]);

  /**
   * Handle exam form submission
   */
  const handleExamSubmit = async (data: CreateExamRequest | UpdateExamRequest) => {
    setExamData(data as CreateExamRequest);
    setHasUnsavedChanges(true);
    setCurrentStep('questions');
  };

  /**
   * Handle question selection changes
   */
  const handleQuestionsChange = (questionIds: string[], questionPoints?: Record<string, number>) => {
    if (!examData) return;
    
    setExamData(prev => prev ? {
      ...prev,
      questionIds,
      questionPoints: questionPoints || {}
    } : null);

    setHasUnsavedChanges(true);

    // Update selected questions for preview
    if (questionsData?.questions) {
      const selected = questionsData.questions.filter(q => questionIds.includes(q.id));
      setSelectedQuestions(selected);
    }
  };

  /**
   * Handle exam update
   */
  const handleUpdateExam = async () => {
    if (!examData || !exam) return;
    
    try {
      const updateData: UpdateExamRequest = {
        id: exam.id,
        ...examData
      };
      
      await updateExamMutation.mutateAsync(updateData);
      setHasUnsavedChanges(false);
      alert('Bài thi đã được cập nhật thành công!');
      navigate('/admin/exams');
    } catch (error) {
      console.error('Error updating exam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật bài thi';
      alert(errorMessage);
    }
  };

  /**
   * Handle navigation with unsaved changes warning
   */
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?');
      if (!confirmed) return;
    }
    navigate(path);
  };

  /**
   * Render step navigation
   */
  const renderStepNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-8">
        <div className={`flex items-center space-x-2 ${
          currentStep === 'form' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'form' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
          }`}>
            1
          </div>
          <span className="font-medium">Thông tin bài thi</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${
          currentStep === 'questions' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'questions' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
          }`}>
            2
          </div>
          <span className="font-medium">Chọn câu hỏi</span>
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
   * Render current step content
   */
  const renderStepContent = () => {
    if (!examData) return null;

    switch (currentStep) {
      case 'form':
        return (
          <div className="max-w-4xl mx-auto">
            <ExamForm
              initialData={{ ...examData, id: exam?.id, status: exam?.status }}
              onSubmit={handleExamSubmit}
              onCancel={() => handleNavigation('/admin/exams')}
              mode="edit"
            />
          </div>
        );
      
      case 'questions':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chọn câu hỏi cho bài thi</h2>
                <p className="text-gray-600 mt-1">
                  Bài thi: <strong>{examData.title}</strong>
                </p>
                {exam?.status === 'PUBLISHED' && (
                  <div className="mt-2">
                    <Alert
                      type="warning"
                      title="Cảnh báo"
                      message="Bài thi đã được xuất bản. Việc thay đổi câu hỏi có thể ảnh hưởng đến học sinh đang làm bài."
                    />
                  </div>
                )}
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
                  onClick={handleUpdateExam}
                  disabled={examData.questionIds.length === 0}
                  isLoading={updateExamMutation.isPending}
                >
                  {hasUnsavedChanges ? 'Lưu thay đổi' : 'Cập nhật bài thi'}
                </Button>
              </div>
            </div>
            
            <QuestionSelector
              selectedQuestions={examData.questionIds}
              onQuestionsChange={handleQuestionsChange}
              maxQuestions={50} // Optional limit
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Loading state
  if (examLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <LoadingSpinner size="lg" text="Đang tải thông tin bài thi..." />
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (examError || !exam) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert
            type="error"
            title="Lỗi tải dữ liệu"
            message="Không thể tải thông tin bài thi. Vui lòng kiểm tra lại."
          />
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/exams')}
              icon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/admin/exams')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài thi</h1>
                <p className="text-gray-600">
                  {exam.title} {hasUnsavedChanges && <span className="text-orange-600">(Có thay đổi chưa lưu)</span>}
                </p>
              </div>
            </div>
            {exam.status === 'PUBLISHED' && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Đã xuất bản
              </div>
            )}
          </div>
          {renderStepNavigation()}
        </div>

        {/* Content */}
        <div className="py-8 px-6">
          {renderStepContent()}
        </div>

        {/* Preview Modal */}
        {showPreview && examData && (
          <ExamPreview
            examData={examData}
            questions={selectedQuestions}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
} 