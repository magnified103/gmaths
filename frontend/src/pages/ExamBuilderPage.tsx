/**
 * ExamBuilderPage - Complete exam creation interface
 * Combines exam configuration, question selection, and preview functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExamForm } from '../components/ExamForm';
import { QuestionSelector } from '../components/QuestionSelector';
import { ExamPreview } from '../components/ExamPreview';
import { useQuestions } from '../hooks/useQuestions';
import { useCreateExam } from '../hooks/useExams';
import type { CreateExamRequest, UpdateExamRequest } from '../types/exams';
import type { Question } from '../types/questions';

/**
 * ExamBuilderPage component with step-by-step exam creation
 */
export const ExamBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hooks
  const createExamMutation = useCreateExam();
  
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

  // Fetch questions for preview
  const { data: questionsData } = useQuestions({}, 1, 1000); // Get all questions for selection

  /**
   * Handle exam form submission
   */
  const handleExamSubmit = async (data: CreateExamRequest | UpdateExamRequest) => {
    setExamData(data as CreateExamRequest);
    setCurrentStep('questions');
  };

  /**
   * Handle question selection changes
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
   * Handle final exam creation
   */
  const handleCreateExam = async () => {
    try {
      const result = await createExamMutation.mutateAsync(examData);
      alert('Bài thi đã được tạo thành công!');
      navigate('/admin/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài thi';
      alert(errorMessage);
    }
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
    switch (currentStep) {
      case 'form':
        return (
          <div className="max-w-4xl mx-auto">
            <ExamForm
              initialData={examData}
              onSubmit={handleExamSubmit}
              onCancel={() => navigate('/admin')}
              mode="create"
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
                <button
                  onClick={handleCreateExam}
                  disabled={examData.questionIds.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo bài thi
                </button>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tạo bài thi mới</h1>
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
  );
}; 