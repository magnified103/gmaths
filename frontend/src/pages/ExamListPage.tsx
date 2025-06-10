/**
 * ExamListPage - Complete exam management interface
 * Provides listing, filtering, search, and management of all exams
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useExams, useDeleteExam, usePublishExam, useArchiveExam, useDuplicateExam } from '../hooks/useExams';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import type { Exam, ExamFilters, ExamStatus } from '../types/exams';

/**
 * ExamListPage component with comprehensive exam management
 */
export default function ExamListPage() {
  const navigate = useNavigate();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ExamFilters>({
    search: '',
    status: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // API hooks
  const { data: examData, isLoading, error, refetch } = useExams(filters, currentPage, 20);
  const deleteExamMutation = useDeleteExam();
  const publishExamMutation = usePublishExam();
  const archiveExamMutation = useArchiveExam();
  const duplicateExamMutation = useDuplicateExam();

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof ExamFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * Handle exam deletion
   */
  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    
    try {
      await deleteExamMutation.mutateAsync(selectedExam.id);
      setShowDeleteModal(false);
      setSelectedExam(null);
      refetch();
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Có lỗi xảy ra khi xóa bài thi');
    }
  };

  /**
   * Handle exam status changes
   */
  const handleStatusChange = async (exam: Exam, action: 'publish' | 'archive') => {
    try {
      if (action === 'publish') {
        await publishExamMutation.mutateAsync(exam.id);
      } else {
        await archiveExamMutation.mutateAsync(exam.id);
      }
      refetch();
    } catch (error) {
      console.error(`Error ${action}ing exam:`, error);
      alert(`Có lỗi xảy ra khi ${action === 'publish' ? 'xuất bản' : 'lưu trữ'} bài thi`);
    }
  };

  /**
   * Handle exam duplication
   */
  const handleDuplicateExam = async (exam: Exam) => {
    try {
      const newTitle = `${exam.title} (Bản sao)`;
      await duplicateExamMutation.mutateAsync({ examId: exam.id, newTitle });
      refetch();
    } catch (error) {
      console.error('Error duplicating exam:', error);
      alert('Có lỗi xảy ra khi sao chép bài thi');
    }
  };

  /**
   * Get status badge configuration
   */
  const getStatusConfig = (status: ExamStatus) => {
    switch (status) {
      case 'DRAFT':
        return { status: 'warning' as const, label: 'Bản nháp' };
      case 'PUBLISHED':
        return { status: 'success' as const, label: 'Đã xuất bản' };
      case 'ARCHIVED':
        return { status: 'inactive' as const, label: 'Đã lưu trữ' };
      default:
        return { status: 'info' as const, label: status };
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Render exam actions
   */
  const renderExamActions = (exam: Exam) => (
    <div className="flex items-center space-x-2">
      {/* View/Preview */}
      <button
        onClick={() => {
          setSelectedExam(exam);
          setShowPreviewModal(true);
        }}
        className="p-1 text-gray-400 hover:text-blue-600"
        title="Xem trước"
      >
        <EyeIcon className="h-4 w-4" />
      </button>

      {/* Edit */}
      <button
        onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
        className="p-1 text-gray-400 hover:text-green-600"
        title="Chỉnh sửa"
        disabled={exam.status === 'PUBLISHED'}
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      {/* Duplicate */}
      <button
        onClick={() => handleDuplicateExam(exam)}
        className="p-1 text-gray-400 hover:text-purple-600"
        title="Sao chép"
        disabled={duplicateExamMutation.isPending}
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
      </button>

      {/* Publish/Archive */}
      {exam.status === 'DRAFT' && (
        <button
          onClick={() => handleStatusChange(exam, 'publish')}
          className="p-1 text-gray-400 hover:text-green-600"
          title="Xuất bản"
          disabled={publishExamMutation.isPending}
        >
          <ArchiveBoxIcon className="h-4 w-4" />
        </button>
      )}

      {exam.status === 'PUBLISHED' && (
        <button
          onClick={() => handleStatusChange(exam, 'archive')}
          className="p-1 text-gray-400 hover:text-orange-600"
          title="Lưu trữ"
          disabled={archiveExamMutation.isPending}
        >
          <ArchiveBoxIcon className="h-4 w-4" />
        </button>
      )}

      {/* Delete */}
      {exam.status === 'DRAFT' && (
        <button
          onClick={() => {
            setSelectedExam(exam);
            setShowDeleteModal(true);
          }}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Xóa"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert
            type="error"
            title="Lỗi tải dữ liệu"
            message="Không thể tải danh sách bài thi. Vui lòng thử lại."
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý bài thi</h1>
            <p className="text-gray-600 mt-1">
              Tạo, chỉnh sửa và quản lý các bài thi trắc nghiệm
            </p>
          </div>
          <Link to="/admin/exams/create">
            <Button icon={<PlusIcon className="h-4 w-4" />}>
              Tạo bài thi mới
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm bài thi..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Bộ lọc</span>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={filters.status || 'ALL'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="ARCHIVED">Đã lưu trữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sắp xếp theo
                  </label>
                  <select
                    value={filters.sortBy || 'createdAt'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="createdAt">Ngày tạo</option>
                    <option value="updatedAt">Ngày cập nhật</option>
                    <option value="title">Tên bài thi</option>
                    <option value="startDate">Ngày bắt đầu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự
                  </label>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="desc">Mới nhất</option>
                    <option value="asc">Cũ nhất</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exam List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8">
              <LoadingSpinner size="lg" text="Đang tải danh sách bài thi..." />
            </div>
          ) : !examData?.exams.length ? (
            <div className="p-8">
              <EmptyState
                icon={<PlusIcon className="h-12 w-12 text-gray-400" />}
                title="Chưa có bài thi nào"
                description="Bắt đầu tạo bài thi đầu tiên để quản lý các kỳ thi trắc nghiệm"
                action={{
                  label: "Tạo bài thi mới",
                  onClick: () => navigate('/admin/exams/create'),
                  icon: <PlusIcon className="h-4 w-4" />
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bài thi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Câu hỏi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examData.exams.map((exam) => {
                    const statusConfig = getStatusConfig(exam.status);
                    return (
                      <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {exam.title}
                            </div>
                            {exam.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {exam.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={statusConfig.status}
                            label={statusConfig.label}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {exam.questionCount} câu ({exam.totalPoints} điểm)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {exam.settings.timeLimit} phút
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(exam.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {renderExamActions(exam)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {examData && examData.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * 20) + 1} đến{' '}
                  {Math.min(currentPage * 20, examData.total)} của {examData.total} bài thi
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(examData.totalPages, currentPage + 1))}
                    disabled={currentPage === examData.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Xác nhận xóa bài thi"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Bạn có chắc chắn muốn xóa bài thi <strong>"{selectedExam?.title}"</strong>?
            </p>
            <p className="text-sm text-red-600">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteExam}
                isLoading={deleteExamMutation.isPending}
              >
                Xóa bài thi
              </Button>
            </div>
          </div>
        </Modal>

        {/* Preview Modal */}
        {showPreviewModal && selectedExam && (
          <Modal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            title={`Xem trước: ${selectedExam.title}`}
            size="2xl"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Mô tả:</span>
                  <p className="text-gray-600 mt-1">{selectedExam.description || 'Không có mô tả'}</p>
                </div>
                <div>
                  <span className="font-medium">Thời gian:</span>
                  <p className="text-gray-600 mt-1">{selectedExam.settings.timeLimit} phút</p>
                </div>
                <div>
                  <span className="font-medium">Số câu hỏi:</span>
                  <p className="text-gray-600 mt-1">{selectedExam.questionCount} câu</p>
                </div>
                <div>
                  <span className="font-medium">Tổng điểm:</span>
                  <p className="text-gray-600 mt-1">{selectedExam.totalPoints} điểm</p>
                </div>
              </div>
              {selectedExam.instructions && (
                <div>
                  <span className="font-medium">Hướng dẫn:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                    {selectedExam.instructions}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
} 