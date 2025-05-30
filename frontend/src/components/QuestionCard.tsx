import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import type { Question, QuestionType, Difficulty } from '../types/questions';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';

interface QuestionCardProps {
  question: Question;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onPreview?: (question: Question) => void;
  showActions?: boolean;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  className?: string;
}

/**
 * Question card component for displaying question previews
 * Supports LaTeX rendering and different question types
 */
export default function QuestionCard({
  question,
  onEdit,
  onDelete,
  onPreview,
  showActions = true,
  compact = false,
  selectable = false,
  selected = false,
  onSelect,
  className = '',
}: QuestionCardProps) {
  /**
   * Get question type display text
   */
  const getQuestionTypeText = (type: QuestionType): string => {
    const map = {
      'multiple-choice': 'Trắc nghiệm (1 đáp án)',
      'multiple-select': 'Trắc nghiệm (nhiều đáp án)',
      'true-false': 'Đúng/Sai',
      'fill-blank': 'Điền khuyết',
      'essay': 'Tự luận',
    };
    return map[type] || type;
  };

  /**
   * Get difficulty display text and status
   */
  const getDifficultyInfo = (difficulty: Difficulty) => {
    const map = {
      easy: { text: 'Dễ', status: 'success' as const },
      medium: { text: 'Trung bình', status: 'warning' as const },
      hard: { text: 'Khó', status: 'error' as const },
    };
    return map[difficulty] || { text: difficulty, status: 'info' as const };
  };

  /**
   * Get category display text
   */
  const getCategoryText = (category: string): string => {
    const map: Record<string, string> = {
      algebra: 'Đại số',
      geometry: 'Hình học',
      calculus: 'Giải tích',
      statistics: 'Thống kê',
      trigonometry: 'Lượng giác',
    };
    return map[category] || category;
  };

  /**
   * Truncate text for display
   */
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  /**
   * Render question content based on type
   */
  const renderQuestionContent = () => {
    if (compact) {
      return (
        <p className="text-sm text-gray-900 line-clamp-2">
          {truncateText(question.content, 100)}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-900">
          {truncateText(question.content, 200)}
        </div>

        {/* Type-specific preview */}
        {question.type === 'multiple-choice' && 'options' in question && (
          <div className="space-y-1">
            {question.options.slice(0, 3).map((option, index) => (
              <div key={option.id} className="flex items-center text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full border border-gray-300 mr-2 flex-shrink-0"></span>
                <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                <span className="truncate">{truncateText(option.text, 50)}</span>
              </div>
            ))}
            {question.options.length > 3 && (
              <p className="text-xs text-gray-500 ml-6">
                ... và {question.options.length - 3} lựa chọn khác
              </p>
            )}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full border border-gray-300 mr-2"></span>
              <span>Đúng</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full border border-gray-300 mr-2"></span>
              <span>Sai</span>
            </div>
          </div>
        )}

        {question.type === 'fill-blank' && (
          <div className="text-xs text-gray-600">
            <span className="bg-gray-200 px-2 py-1 rounded">Điền vào chỗ trống</span>
          </div>
        )}

        {question.type === 'essay' && (
          <div className="text-xs text-gray-600">
            <span className="bg-gray-200 px-2 py-1 rounded">Câu trả lời tự luận</span>
          </div>
        )}
      </div>
    );
  };

  const difficultyInfo = getDifficultyInfo(question.difficulty);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${
        selected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect?.(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
              
              <StatusBadge
                status={difficultyInfo.status}
                label={difficultyInfo.text}
                size="sm"
              />
              
              <span className="text-xs text-gray-500">
                {getQuestionTypeText(question.type)}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <TagIcon className="h-3 w-3 mr-1" />
                <span>{getCategoryText(question.category)}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium">{question.points} điểm</span>
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>
                  {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1 ml-4">
              {onPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<EyeIcon className="h-4 w-4" />}
                  onClick={() => onPreview(question)}
                  title="Xem trước"
                />
              )}
              
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => onEdit(question)}
                  title="Chỉnh sửa"
                />
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon className="h-4 w-4" />}
                  onClick={() => onDelete(question)}
                  className="text-red-600 hover:text-red-700"
                  title="Xóa"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${compact ? 'pb-3' : ''}`}>
        {renderQuestionContent()}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Explanation indicator */}
        {question.explanation && !compact && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Có giải thích chi tiết
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 