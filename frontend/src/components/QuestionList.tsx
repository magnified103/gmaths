import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import type { Question, QuestionFilters, QuestionType, Difficulty } from '../types/questions';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import StatusBadge from './ui/StatusBadge';
import FormField from './ui/FormField';

interface QuestionListProps {
  questions: Question[];
  isLoading?: boolean;
  onCreateQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (question: Question) => void;
  onPreviewQuestion: (question: Question) => void;
  onImportQuestions?: () => void;
  onExportQuestions?: () => void;
  filters?: QuestionFilters;
  onFiltersChange?: (filters: QuestionFilters) => void;
}

/**
 * Question list component for the question bank interface
 * Displays questions with filtering, search, and management actions
 */
export default function QuestionList({
  questions,
  isLoading = false,
  onCreateQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onPreviewQuestion,
  onImportQuestions,
  onExportQuestions,
  filters = {},
  onFiltersChange,
}: QuestionListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    onFiltersChange?.({ ...filters, search: value });
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof QuestionFilters, value: string) => {
    onFiltersChange?.({ ...filters, [key]: value === 'all' ? undefined : value });
  };

  /**
   * Toggle question selection
   */
  const handleQuestionSelect = (questionId: string, selected: boolean) => {
    const newSelected = new Set(selectedQuestions);
    if (selected) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  /**
   * Select all questions
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    } else {
      setSelectedQuestions(new Set());
    }
  };

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
   * Get difficulty display text
   */
  const getDifficultyText = (difficulty: Difficulty): string => {
    const map = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó',
    };
    return map[difficulty] || difficulty;
  };

  /**
   * Get difficulty badge status
   */
  const getDifficultyBadgeStatus = (difficulty: Difficulty) => {
    const map = {
      easy: 'success' as const,
      medium: 'warning' as const,
      hard: 'error' as const,
    };
    return map[difficulty] || 'info' as const;
  };

  /**
   * Truncate text for display
   */
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  /**
   * Get filtered questions count
   */
  const filteredCount = questions.length;
  const selectedCount = selectedQuestions.size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ngân hàng câu hỏi</h2>
          <p className="text-sm text-gray-600">
            {filteredCount} câu hỏi
            {selectedCount > 0 && ` • ${selectedCount} đã chọn`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onImportQuestions && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowUpTrayIcon className="h-4 w-4" />}
              onClick={onImportQuestions}
            >
              Nhập
            </Button>
          )}
          
          {onExportQuestions && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowDownTrayIcon className="h-4 w-4" />}
              onClick={onExportQuestions}
              disabled={selectedCount === 0}
            >
              Xuất ({selectedCount})
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={onCreateQuestion}
          >
            Tạo câu hỏi
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="ghost"
            size="sm"
            icon={<FunnelIcon className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Bộ lọc
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <FormField
              id="typeFilter"
              label="Loại câu hỏi"
              type="select"
              value={filters.type || 'all'}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả loại' },
                { value: 'multiple-choice', label: 'Trắc nghiệm (1 đáp án)' },
                { value: 'multiple-select', label: 'Trắc nghiệm (nhiều đáp án)' },
                { value: 'true-false', label: 'Đúng/Sai' },
                { value: 'fill-blank', label: 'Điền khuyết' },
                { value: 'essay', label: 'Tự luận' },
              ]}
            />

            <FormField
              id="categoryFilter"
              label="Chủ đề"
              type="select"
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả chủ đề' },
                { value: 'algebra', label: 'Đại số' },
                { value: 'geometry', label: 'Hình học' },
                { value: 'calculus', label: 'Giải tích' },
                { value: 'statistics', label: 'Thống kê' },
                { value: 'trigonometry', label: 'Lượng giác' },
              ]}
            />

            <FormField
              id="difficultyFilter"
              label="Độ khó"
              type="select"
              value={filters.difficulty || 'all'}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả độ khó' },
                { value: 'easy', label: 'Dễ' },
                { value: 'medium', label: 'Trung bình' },
                { value: 'hard', label: 'Khó' },
              ]}
            />

            <FormField
              id="sortFilter"
              label="Sắp xếp"
              type="select"
              value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onFiltersChange?.({ 
                  ...filters, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as 'asc' | 'desc' 
                });
              }}
              options={[
                { value: 'createdAt-desc', label: 'Mới nhất' },
                { value: 'createdAt-asc', label: 'Cũ nhất' },
                { value: 'category-asc', label: 'Chủ đề A-Z' },
                { value: 'difficulty-asc', label: 'Độ khó: Dễ → Khó' },
                { value: 'difficulty-desc', label: 'Độ khó: Khó → Dễ' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          title="Chưa có câu hỏi nào"
          description="Bắt đầu bằng cách tạo câu hỏi mới hoặc nhập từ tệp CSV"
          action={{
            label: 'Tạo câu hỏi đầu tiên',
            onClick: onCreateQuestion,
            variant: 'primary',
            icon: <PlusIcon className="h-4 w-4" />,
          }}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  Đã chọn {selectedCount} câu hỏi
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* Handle bulk delete */}}
                    className="text-red-600 hover:text-red-700"
                  >
                    Xóa đã chọn
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuestions(new Set())}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={selectedCount === questions.length && questions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-5">Câu hỏi</div>
                <div className="col-span-2">Loại</div>
                <div className="col-span-2">Chủ đề</div>
                <div className="col-span-1">Độ khó</div>
                <div className="col-span-1">Điểm</div>
                <div className="col-span-1">Hành động</div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="divide-y divide-gray-200">
            {questions.map((question) => (
              <div key={question.id} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(question.id)}
                      onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 w-full">
                    {/* Question Content */}
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-gray-900">
                        {truncateText(question.content, 80)}
                      </p>
                      {question.explanation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Có giải thích
                        </p>
                      )}
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">
                        {getQuestionTypeText(question.type)}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600 capitalize">
                        {question.category}
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div className="col-span-1">
                      <StatusBadge
                        status={getDifficultyBadgeStatus(question.difficulty)}
                        label={getDifficultyText(question.difficulty)}
                        size="sm"
                      />
                    </div>

                    {/* Points */}
                    <div className="col-span-1">
                      <span className="text-sm text-gray-900 font-medium">
                        {question.points}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<EyeIcon className="h-4 w-4" />}
                          onClick={() => onPreviewQuestion(question)}
                          title="Xem trước"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<PencilIcon className="h-4 w-4" />}
                          onClick={() => onEditQuestion(question)}
                          title="Chỉnh sửa"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<TrashIcon className="h-4 w-4" />}
                          onClick={() => onDeleteQuestion(question)}
                          className="text-red-600 hover:text-red-700"
                          title="Xóa"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 