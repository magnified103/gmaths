/**
 * Exam type definitions for frontend
 * Defines interfaces for exam creation, configuration, and management
 */

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type NavigationType = 'FREE' | 'LINEAR';

export type FeedbackType = 'IMMEDIATE' | 'AFTER_EXAM' | 'NEVER';

/**
 * Exam settings interface
 */
export interface ExamSettings {
  id?: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number; // in minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  feedbackType: FeedbackType;
  navigationType: NavigationType;
  allowReview: boolean;
  requireFullscreen: boolean;
  preventCopyPaste: boolean;
  password?: string;
  startDate?: Date;
  endDate?: Date;
  status: ExamStatus;
}

/**
 * Question assignment in exam
 */
export interface ExamQuestion {
  id: string;
  questionId: string;
  order: number;
  points?: number; // Override question default points
}

/**
 * Complete exam interface
 */
export interface Exam {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  settings: ExamSettings;
  questions: ExamQuestion[];
  totalPoints: number;
  questionCount: number;
  estimatedDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    username: string;
  };
}

/**
 * Exam creation request
 */
export interface CreateExamRequest {
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  feedbackType: FeedbackType;
  navigationType: NavigationType;
  allowReview: boolean;
  requireFullscreen: boolean;
  preventCopyPaste: boolean;
  password?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  questionIds: string[];
  questionPoints?: Record<string, number>; // Override points for specific questions
}

/**
 * Exam update request
 */
export interface UpdateExamRequest extends Partial<CreateExamRequest> {
  id: string;
  status?: ExamStatus;
}

/**
 * Exam list response
 */
export interface ExamListResponse {
  exams: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Exam filters for search and filtering
 */
export interface ExamFilters {
  search?: string;
  status?: ExamStatus | 'ALL';
  createdById?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Exam validation result
 */
export interface ExamValidationResult {
  isValid: boolean;
  errors: ExamValidationError[];
  warnings: ExamValidationError[];
}

/**
 * Exam validation error
 */
export interface ExamValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Question selection interface for exam builder
 */
export interface QuestionSelection {
  questionId: string;
  selected: boolean;
  order?: number;
  customPoints?: number;
}

/**
 * Exam preview data
 */
export interface ExamPreview {
  exam: Exam;
  questions: Array<{
    id: string;
    content: string;
    type: string;
    points: number;
    order: number;
  }>;
  totalDuration: number;
  totalPoints: number;
} 