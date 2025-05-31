import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import { RichTextDisplay } from './RichTextDisplay';
import type { Question, Difficulty } from '../types/questions';
import { 
  getQuestionTypeText, 
  getDifficultyInfo, 
  getCategoryText,
  getOptionLabel 
} from '../utils/questionUtils';

interface QuestionPreviewProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Question preview modal component
 * Displays question content with proper math rendering and answer options
 */
export default function QuestionPreview({ question, isOpen, onClose }: QuestionPreviewProps) {
  if (!question) return null;

  /**
   * Render question options based on type
   */
  const renderQuestionOptions = () => {
    switch (question.type) {
      case 'multiple-choice':
      case 'multiple-select':
        const mcQuestion = question as any;
        if (!mcQuestion.options) return null;
        
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Các lựa chọn:</h4>
            <div className="space-y-2">
              {mcQuestion.options.map((option: any, index: number) => (
                <div 
                  key={option.id || index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    option.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs font-medium">
                    {getOptionLabel(index)}
                  </span>
                  <div className="flex-1">
                    <RichTextDisplay content={option.text} />
                    {option.isCorrect && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Đáp án đúng
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        const tfQuestion = question as any;
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Đáp án:</h4>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-green-800 font-medium">
                {tfQuestion.correctAnswer ? 'Đúng' : 'Sai'}
              </span>
            </div>
          </div>
        );

      case 'fill-blank':
        const fbQuestion = question as any;
        if (!fbQuestion.blanks) return null;
        
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Đáp án điền khuyết:</h4>
            <div className="space-y-2">
              {fbQuestion.blanks.map((blank: any, index: number) => (
                <div key={blank.id || index} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-sm">
                    <span className="font-medium">Vị trí {blank.position + 1}:</span>
                    <div className="mt-1">
                      {blank.acceptedAnswers.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'essay':
        const essayQuestion = question as any;
        return (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Thông tin bài tự luận:</h4>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
              {essayQuestion.minWords && (
                <div className="text-sm">
                  <span className="font-medium">Số từ tối thiểu:</span> {essayQuestion.minWords}
                </div>
              )}
              {essayQuestion.maxWords && (
                <div className="text-sm">
                  <span className="font-medium">Số từ tối đa:</span> {essayQuestion.maxWords}
                </div>
              )}
              {essayQuestion.rubric && (
                <div className="text-sm">
                  <span className="font-medium">Rubric:</span>
                  <div className="mt-1">
                    <RichTextDisplay content={essayQuestion.rubric} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const difficultyInfo = getDifficultyInfo(question.difficulty);

  const modalFooter = (
    <Button
      type="button"
      variant="secondary"
      onClick={onClose}
    >
      Đóng
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước câu hỏi"
      size="xl"
      footer={modalFooter}
    >
      <div className="space-y-6">
        {/* Question Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-700">Loại câu hỏi:</span>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getQuestionTypeText(question.type)}
              </span>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Độ khó:</span>
            <div className="mt-1">
              <StatusBadge
                status={difficultyInfo.status}
                label={difficultyInfo.text}
                size="sm"
              />
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Điểm:</span>
            <div className="mt-1">
              <span className="text-lg font-semibold text-gray-900">{question.points}</span>
            </div>
          </div>
        </div>

        {/* Category and Tags */}
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Chủ đề:</span>
            <span className="ml-2 text-sm text-gray-600">
              {question.category?.name || 'Chưa phân loại'}
            </span>
          </div>
          
          {question.tags && question.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {question.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Content */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Nội dung câu hỏi:</h3>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <RichTextDisplay content={question.content} />
          </div>
        </div>

        {/* Question Options/Answers */}
        {renderQuestionOptions()}

        {/* Explanation */}
        {question.explanation && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Giải thích:</h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <RichTextDisplay content={question.explanation} />
            </div>
          </div>
        )}

        {/* Creation Info */}
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          <div>Tạo bởi: {question.createdBy.username}</div>
          <div>Ngày tạo: {new Date(question.createdAt).toLocaleDateString('vi-VN')}</div>
          {question.updatedAt !== question.createdAt && (
            <div>Cập nhật: {new Date(question.updatedAt).toLocaleDateString('vi-VN')}</div>
          )}
        </div>
      </div>
    </Modal>
  );
} 