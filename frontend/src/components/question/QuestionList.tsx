import { useState } from 'react';
// decode import removed - not used in current implementation
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import QuestionCard from './QuestionCard';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import EmptyState from '../ui/EmptyState';
import type { Question, QuestionFilters } from '../../types/questions';
// Utils imports removed - not used in current implementation

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
 * Question list component with search, filters, and bulk operations
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
    onFiltersChange?.({
      ...filters,
      search: value,
    });
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof QuestionFilters, value: string) => {
    onFiltersChange?.({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  /**
   * Handle individual question selection
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
   * Handle select all questions
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    } else {
      setSelectedQuestions(new Set());
    }
  };

  /**
   * Get difficulty display text
   */
  // Utility functions for potential future use
  // const getDifficultyText = (difficulty: Difficulty): string => {
  //   const map = {
  //     easy: 'Dễ',
  //     medium: 'Trung bình',
  //     hard: 'Khó',
  //   };
  //   return map[difficulty] || difficulty;
  // };

  // const getDifficultyBadgeStatus = (difficulty: Difficulty) => {
  //   const map = {
  //     easy: 'success' as const,
  //     medium: 'warning' as const,
  //     hard: 'error' as const,
  //   };
  //   return map[difficulty] || 'info' as const;
  // };

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sắp xếp theo
              </label>
              <select
                value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  onFiltersChange?.({
                    ...filters,
                    sortBy: sortBy as any,
                    sortOrder: sortOrder as any,
                  });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="title-asc">Theo tên (A-Z)</option>
                <option value="title-desc">Theo tên (Z-A)</option>
                <option value="difficulty-asc">Độ khó tăng dần</option>
                <option value="difficulty-desc">Độ khó giảm dần</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Questions Grid */}
      <div className="space-y-4">
        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedCount === questions.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-blue-900">
                  Đã chọn {selectedCount} câu hỏi
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedQuestions(new Set())}
                >
                  Bỏ chọn
                </Button>
                
                {onExportQuestions && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onExportQuestions}
                  >
                    Xuất đã chọn
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <EmptyState
            title="Chưa có câu hỏi nào"
            description="Tạo câu hỏi đầu tiên để bắt đầu xây dựng ngân hàng câu hỏi của bạn."
            action={{
              label: 'Tạo câu hỏi',
              onClick: onCreateQuestion,
              variant: 'primary',
              icon: <PlusIcon className="h-4 w-4" />,
            }}
          />
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={onEditQuestion}
                onDelete={onDeleteQuestion}
                onPreview={onPreviewQuestion}
                selectable={true}
                selected={selectedQuestions.has(question.id)}
                onSelect={(selected) => handleQuestionSelect(question.id, selected)}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 