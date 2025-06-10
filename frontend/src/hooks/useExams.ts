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
  fetchExamPreview,
  fetchTakeableExams,
  checkExamAvailability,
  fetchExamForTaking
} from '../api/exams';
import type { 
  ExamFilters, 
  ExamListResponse, 
  CreateExamRequest, 
  UpdateExamRequest,
  ExamAvailability,
  ExamWithQuestions
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
    mutationFn: ({ examId, newTitle }: { examId: string; newTitle?: string }) =>
      duplicateExam(examId, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error) => {
      console.error('Failed to duplicate exam:', error);
    },
  });
};

// Student exam hooks
export const useTakeableExams = (
  filters: ExamFilters = {},
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['takeable-exams', filters],
    queryFn: () => fetchTakeableExams(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useExamAvailability = (examId: string) => {
  return useQuery({
    queryKey: ['exam-availability', examId],
    queryFn: () => checkExamAvailability(examId),
    enabled: !!examId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useExamForTaking = () => {
  return useMutation({
    mutationFn: ({ examId, password }: { examId: string; password?: string }) =>
      fetchExamForTaking(examId, password),
    onError: (error) => {
      console.error('Failed to fetch exam for taking:', error);
    },
  });
}; 