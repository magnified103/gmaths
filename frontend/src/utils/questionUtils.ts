/**
 * Centralized utility functions and constants for question management
 * This eliminates redundant code across QuestionCard, QuestionList, QuestionPreview components
 */

import { decode } from 'html-entities';
import type { QuestionType, Difficulty } from '../types/questions';

// Centralized question type mappings
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'Trắc nghiệm (1 đáp án)',
  'multiple-select': 'Trắc nghiệm (nhiều đáp án)', 
  'true-false': 'Đúng/Sai',
  'fill-blank': 'Điền khuyết',
  'essay': 'Tự luận',
};

// Centralized difficulty mappings
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình', 
  hard: 'Khó',
};

export const DIFFICULTY_BADGE_STATUS: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

// Centralized category mappings - should eventually come from API
export const CATEGORY_LABELS: Record<string, string> = {
  algebra: 'Đại số',
  geometry: 'Hình học', 
  calculus: 'Giải tích',
  statistics: 'Thống kê',
  trigonometry: 'Lượng giác',
};

/**
 * Get question type display text
 */
export function getQuestionTypeText(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type] || type;
}

/**
 * Get difficulty display text
 */
export function getDifficultyText(difficulty: Difficulty): string {
  return DIFFICULTY_LABELS[difficulty] || difficulty;
}

/**
 * Get difficulty badge status for UI components
 */
export function getDifficultyBadgeStatus(difficulty: Difficulty) {
  return DIFFICULTY_BADGE_STATUS[difficulty] || 'info' as const;
}

/**
 * Get difficulty info with both text and status
 */
export function getDifficultyInfo(difficulty: Difficulty) {
  return {
    text: getDifficultyText(difficulty),
    status: getDifficultyBadgeStatus(difficulty)
  };
}

/**
 * Get category display text
 */
export function getCategoryText(category: string | { id: string; name: string } | null): string {
  if (!category) return 'Chưa phân loại';
  
  if (typeof category === 'object') {
    return category.name;
  }
  
  return CATEGORY_LABELS[category] || category;
}

/**
 * Improved text truncation that handles HTML content properly
 * Strips HTML tags and decodes entities before truncating
 */
export function truncateText(htmlText: string, maxLength: number = 120): string {
  if (!htmlText) return '';
  
  try {
    // First decode HTML entities
    const decoded = decode(htmlText);
    
    // Strip HTML tags using a simple regex (for display purposes)
    const textOnly = decoded.replace(/<[^>]*>/g, '').trim();
    
    if (textOnly.length <= maxLength) return textOnly;
    return textOnly.substring(0, maxLength) + '...';
  } catch (error) {
    // Fallback to original text if decoding fails
    const textOnly = htmlText.replace(/<[^>]*>/g, '').trim();
    if (textOnly.length <= maxLength) return textOnly;
    return textOnly.substring(0, maxLength) + '...';
  }
}

/**
 * Extract plain text content from HTML string for character counting
 * Used in forms for validation and character limits
 */
export function getTextContent(htmlString: string): string {
  if (!htmlString) return '';
  
  try {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // Replace math blocks with their LaTeX content
    const mathBlocks = tempDiv.querySelectorAll('.math-block[data-latex]');
    mathBlocks.forEach(block => {
      const latex = block.getAttribute('data-latex');
      if (latex) {
        try {
          const decodedLatex = decodeURIComponent(latex);
          block.textContent = decodedLatex;
        } catch {
          // Keep original text if decoding fails
        }
      }
    });
    
    // Get plain text content
    return tempDiv.textContent || tempDiv.innerText || '';
  } catch (error) {
    // Fallback: simple HTML tag removal
    return htmlString.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Format creation date for display
 */
export function formatQuestionDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('vi-VN');
  } catch (error) {
    return 'Không xác định';
  }
}

/**
 * Generate option labels (A, B, C, D, ...)
 */
export function getOptionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Validate if a question has all required fields based on type
 */
export function validateQuestionRequiredFields(question: any): boolean {
  if (!question.content || !question.type) return false;
  
  switch (question.type) {
    case 'multiple-choice':
    case 'multiple-select':
      return !!(question.options && question.options.length >= 2);
    case 'true-false':
      return question.correctAnswer !== undefined;
    case 'fill-blank':
      return !!(question.blanks && question.blanks.length > 0);
    case 'essay':
      return true; // Essay questions only need content
    default:
      return false;
  }
}

/**
 * Get question difficulty color for CSS classes
 */
export function getDifficultyColor(difficulty: Difficulty): string {
  const colors = {
    easy: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    hard: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[difficulty] || 'text-gray-600 bg-gray-50 border-gray-200';
} 