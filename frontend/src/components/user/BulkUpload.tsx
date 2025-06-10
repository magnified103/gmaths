/**
 * Bulk upload component for CSV user import
 * with drag-drop functionality and comprehensive error handling
 * Refactored to use reusable UI components
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import type { BulkUploadResult, CSVUserRow } from '../../types/admin';
import { uploadUsersCSV, downloadCSVTemplate } from '../../api/admin';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';
import { ButtonSpinner } from '../ui/LoadingSpinner';

interface BulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Bulk upload component for importing users via CSV.
 * @param isOpen - Whether the upload modal is open.
 * @param onClose - Callback when modal is closed.
 * @param onSuccess - Callback when upload is successful.
 */
export default function BulkUpload({ isOpen, onClose, onSuccess }: BulkUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<CSVUserRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Resets all upload state when modal is closed.
   */
  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
    setPreviewData(null);
    setOverwriteExisting(false);
    setIsUploading(false);
    setIsDragOver(false);
  }, []);

  /**
   * Previews CSV file content for validation.
   * @param file - CSV file to preview.
   */
  const previewCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setUploadError('Tệp CSV phải có ít nhất 1 dòng dữ liệu (ngoài tiêu đề)');
          return;
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['username', 'email', 'password'];
        
        if (!expectedHeaders.every(h => header.includes(h))) {
          setUploadError(`Tệp CSV phải có các cột: ${expectedHeaders.join(', ')}`);
          return;
        }

        // Parse and preview first 5 rows
        const preview: CSVUserRow[] = [];
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          header.forEach((h, index) => {
            row[h] = values[index] || '';
          });
          preview.push({
            username: row.username || '',
            email: row.email || '',
            password: row.password || '',
          });
        }

        setPreviewData(preview);
      } catch (_error) {
        setUploadError('Không thể đọc tệp CSV. Vui lòng kiểm tra định dạng tệp.');
      }
    };
    reader.readAsText(file);
  }, []);

  /**
   * Handles file selection and validation.
   * @param file - Selected file to validate.
   */
  const handleFileSelect = useCallback((file: File) => {
    // Reset previous state
    setUploadResult(null);
    setUploadError(null);
    setPreviewData(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Vui lòng chọn tệp CSV (.csv)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước tệp không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    previewCSVFile(file);
  }, [previewCSVFile]);

  /**
   * Handles drag over events.
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  /**
   * Handles drag leave events.
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * Handles file drop events.
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handles file input change.
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handles file upload submission.
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadUsersCSV(selectedFile, overwriteExisting);
      setUploadResult(result);
      
      if (result.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, overwriteExisting, onSuccess, onClose]);

  /**
   * Downloads CSV template file.
   */
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadCSVTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user-import-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (_error) {
      setUploadError('Không thể tải xuống mẫu CSV');
    }
  }, []);

  /**
   * Handles modal close with state reset.
   */
  const handleClose = useCallback(() => {
    resetUploadState();
    onClose();
  }, [resetUploadState, onClose]);

  const modalFooter = !uploadResult ? (
    <>
      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
      >
        {isUploading ? (
          <ButtonSpinner text="Đang tải lên..." />
        ) : (
          'Tải lên'
        )}
      </button>
      <button
        type="button"
        onClick={handleClose}
        disabled={isUploading}
        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
      >
        Hủy
      </button>
    </>
  ) : (
    <button
      type="button"
      onClick={handleClose}
      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm"
    >
      Đóng
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tải lên danh sách người dùng"
      subtitle="Tải lên tệp CSV để tạo nhiều người dùng cùng lúc"
      size="2xl"
      footer={modalFooter}
    >
      <div className="px-4 pb-4 sm:px-6">
        {/* Upload Error */}
        {uploadError && (
          <Alert 
            type="error" 
            message={uploadError} 
            className="mb-4"
          />
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Alert
            type={uploadResult.success ? 'success' : 'warning'}
            title="Kết quả tải lên"
            className="mb-4"
            message={
              <div>
                <p>Tổng số dòng: {uploadResult.totalRows}</p>
                <p>Thành công: {uploadResult.successCount}</p>
                <p>Lỗi: {uploadResult.errorCount}</p>
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-red-800">Chi tiết lỗi:</h4>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-xs text-red-700">
                          Dòng {error.row}: {error.field} - {error.message}
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <div className="text-xs text-red-700">
                          ... và {uploadResult.errors.length - 5} lỗi khác
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          />
        )}

        {!uploadResult && (
          <>
            {/* Template Download */}
            <Alert
              type="info"
              title="Mẫu CSV"
              className="mb-6"
              message={
                <div className="flex items-center justify-between">
                  <p>Tệp CSV phải có các cột: username, email, password</p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Tải mẫu
                  </button>
                </div>
              }
            />

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {selectedFile ? (
                    <>
                      <span className="font-medium text-gray-900">{selectedFile.name}</span>
                      <br />
                      <span className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </>
                  ) : (
                    <>
                      Kéo thả tệp CSV vào đây hoặc{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        chọn tệp
                      </button>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Chỉ hỗ trợ tệp CSV, tối đa 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="sr-only"
              />
            </div>

            {/* File Preview */}
            {previewData && previewData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Xem trước dữ liệu (5 dòng đầu):
                </h4>
                <div className="overflow-hidden border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tên đăng nhập
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mật khẩu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.username}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.email}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">***</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Options */}
            {selectedFile && (
              <div className="mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="overwriteExisting"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="overwriteExisting" className="ml-2 block text-sm text-gray-700">
                    Ghi đè người dùng đã tồn tại
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Nếu được chọn, thông tin người dùng hiện có sẽ bị cập nhật. 
                  Nếu không, các dòng trùng lặp sẽ bị bỏ qua.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
} 