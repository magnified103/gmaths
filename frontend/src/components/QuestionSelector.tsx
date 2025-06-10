/**
 * QuestionSelector component for selecting questions from question bank
 * Allows filtering, searching, and selecting questions for exam creation
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Plus, Minus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuestions } from '../hooks/useQuestions';
import { useCategories } from '../hooks/useCategories';
import type { Question, QuestionFilters } from '../types/questions';
import type { QuestionSelection } from '../types/exams';

interface QuestionSelectorProps {
  selectedQuestions: string[];
  onQuestionsChange: (questionIds: string[], questionPoints?: Record<string, number>) => void;
  maxQuestions?: number;
}

interface SortableQuestionItemProps {
  questionId: string;
  question: Question;
  selection: QuestionSelection;
  customPoints: Record<string, number>;
  onPointsChange: (questionId: string, points: number) => void;
  onToggle: (question: Question) => void;
}

/**
 * Sortable question item component for drag and drop
 */
const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  questionId,
  question,
  selection,
  customPoints,
  onPointsChange,
  onToggle
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: questionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 bg-gray-50 rounded-md border ${
        isDragging ? 'border-blue-300 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div {...attributes} {...listeners} className="mr-3 cursor-grab">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
        {selection.order}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {question.content.replace(/\$.*?\$/g, '[Math]')} {/* Simple LaTeX indicator */}
        </p>
        <p className="text-xs text-gray-500">
          {question.type} • {question.difficulty} • {question.points} điểm
        </p>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        <label className="text-xs text-gray-600">Điểm:</label>
        <input
          type="number"
          min="1"
          max="100"
          value={customPoints[questionId] || question.points}
          onChange={(e) => onPointsChange(questionId, parseInt(e.target.value) || question.points)}
          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <button
        type="button"
        onClick={() => onToggle(question)}
        className="ml-2 p-1 text-red-600 hover:text-red-800"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * QuestionSelector component with filtering and drag-drop ordering
 */
export const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedQuestions = [],
  onQuestionsChange,
  maxQuestions
}) => {
  // State
  const [filters, setFilters] = useState<QuestionFilters>({
    search: '',
    type: 'all' as any, // Fix type to match API expectation
    category: '',
    difficulty: 'all' as any, // Fix type to match API expectation
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selections, setSelections] = useState<Record<string, QuestionSelection>>({});
  const [customPoints, setCustomPoints] = useState<Record<string, number>>({});

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // API hooks
  const { data: questionsData, isLoading: questionsLoading } = useQuestions(filters, page, 20);
  const { data: categories } = useCategories();

  // Initialize selections from props
  useEffect(() => {
    const newSelections: Record<string, QuestionSelection> = {};
    selectedQuestions.forEach((questionId, index) => {
      newSelections[questionId] = {
        questionId,
        selected: true,
        order: index + 1
      };
    });
    setSelections(newSelections);
  }, [selectedQuestions]);

  /**
   * Handle question selection toggle
   */
  const handleQuestionToggle = (question: Question) => {
    const isSelected = selections[question.id]?.selected;
    const newSelections = { ...selections };

    if (isSelected) {
      // Deselect question
      delete newSelections[question.id];
      const newCustomPoints = { ...customPoints };
      delete newCustomPoints[question.id];
      setCustomPoints(newCustomPoints);
    } else {
      // Check max questions limit
      const currentSelectedCount = Object.values(newSelections).filter(s => s.selected).length;
      if (maxQuestions && currentSelectedCount >= maxQuestions) {
        alert(`Chỉ có thể chọn tối đa ${maxQuestions} câu hỏi`);
        return;
      }

      // Select question
      newSelections[question.id] = {
        questionId: question.id,
        selected: true,
        order: currentSelectedCount + 1
      };
    }

    setSelections(newSelections);
    updateParent(newSelections);
  };

  /**
   * Handle custom points change
   */
  const handlePointsChange = (questionId: string, points: number) => {
    const newCustomPoints = {
      ...customPoints,
      [questionId]: points
    };
    setCustomPoints(newCustomPoints);
    
    // Update parent with custom points
    const selectedIds = Object.entries(selections)
      .filter(([_, selection]) => selection.selected)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .map(([questionId]) => questionId);
    
    onQuestionsChange(selectedIds, newCustomPoints);
  };

  /**
   * Handle drag end event
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const selectedEntries = Object.entries(selections)
        .filter(([_, selection]) => selection.selected)
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

      const oldIndex = selectedEntries.findIndex(([questionId]) => questionId === active.id);
      const newIndex = selectedEntries.findIndex(([questionId]) => questionId === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedEntries = arrayMove(selectedEntries, oldIndex, newIndex);
        
        // Update order
        const newSelections = { ...selections };
        reorderedEntries.forEach(([questionId], index) => {
          newSelections[questionId] = {
            ...newSelections[questionId],
            order: index + 1
          };
        });

        setSelections(newSelections);
        updateParent(newSelections);
      }
    }
  };

  /**
   * Update parent component with selected questions
   */
  const updateParent = (newSelections: Record<string, QuestionSelection>) => {
    const selectedIds = Object.entries(newSelections)
      .filter(([_, selection]) => selection.selected)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .map(([questionId]) => questionId);
    
    onQuestionsChange(selectedIds, customPoints);
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof QuestionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const selectedQuestionsList = Object.entries(selections)
    .filter(([_, selection]) => selection.selected)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  return (
    <div className="space-y-6">
      {/* Selected Questions Summary */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Plus className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {selectedQuestionsList.length} câu hỏi
              {maxQuestions && ` / ${maxQuestions}`}
            </span>
          </div>
          {selectedQuestionsList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelections({});
                setCustomPoints({});
                onQuestionsChange([]);
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      </div>

      {/* Selected Questions List with Drag & Drop */}
      {selectedQuestionsList.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Câu hỏi đã chọn (có thể kéo thả để sắp xếp)
          </h4>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedQuestionsList.map(([questionId]) => questionId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedQuestionsList.map(([questionId, selection]) => {
                  const question = questionsData?.questions.find((q: Question) => q.id === questionId);
                  if (!question) return null;

                  return (
                    <SortableQuestionItem
                      key={questionId}
                      questionId={questionId}
                      question={question}
                      selection={selection}
                      customPoints={customPoints}
                      onPointsChange={handlePointsChange}
                      onToggle={handleQuestionToggle}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Question Bank */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Ngân hàng câu hỏi</h4>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Filter className="h-4 w-4 mr-1" />
              Bộ lọc
              {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="MULTIPLE_SELECT">Chọn nhiều</option>
                  <option value="TRUE_FALSE">Đúng/Sai</option>
                  <option value="FILL_BLANK">Điền khuyết</option>
                  <option value="ESSAY">Tự luận</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
                <select
                  value={filters.difficulty || 'all'}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="p-6">
          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Đang tải câu hỏi...</p>
            </div>
          ) : questionsData?.questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy câu hỏi nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questionsData?.questions.map((question) => {
                const isSelected = selections[question.id]?.selected;
                const isAtLimit = maxQuestions && 
                  Object.values(selections).filter(s => s.selected).length >= maxQuestions && 
                  !isSelected;

                return (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50'
                        : isAtLimit
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        type="button"
                        onClick={() => !isAtLimit && handleQuestionToggle(question)}
                        disabled={!!isAtLimit}
                        className={`mt-1 p-1 rounded ${
                          isSelected
                            ? 'text-blue-600 hover:text-blue-800'
                            : isAtLimit
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            question.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty === 'easy' ? 'Dễ' : question.difficulty === 'medium' ? 'TB' : 'Khó'}
                          </span>
                          <span className="text-xs text-gray-500">{question.type}</span>
                          <span className="text-xs text-gray-500">{question.points} điểm</span>
                          {question.category && (
                            <span className="text-xs text-blue-600">{question.category.name}</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {question.content.replace(/\$.*?\$/g, '[Math]')} {/* Simple LaTeX indicator */}
                        </p>
                        
                        {isSelected && (
                          <div className="mt-2 text-xs text-blue-600">
                            ✓ Đã chọn (vị trí #{selections[question.id]?.order})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {questionsData && questionsData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((page - 1) * 20) + 1} - {Math.min(page * 20, questionsData.total)} 
                trong tổng số {questionsData.total} câu hỏi
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm border border-gray-300 rounded bg-blue-50">
                  {page} / {questionsData.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(questionsData.totalPages, p + 1))}
                  disabled={page === questionsData.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 