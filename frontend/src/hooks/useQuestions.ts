/**
 * useQuestions hook for fetching and managing questions data
 */

import { useQuery } from '@tanstack/react-query';
import { fetchQuestions, fetchQuestion } from '../api/questions';
import type { QuestionFilters, QuestionListResponse } from '../types/questions';

/**
 * Hook for fetching paginated questions with filters
 */
export const useQuestions = (
  filters: QuestionFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery<QuestionListResponse>({
    queryKey: ['questions', filters, page, limit],
    queryFn: () => fetchQuestions(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching a single question by ID
 */
export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () => fetchQuestion(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}; 