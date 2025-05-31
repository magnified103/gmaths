/**
 * useExams hook for fetching and managing exam data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchExams, 
  fetchExam, 
  createExam, 
  updateExam, 
  deleteExam, 
  publishExam, 
  archiveExam,
  duplicateExam,
  fetchExamPreview 
} from '../api/exams';
import type { 
  ExamFilters, 
  ExamListResponse, 
  CreateExamRequest, 
  UpdateExamRequest 
} from '../types/exams';

/**
 * Hook for fetching paginated exams with filters
 */
export const useExams = (
  filters: ExamFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery<ExamListResponse>({
    queryKey: ['exams', filters, page, limit],
    queryFn: () => fetchExams(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching a single exam by ID
 */
export const useExam = (id: string) => {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => fetchExam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching exam preview
 */
export const useExamPreview = (id: string) => {
  return useQuery({
    queryKey: ['exam-preview', id],
    queryFn: () => fetchExamPreview(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for creating a new exam
 */
export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

/**
 * Hook for updating an existing exam
 */
export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExam,
    onSuccess: (data, variables) => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      // Update specific exam cache
      queryClient.setQueryData(['exam', variables.id], data);
    },
  });
};

/**
 * Hook for deleting an exam
 */
export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

/**
 * Hook for publishing an exam
 */
export const usePublishExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishExam,
    onSuccess: (data) => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      // Update specific exam cache
      queryClient.setQueryData(['exam', data.id], data);
    },
  });
};

/**
 * Hook for archiving an exam
 */
export const useArchiveExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveExam,
    onSuccess: (data) => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      // Update specific exam cache
      queryClient.setQueryData(['exam', data.id], data);
    },
  });
};

/**
 * Hook for duplicating an exam
 */
export const useDuplicateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title?: string }) => 
      duplicateExam(id, title),
    onSuccess: () => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}; 