/**
 * ExamPreview component for showing how the exam will appear to students
 * Provides a read-only preview of the exam structure and questions
 */

import React from 'react';
import { Clock, FileText, Users, Eye, AlertCircle } from 'lucide-react';
import type { CreateExamRequest, ExamPreview as ExamPreviewData } from '../types/exams';
import type { Question, MultipleChoiceQuestion, MultipleSelectQuestion, FillBlankQuestion, EssayQuestion } from '../types/questions';

interface ExamPreviewProps {
  examData: CreateExamRequest;
  questions: Question[];
  onClose: () => void;
}

/**
 * ExamPreview component with student view simulation
 */
export const ExamPreview: React.FC<ExamPreviewProps> = ({
  examData,
  questions,
  onClose
}) => {
  // Calculate exam statistics
  const totalPoints = questions.reduce((sum, question) => {
    const customPoints = examData.questionPoints?.[question.id];
    return sum + (customPoints || question.points);
  }, 0);

  const estimatedDuration = Math.max(examData.timeLimit, questions.length * 2); // At least 2 minutes per question

  /**
   * Render question preview based on type
   */
  const renderQuestionPreview = (question: Question, index: number) => {
    const customPoints = examData.questionPoints?.[question.id] || question.points;

    return (
      <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {index + 1}
            </span>
            <div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                question.difficulty === 'easy'
                  ? 'bg-green-100 text-green-800'
                  : question.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {question.difficulty === 'easy' ? 'Dễ' : question.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {customPoints} điểm
          </div>
        </div>

        {/* Question Content */}
        <div className="mb-4">
          <div className="text-gray-900 leading-relaxed">
            {question.content.includes('$') ? (
              <div className="math-content">
                {/* LaTeX content would be rendered here */}
                {question.content.replace(/\$([^$]+)\$/g, '[$1]')}
              </div>
            ) : (
              question.content
            )}
          </div>
        </div>

        {/* Question Type Specific Preview */}
        {question.type === 'multiple-choice' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Chọn một đáp án đúng:</p>
            {(question as MultipleChoiceQuestion).options?.map((option, optIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  disabled
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {String.fromCharCode(65 + optIndex)}. {option.text}
                </span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'multiple-select' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Chọn tất cả đáp án đúng:</p>
            {(question as MultipleSelectQuestion).options?.map((option, optIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {String.fromCharCode(65 + optIndex)}. {option.text}
                </span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Chọn Đúng hoặc Sai:</p>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name={`question-${question.id}`} disabled className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Đúng</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name={`question-${question.id}`} disabled className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Sai</span>
              </label>
            </div>
          </div>
        )}

        {question.type === 'fill-blank' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Điền vào chỗ trống:</p>
            <div className="space-y-2">
              {(question as FillBlankQuestion).blanks?.map((blank, blankIndex) => (
                <div key={blank.id} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Chỗ trống {blankIndex + 1}:</span>
                  <input
                    type="text"
                    disabled
                    placeholder={blank.placeholder || 'Nhập câu trả lời...'}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'essay' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Câu trả lời tự luận:</p>
            <textarea
              disabled
              rows={4}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
            />
            {(question as EssayQuestion).maxWords && (
              <p className="text-xs text-gray-500">
                Tối đa {(question as EssayQuestion).maxWords} từ
              </p>
            )}
          </div>
        )}

        {/* Question Explanation (if available) */}
        {question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Giải thích:</strong> {question.explanation}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Xem trước bài thi</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Exam Info */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{examData.title}</h1>
          {examData.description && (
            <p className="text-gray-700 mb-3">{examData.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-gray-700">
                Thời gian: <strong>{examData.timeLimit} phút</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">
                Tổng điểm: <strong>{totalPoints} điểm</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-gray-700">
                Số câu: <strong>{questions.length} câu hỏi</strong>
              </span>
            </div>
          </div>

          {examData.instructions && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Hướng dẫn làm bài:</p>
                  <p className="text-sm text-yellow-700 mt-1">{examData.instructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có câu hỏi nào được chọn</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => renderQuestionPreview(question, index))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Đây là bản xem trước. Học sinh sẽ thấy giao diện tương tự khi làm bài thi.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 