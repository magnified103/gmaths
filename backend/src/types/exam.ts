/**
 * Exam type definitions for backend
 * Comprehensive interfaces for exam management system
 */

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NavigationType = 'FREE' | 'LINEAR';
export type FeedbackType = 'IMMEDIATE' | 'AFTER_EXAM' | 'NEVER';

/**
 * Exam settings interface for JSON storage
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
 * Complete exam interface (matches Prisma model)
 */
export interface ExamModel {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  settings: ExamSettings;
  status: ExamStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Exam with relations included
 */
export interface ExamWithRelations extends ExamModel {
  createdBy: {
    id: string;
    username: string;
  };
  questions: ExamQuestionWithQuestion[];
  totalPoints: number;
  questionCount: number;
  estimatedDuration: number;
}

/**
 * Exam question model
 */
export interface ExamQuestionModel {
  id: string;
  examId: string;
  questionId: string;
  order: number;
  points?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exam question with question details
 */
export interface ExamQuestionWithQuestion extends ExamQuestionModel {
  question: {
    id: string;
    content: string;
    type: string;
    points: number;
    difficulty: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

/**
 * Create exam request (from frontend)
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
  startDate?: string;
  endDate?: string;
  questionIds: string[];
  questionPoints?: Record<string, number>;
}

/**
 * Update exam request (from frontend)
 */
export interface UpdateExamRequest extends Partial<CreateExamRequest> {
  id: string;
  status?: ExamStatus;
}

/**
 * Exam filters for database queries
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
 * Paginated exam list response
 */
export interface ExamListResponse {
  exams: ExamWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
 * Exam validation result
 */
export interface ExamValidationResult {
  isValid: boolean;
  errors: ExamValidationError[];
  warnings: ExamValidationError[];
}

/**
 * Exam preview data for students
 */
export interface ExamPreview {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number;
  maxAttempts: number;
  totalPoints: number;
  questionCount: number;
  estimatedDuration: number;
  requiresPassword: boolean;
  startDate?: string;
  endDate?: string;
  questions: Array<{
    id: string;
    content: string;
    type: string;
    points: number;
    order: number;
  }>;
}

/**
 * Database query options for exam operations
 */
export interface ExamQueryOptions {
  includeQuestions?: boolean;
  includeCreatedBy?: boolean;
  includeDeleted?: boolean;
  questionDetails?: boolean;
}

/**
 * Exam statistics interface
 */
export interface ExamStatistics {
  totalExams: number;
  draftExams: number;
  publishedExams: number;
  archivedExams: number;
  totalQuestions: number;
  averageQuestionsPerExam: number;
  averageDuration: number;
}

/**
 * Exam schedule validation result
 */
export interface ScheduleValidation {
  isValid: boolean;
  conflicts: Array<{
    examId: string;
    title: string;
    conflictType: 'overlap' | 'too_close';
    conflictStart: string;
    conflictEnd: string;
  }>;
}

/**
 * Exam Taking Related Types
 */

export interface ExamAvailability {
  available: boolean;
  reason?: string;
  requiresPassword: boolean;
  timeRemaining?: number;
  canStart: boolean;
  startTime?: string;
  endTime?: string;
}

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

/**
 * Database Models for Exam Taking
 */

export interface ExamSubmissionModel {
  id: string;
  examId: string;
  userId: string;
  answers: ExamAnswer[];
  timeSpent: number;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  isAutoSubmit: boolean;
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamAttemptModel {
  id: string;
  examId: string;
  userId: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  submissionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response Types for Exam Taking
 */

export interface ExamForTakingResponse {
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
    options?: Array<{
      id: string;
      text: string;
    }>;
    // Other question type specific data without correct answers
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

export interface TakeableExamsResponse {
  exams: Array<{
    id: string;
    title: string;
    description?: string;
    timeLimit: number;
    maxAttempts: number;
    totalPoints: number;
    questionCount: number;
    estimatedDuration: number;
    requiresPassword: boolean;
    startDate?: string;
    endDate?: string;
    settings: {
      startDate?: string;
      endDate?: string;
      timeLimit: number;
    };
    remainingAttempts: number;
    lastAttempt?: {
      completedAt: Date;
      score?: number;
      percentage?: number;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 