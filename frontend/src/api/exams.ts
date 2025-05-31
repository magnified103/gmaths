/**
 * Exam API functions for frontend
 * Handles CRUD operations for exams
 */

import type { 
  Exam, 
  CreateExamRequest, 
  UpdateExamRequest, 
  ExamListResponse, 
  ExamFilters,
  ExamPreview 
} from '../types/exams';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Base fetch wrapper with error handling for Vietnamese error messages.
 * @param url - API endpoint URL.
 * @param options - Fetch options.
 * @returns Promise resolving to response data.
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth-token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || 'Đã xảy ra lỗi không xác định';
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Fetch paginated list of exams with optional filters
 */
export const fetchExams = async (
  filters: ExamFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<ExamListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    )
  });

  return apiFetch<ExamListResponse>(`/exams?${params}`);
};

/**
 * Fetch a single exam by ID
 */
export const fetchExam = async (id: string): Promise<Exam> => {
  return apiFetch<Exam>(`/exams/${id}`);
};

/**
 * Create a new exam
 */
export const createExam = async (examData: CreateExamRequest): Promise<Exam> => {
  return apiFetch<Exam>('/exams', {
    method: 'POST',
    body: JSON.stringify(examData),
  });
};

/**
 * Update an existing exam
 */
export const updateExam = async (examData: UpdateExamRequest): Promise<Exam> => {
  const { id, ...updateData } = examData;
  
  return apiFetch<Exam>(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete an exam
 */
export const deleteExam = async (id: string): Promise<void> => {
  return apiFetch<void>(`/exams/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Publish an exam (change status from DRAFT to PUBLISHED)
 */
export const publishExam = async (id: string): Promise<Exam> => {
  return apiFetch<Exam>(`/exams/${id}/publish`, {
    method: 'PATCH',
  });
};

/**
 * Archive an exam (change status to ARCHIVED)
 */
export const archiveExam = async (id: string): Promise<Exam> => {
  return apiFetch<Exam>(`/exams/${id}/archive`, {
    method: 'PATCH',
  });
};

/**
 * Get exam preview data for student view
 */
export const fetchExamPreview = async (id: string): Promise<ExamPreview> => {
  return apiFetch<ExamPreview>(`/exams/${id}/preview`);
};

/**
 * Duplicate an existing exam
 */
export const duplicateExam = async (id: string, newTitle?: string): Promise<Exam> => {
  return apiFetch<Exam>(`/exams/${id}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ title: newTitle }),
  });
};

/**
 * Validate exam data before creation/update
 */
export const validateExam = async (examData: CreateExamRequest | UpdateExamRequest) => {
  return apiFetch(`/exams/validate`, {
    method: 'POST',
    body: JSON.stringify(examData),
  });
}; 