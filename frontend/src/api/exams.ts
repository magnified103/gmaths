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
  ExamPreview,
  ExamSubmission,
  ExamSubmissionResult,
  ExamAvailability,
  ExamForTaking,
  ExamAnswer
} from '../types/exams';
import { API_BASE_URL } from './config';

/**
 * Session update request interface
 */
export interface ExamSessionUpdateRequest {
  currentQuestion?: number;
  timeRemaining?: number;
  answers?: ExamAnswer[];
  sessionData?: Record<string, any>;
}

/**
 * Session update response interface
 */
export interface ExamSessionUpdateResponse {
  sessionId: string;
  currentQuestion: number;
  timeRemaining: number;
  answers: ExamAnswer[];
  lastActivityAt: string;
  isActive: boolean;
}

/**
 * Base fetch wrapper with error handling for Vietnamese error messages.
 * @param url - API endpoint URL.
 * @param options - Fetch options.
 * @returns Promise resolving to response data.
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth-token');
  
  const defaultHeaders: HeadersInit = {};

  // Only set Content-Type if there's a body
  if (options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  
  // Debug logging for API calls
  console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
  if (options.body) {
    console.log('📤 Request body:', options.body);
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ API Error response:', errorData);
    const errorMessage = errorData.message || 'Đã xảy ra lỗi không xác định';
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('✅ API Success response:', data);
  return data.data || data;
}

/**
 * Update exam session state
 * @param sessionId - Session ID to update
 * @param updates - Session updates
 * @returns Promise resolving to updated session data
 */
export const updateExamSession = async (
  sessionId: string,
  updates: ExamSessionUpdateRequest
): Promise<ExamSessionUpdateResponse> => {
  return apiFetch<ExamSessionUpdateResponse>(`/exam-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

/**
 * Get current exam session state
 * @param sessionId - Session ID to retrieve
 * @returns Promise resolving to session data
 */
export const getExamSession = async (sessionId: string): Promise<ExamSessionUpdateResponse> => {
  return apiFetch<ExamSessionUpdateResponse>(`/exam-sessions/${sessionId}`);
};

/**
 * Sync session state with beacon API (for page unload)
 * @param sessionId - Session ID
 * @param updates - Session updates
 */
export const syncExamSessionBeacon = (sessionId: string, updates: ExamSessionUpdateRequest): void => {
  const data = JSON.stringify({
    sessionId,
    ...updates,
  });

  navigator.sendBeacon(
    `${API_BASE_URL}/exam-sessions/${sessionId}/sync`,
    new Blob([data], { type: 'application/json' })
  );
};

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
  // Debug logging to see what data is being sent
  console.log('🚀 Creating exam with original data:', examData);
  
  // Clean up empty string values for optional fields that should be undefined
  const cleanedData = { ...examData };
  
  // Remove empty string fields that should be undefined for optional fields
  if (cleanedData.password === '') {
    delete (cleanedData as any).password;
  }
  if (cleanedData.startDate === '') {
    delete (cleanedData as any).startDate;
  }
  if (cleanedData.endDate === '') {
    delete (cleanedData as any).endDate;
  }
  if (cleanedData.description === '') {
    delete (cleanedData as any).description;
  }
  if (cleanedData.instructions === '') {
    delete (cleanedData as any).instructions;
  }
  
  // Convert string numbers to actual numbers for backend validation
  if (typeof cleanedData.timeLimit === 'string') {
    cleanedData.timeLimit = parseInt(cleanedData.timeLimit, 10);
  }
  if (typeof cleanedData.maxAttempts === 'string') {
    cleanedData.maxAttempts = parseInt(cleanedData.maxAttempts, 10);
  }
  
  console.log('🧹 Cleaned exam data:', cleanedData);
  console.log('📝 Stringified cleaned data:', JSON.stringify(cleanedData, null, 2));
  
  return apiFetch<Exam>('/exams', {
    method: 'POST',
    body: JSON.stringify(cleanedData),
  });
};

/**
 * Update an existing exam
 */
export const updateExam = async (examData: UpdateExamRequest): Promise<Exam> => {
  const { id, ...updateData } = examData;
  
  // Clean up empty string values for optional fields
  const cleanedData = { ...updateData };
  
  // Remove empty string fields that should be undefined for optional fields
  if (cleanedData.password === '') {
    delete cleanedData.password;
  }
  if (cleanedData.startDate === '') {
    delete cleanedData.startDate;
  }
  if (cleanedData.endDate === '') {
    delete cleanedData.endDate;
  }
  if (cleanedData.description === '') {
    delete cleanedData.description;
  }
  if (cleanedData.instructions === '') {
    delete cleanedData.instructions;
  }
  
  // Convert string numbers to actual numbers for backend validation
  if (typeof cleanedData.timeLimit === 'string') {
    cleanedData.timeLimit = parseInt(cleanedData.timeLimit, 10);
  }
  if (typeof cleanedData.maxAttempts === 'string') {
    cleanedData.maxAttempts = parseInt(cleanedData.maxAttempts, 10);
  }
  
  return apiFetch<Exam>(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedData),
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
  return apiFetch<{ isValid: boolean; errors: any[] }>('/exams/validate', {
    method: 'POST',
    body: JSON.stringify(examData),
  });
};

/**
 * Submit exam answers for grading
 * @param submission - Exam submission data
 * @returns Promise resolving to submission result
 */
export const submitExamAnswers = async (submission: ExamSubmission): Promise<ExamSubmissionResult> => {
  return apiFetch<ExamSubmissionResult>(`/exams/${submission.examId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
};

/**
 * Fetch available exams for students to take
 * @param filters - Optional filters for exam search
 * @returns Promise resolving to list of takeable exams
 */
export const fetchTakeableExams = async (
  filters: Partial<ExamFilters> = {}
): Promise<ExamListResponse> => {
  const params = new URLSearchParams({
    page: '1',
    limit: '50',
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    )
  });

  return apiFetch<ExamListResponse>(`/exams/takeable?${params}`);
};

/**
 * Check if exam is available for taking
 * @param examId - Exam ID to check
 * @returns Promise resolving to exam availability status
 */
export const checkExamAvailability = async (examId: string): Promise<ExamAvailability> => {
  return apiFetch<ExamAvailability>(`/exams/${examId}/availability`);
};

/**
 * Get exam for taking (with password if required)
 * @param examId - Exam ID
 * @param password - Optional exam password
 * @returns Promise resolving to exam data for taking
 */
export const fetchExamForTaking = async (
  examId: string, 
  password?: string
): Promise<ExamForTaking> => {
  const body = password ? JSON.stringify({ password }) : undefined;
  
  return apiFetch<ExamForTaking>(`/exams/${examId}/take`, {
    method: 'POST',
    ...(body && { body }),
  });
}; 