/**
 * Question type definitions for the GMATHS platform
 * Supports extensible question types with LaTeX content
 */

export type QuestionType = 'multiple-choice' | 'multiple-select' | 'true-false' | 'fill-blank' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Base question interface that all question types extend
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  content: string; // LaTeX-enabled content
  explanation?: string;
  points: number;
  category: string;
  difficulty: Difficulty;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Multiple choice question (single correct answer)
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: QuestionOption[];
}

/**
 * Multiple select question (multiple correct answers)
 */
export interface MultipleSelectQuestion extends BaseQuestion {
  type: 'multiple-select';
  options: QuestionOption[];
}

/**
 * True/False question
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
  showRandomOrder?: boolean; // Randomize True/False order
}

/**
 * Fill in the blank question
 */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank';
  blanks: FillBlankOption[];
  caseSensitive?: boolean;
}

/**
 * Essay question (long-form response)
 */
export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  maxWords?: number;
  minWords?: number;
  rubric?: string;
}

/**
 * Question option for multiple choice/select questions
 */
export interface QuestionOption {
  id: string;
  text: string; // LaTeX-enabled text
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Fill in the blank option
 */
export interface FillBlankOption {
  id: string;
  position: number; // Position in the text (0-based)
  acceptedAnswers: string[]; // Multiple acceptable answers
  caseSensitive: boolean;
  placeholder?: string;
}

/**
 * Union type for all question types
 */
export type Question = 
  | MultipleChoiceQuestion 
  | MultipleSelectQuestion 
  | TrueFalseQuestion 
  | FillBlankQuestion 
  | EssayQuestion;

/**
 * Question creation form data
 */
export interface QuestionCreateForm {
  type: QuestionType;
  content: string;
  explanation?: string;
  points: number;
  category: string;
  difficulty: Difficulty;
  tags?: string[];
  // Type-specific data will be added based on question type
  options?: Omit<QuestionOption, 'id'>[];
  correctAnswer?: boolean;
  blanks?: Omit<FillBlankOption, 'id'>[];
  maxWords?: number;
  minWords?: number;
  rubric?: string;
  caseSensitive?: boolean;
  showRandomOrder?: boolean;
}

/**
 * Question update form data
 */
export interface QuestionUpdateForm extends Partial<QuestionCreateForm> {
  id: string;
}

/**
 * Question filters for search and listing
 */
export interface QuestionFilters {
  search?: string;
  type?: QuestionType | 'all';
  category?: string | 'all';
  difficulty?: Difficulty | 'all';
  tags?: string[];
  createdBy?: string;
  sortBy?: 'title' | 'category' | 'difficulty' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Question list response
 */
export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: QuestionFilters;
}

/**
 * Question bank statistics
 */
export interface QuestionBankStats {
  totalQuestions: number;
  questionsByType: Record<QuestionType, number>;
  questionsByCategory: Record<string, number>;
  questionsByDifficulty: Record<Difficulty, number>;
  recentlyAdded: number;
  recentlyUpdated: number;
}

/**
 * Question validation result
 */
export interface QuestionValidation {
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
 * Question import/export interfaces
 */
export interface QuestionImportResult {
  success: boolean;
  totalQuestions: number;
  successCount: number;
  errorCount: number;
  errors: QuestionImportError[];
  questions: Question[];
}

export interface QuestionImportError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
}

/**
 * Question categories
 */
export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Utility type helpers
 */
export type QuestionWithoutId = Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type QuestionPreview = Pick<Question, 'id' | 'type' | 'content' | 'category' | 'difficulty' | 'points'>; 