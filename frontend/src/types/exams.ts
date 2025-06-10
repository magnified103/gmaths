import type { Question } from './questions';

/**
 * Exam type definitions for frontend
 * Defines interfaces for exam creation, configuration, and management
 */

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type NavigationType = 'FREE' | 'LINEAR';

export type FeedbackType = 'IMMEDIATE' | 'AFTER_EXAM' | 'NEVER';

/**
 * Exam settings interface (matches backend structure)
 */
export interface ExamSettings {
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
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
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
  status: ExamStatus;
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
 * Exam with full question data for taking exams
 */
export interface ExamWithQuestions extends Omit<Exam, 'questions'> {
  questions: Array<Question & { 
    order: number; 
    examQuestionId: string; 
    customPoints?: number; 
  }>;
}

/**
 * Exam data structure for taking (from backend) - without correct answers
 */
export interface ExamForTaking {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  requiresPassword: boolean;
  allowReview: boolean;
  requireFullscreen: boolean;
  preventCopyPaste: boolean;
  questions: Array<{
    id: string;
    examQuestionId: string;
    type: string;
    content: string;
    points: number;
    order: number;
    typeData?: any; // Question type specific data without correct answers
    options?: Array<{
      id: string;
      text: string;
    }>;
  }>;
  totalPoints: number;
  questionCount: number;
  remainingAttempts: number;
  currentAttempt?: number;
  // Session-based data for robust state management
  sessionId: string;
  sessionData: {
    startedAt: string;
    timeRemaining?: number;
    currentQuestion: number;
    answers: ExamAnswer[];
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

// New types for exam taking
export interface ExamAnswer {
  questionId: string;
  answer: any; // Can be string, boolean, string[], or Record<string, string>
  timeSpent?: number;
}

export interface ExamSubmission {
  examId: string;
  answers: ExamAnswer[];
  timeSpent: number;
  isAutoSubmit: boolean;
  submittedAt: string;
}

export interface ExamSubmissionResult {
  success: boolean;
  submissionId: string;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt: string;
  gradedAt?: string;
}

export interface ExamAvailability {
  available: boolean;
  reason?: string;
  requiresPassword: boolean;
  timeRemaining?: number;
  canStart: boolean;
  startTime?: string;
  endTime?: string;
} 