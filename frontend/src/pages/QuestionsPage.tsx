import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import QuestionList from '../components/question/QuestionList';
import QuestionForm from '../components/question/QuestionForm';
import QuestionPreview from '../components/question/QuestionPreview';
import Alert from '../components/ui/Alert';
import type { Question, QuestionFilters } from '../types/questions';
import { fetchQuestions, deleteQuestion } from '../api/questions';

/**
 * Questions management page for admin interface
 * Provides complete question authoring and management workflow
 */
export default function QuestionsPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch questions with current filters
  const {
    data: questionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['questions', filters],
    queryFn: () => fetchQuestions(filters, 1, 20),
    placeholderData: { 
      questions: [], 
      total: 0, 
      page: 1, 
      limit: 20, 
      totalPages: 0,
      filters: {}
    },
  });

  /**
   * Handle creating new question
   */
  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setIsQuestionFormOpen(true);
  };

  /**
   * Handle editing existing question
   */
  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsQuestionFormOpen(true);
  };

  /**
   * Handle deleting question
   */
  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi "${question.content.substring(0, 50)}..."?`)) {
      return;
    }

    try {
      setDeleteError(null);
      await deleteQuestion(question.id);
      
      // Refetch questions after successful deletion
      await refetch();
      
      // Show success message briefly
      setTimeout(() => {
        // Could show a toast notification here
      }, 1000);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa câu hỏi');
    }
  };

  /**
   * Handle question preview
   */
  const handlePreviewQuestion = (question: Question) => {
    setPreviewQuestion(question);
    setIsPreviewOpen(true);
  };

  /**
   * Handle closing question form
   */
  const handleCloseQuestionForm = () => {
    setIsQuestionFormOpen(false);
    setSelectedQuestion(null);
  };

  /**
   * Handle successful question form submission
   */
  const handleQuestionFormSuccess = () => {
    // Refetch questions to show updated data
    refetch();
    setIsQuestionFormOpen(false);
    setSelectedQuestion(null);
  };

  /**
   * Handle filters change
   */
  const handleFiltersChange = (newFilters: QuestionFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handle import questions (placeholder for future implementation)
   */
  const handleImportQuestions = () => {
    // TODO: Implement CSV import in Phase 2
    alert('Tính năng nhập câu hỏi từ CSV sẽ được phát triển trong Phase 2');
  };

  /**
   * Handle export questions (placeholder for future implementation)
   */
  const handleExportQuestions = () => {
    // TODO: Implement CSV export in Phase 2
    alert('Tính năng xuất câu hỏi ra CSV sẽ được phát triển trong Phase 2');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý và tạo câu hỏi cho các bài kiểm tra
          </p>
        </div>

        {/* Delete Error Alert */}
        {deleteError && (
          <Alert 
            type="error" 
            message={deleteError} 
            onClose={() => setDeleteError(null)}
          />
        )}

        {/* API Error Alert */}
        {error && (
          <Alert 
            type="error" 
            message={error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu'}
          />
        )}

        {/* Questions List */}
        <QuestionList
          questions={questionsData?.questions || []}
          isLoading={isLoading}
          onCreateQuestion={handleCreateQuestion}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onPreviewQuestion={handlePreviewQuestion}
          onImportQuestions={handleImportQuestions}
          onExportQuestions={handleExportQuestions}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Question Form Modal */}
        <QuestionForm
          question={selectedQuestion}
          isOpen={isQuestionFormOpen}
          onClose={handleCloseQuestionForm}
          onSuccess={handleQuestionFormSuccess}
        />

        {/* Question Preview Modal */}
        {previewQuestion && (
          <QuestionPreview
            question={previewQuestion}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
} 