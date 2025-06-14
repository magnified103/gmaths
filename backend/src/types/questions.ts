/**
 * Backend question type definitions
 * These interfaces define the structure for question storage and processing
 */

import type { Question, QuestionType, Difficulty, QuestionCategory, Tag } from '@prisma/client';

// Base question interfaces matching frontend - standardized to lowercase
export type QuestionTypeEnum = 'multiple-choice' | 'multiple-select' | 'true-false' | 'fill-blank' | 'essay';
export type DifficultyEnum = 'easy' | 'medium' | 'hard';

/**
 * Question option interface for multiple choice questions
 */
export interface QuestionOption {
  id: string;
  text: string; // LaTeX-enabled text
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Fill-in-the-blank option interface
 */
export interface FillBlankOption {
  id: string;
  position: number; // Position in the text (0-based)
  acceptedAnswers: string[]; // Multiple acceptable answers
  caseSensitive: boolean;
  placeholder?: string;
}

/**
 * Type-specific data structures stored in JSON field
 */
export interface MultipleChoiceData {
  options: QuestionOption[];
  randomizeOptions?: boolean;
}

export interface MultipleSelectData {
  options: QuestionOption[];
  randomizeOptions?: boolean;
  partialCredit?: boolean;
}

export interface TrueFalseData {
  correctAnswer: boolean;
  randomizeOrder?: boolean; // Randomize True/False display order
}

export interface FillBlankData {
  blanks: FillBlankOption[];
  caseSensitive?: boolean;
}

export interface EssayData {
  maxWords?: number;
  minWords?: number;
  rubric?: string;
}

/**
 * Union type for all type-specific data
 */
export type QuestionTypeData = 
  | MultipleChoiceData 
  | MultipleSelectData 
  | TrueFalseData 
  | FillBlankData 
  | EssayData;

/**
 * Question creation request interface
 */
export interface CreateQuestionRequest {
  type: QuestionTypeEnum;
  content: string;
  explanation?: string;
  points: number;
  difficulty: DifficultyEnum;
  categoryId?: string;
  tagIds?: string[];
  typeData: QuestionTypeData;
  imageUrl?: string; // Support for question images via URL
}

/**
 * Question update request interface
 */
export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  id: string;
}

/**
 * Question with relations (for API responses)
 */
export interface QuestionWithRelations extends Question {
  category?: QuestionCategory | null;
  tags: (Tag & { questionTag: { questionId: string; tagId: string } })[];
  createdBy: {
    id: string;
    username: string;
  };
}

/**
 * Question list response interface
 */
export interface QuestionListResponse {
  questions: QuestionWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Question filters for search and filtering
 */
export interface QuestionFilters {
  search?: string;
  type?: QuestionTypeEnum | 'ALL' | 'all';
  categoryId?: string;
  difficulty?: DifficultyEnum | 'ALL' | 'all';
  tagIds?: string[];
  createdById?: string;
  sortBy?: 'content' | 'category' | 'difficulty' | 'createdAt' | 'updatedAt' | 'points';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Question validation result
 */
export interface QuestionValidationResult {
  isValid: boolean;
  errors: QuestionValidationError[];
  warnings: QuestionValidationError[];
}

/**
 * Question validation error
 */
export interface QuestionValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Category creation request
 */
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
}

/**
 * Tag creation request
 */
export interface CreateTagRequest {
  name: string;
  color?: string;
}

/**
 * Bulk question operation result
 */
export interface BulkQuestionResult {
  success: boolean;
  totalQuestions: number;
  successCount: number;
  errorCount: number;
  errors: BulkQuestionError[];
}

/**
 * Bulk question operation error
 */
export interface BulkQuestionError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
} 