/**
 * useCategories hook for fetching question categories
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/questions';
import type { QuestionCategory } from '../types/questions';

/**
 * Hook for fetching question categories
 */
export const useCategories = () => {
  return useQuery<QuestionCategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}; 