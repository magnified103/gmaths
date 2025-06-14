/**
 * Question API functions for frontend
 * Handles CRUD operations for questions with TypeScript validation
 */

import type { 
  Question, 
  QuestionCreateForm, 
  QuestionUpdateForm, 
  QuestionListResponse, 
  QuestionFilters,
  QuestionValidation,
  QuestionCategory,
} from '../types/questions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Prepare question data for backend API (types are now consistent)
 * @param formData - Frontend form data
 * @returns Backend request format with typeData
 */
function prepareQuestionData(formData: QuestionCreateForm) {
  // Prepare type-specific data based on question type
  let typeData: any = {};

  switch (formData.type) {
    case 'multiple-choice':
    case 'multiple-select':
      typeData = {
        options: formData.options?.map((option, index) => ({
          id: `opt_${index}`, // Generate temporary ID
          text: option.text,
          isCorrect: option.isCorrect,
          explanation: option.explanation || undefined
        })) || [],
        randomizeOptions: false,
        partialCredit: formData.type === 'multiple-select' ? false : undefined
      };
      break;

    case 'true-false':
      typeData = {
        correctAnswer: formData.correctAnswer || false,
        randomizeOrder: formData.showRandomOrder || false
      };
      break;

    case 'fill-blank':
      typeData = {
        blanks: formData.blanks?.map((blank, index) => ({
          id: `blank_${index}`,
          position: blank.position || index,
          acceptedAnswers: blank.acceptedAnswers || [],
          caseSensitive: blank.caseSensitive || false,
          placeholder: blank.placeholder
        })) || [],
        caseSensitive: formData.caseSensitive || false
      };
      break;

    case 'essay':
      typeData = {
        maxWords: formData.maxWords,
        minWords: formData.minWords,
        rubric: formData.rubric
      };
      break;

    default:
      throw new Error(`Unsupported question type: ${formData.type}`);
  }

  return {
    type: formData.type, // No conversion needed - types are consistent
    content: formData.content,
    explanation: formData.explanation,
    points: formData.points,
    difficulty: formData.difficulty, // No conversion needed
    categoryId: formData.category, // Frontend uses 'category', backend expects 'categoryId'
    tagIds: formData.tags || [],
    imageUrl: formData.imageUrl, // Include imageUrl field
    typeData
  };
}

/**
 * Builds query string from question filters and pagination.
 * @param filters - Question filtering and sorting options.
 * @param page - Page number (1-based).
 * @param limit - Number of items per page.
 * @returns Query string for API request.
 */
function buildQueryString(
  filters: Partial<QuestionFilters>,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();
  
  // Add pagination parameters
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  // Add filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params.toString();
}

/**
 * Fetches paginated list of questions with filtering and sorting.
 * @param filters - Filtering and pagination options.
 * @param page - Page number (1-based).
 * @param limit - Number of items per page.
 * @returns Promise resolving to question list response.
 */
export async function fetchQuestions(
  filters: Partial<QuestionFilters> = {},
  page: number = 1,
  limit: number = 20
): Promise<QuestionListResponse> {
  const queryString = buildQueryString(filters, page, limit);
  const url = `${API_BASE_URL}/api/questions?${queryString}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Không thể tải danh sách câu hỏi: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // Handle backend response format with success wrapper
  if (result.success && result.data) {
    return result.data;
  }
  
  // Fallback if response is already in the expected format
  return result;
}

/**
 * Fetches a single question by ID.
 * @param questionId - Question ID to fetch.
 * @returns Promise resolving to question data.
 */
export async function fetchQuestion(questionId: string): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Không thể tải thông tin câu hỏi: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Creates a new question.
 * @param questionData - Question creation form data.
 * @returns Promise resolving to created question data.
 */
export async function createQuestion(questionData: QuestionCreateForm): Promise<Question> {
  const backendData = prepareQuestionData(questionData);
  const response = await fetch(`${API_BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(backendData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tạo câu hỏi mới');
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Updates an existing question.
 * @param questionId - Question ID to update.
 * @param questionData - Question update form data.
 * @returns Promise resolving to updated question data.
 */
export async function updateQuestion(questionId: string, questionData: QuestionUpdateForm): Promise<Question> {
  // Remove the id from the data and convert to backend format
  const { id, ...formData } = questionData;
  const backendData = prepareQuestionData(formData as QuestionCreateForm);
  
  const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(backendData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể cập nhật câu hỏi');
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Deletes a question by ID.
 * @param questionId - Question ID to delete.
 * @returns Promise resolving when deletion is complete.
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể xóa câu hỏi');
  }
}

/**
 * Validates question data.
 * @param questionData - Question data to validate.
 * @returns Promise resolving to validation result.
 */
export async function validateQuestion(questionData: Partial<QuestionCreateForm>): Promise<QuestionValidation> {
  const response = await fetch(`${API_BASE_URL}/api/questions/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(questionData),
  });
  
  if (!response.ok) {
    throw new Error('Không thể xác thực câu hỏi');
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Fetches available question categories.
 * @returns Promise resolving to list of categories.
 */
export async function fetchCategories(): Promise<QuestionCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/questions/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Không thể tải danh sách chủ đề');
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Creates a new question category.
 * @param categoryData - Category data to create.
 * @returns Promise resolving to created category.
 */
export async function createCategory(categoryData: Omit<QuestionCategory, 'id' | 'questionCount' | 'createdAt' | 'updatedAt'>): Promise<QuestionCategory> {
  const response = await fetch(`${API_BASE_URL}/api/questions/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify(categoryData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tạo chủ đề mới');
  }
  
  const result = await response.json();
  return result.data || result;
}

/**
 * Gets available tags for questions.
 * @returns Promise resolving to list of tags.
 */
export async function fetchTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/questions/tags`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Không thể tải danh sách tags');
  }
  
  const result = await response.json();
  return result.data || result;
}