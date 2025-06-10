/**
 * Custom hooks for grading and analytics functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExamResults,
  getMyExamResults,
  getExamLeaderboard,
  getExamAnalytics,
  getStudentResults,
  getMyResults,
  getGradingDashboardStats,
  regradeExam,
  exportExamResults,
} from '../api/grading';
// Types are imported directly where used to avoid unused import warnings

/**
 * Hook to get detailed exam results for a specific student (Admin only)
 */
export const useExamResults = (examId: string, userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examResults', examId, userId],
    queryFn: () => getExamResults(examId, userId),
    enabled: enabled && !!examId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get detailed exam results for current student
 */
export const useMyExamResults = (examId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['myExamResults', examId],
    queryFn: () => getMyExamResults(examId),
    enabled: enabled && !!examId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get leaderboard for an exam
 */
export const useExamLeaderboard = (examId: string, limit: number = 50, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examLeaderboard', examId, limit],
    queryFn: () => getExamLeaderboard(examId, limit),
    enabled: enabled && !!examId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get performance analytics for an exam (Admin only)
 */
export const useExamAnalytics = (examId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examAnalytics', examId],
    queryFn: () => getExamAnalytics(examId),
    enabled: enabled && !!examId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get all exam results for a specific student (Admin or self only)
 */
export const useStudentResults = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['studentResults', userId],
    queryFn: () => getStudentResults(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get all exam results for current student
 */
export const useMyResults = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['myResults'],
    queryFn: getMyResults,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get grading dashboard statistics (Admin only)
 */
export const useGradingDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['gradingDashboardStats'],
    queryFn: getGradingDashboardStats,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to regrade an exam with updated scoring algorithms (Admin only)
 */
export const useRegradeExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regradeExam,
    onSuccess: (_data, examId) => {
      // Invalidate related queries after successful regrade
      queryClient.invalidateQueries({ queryKey: ['examResults', examId] });
      queryClient.invalidateQueries({ queryKey: ['examLeaderboard', examId] });
      queryClient.invalidateQueries({ queryKey: ['examAnalytics', examId] });
      queryClient.invalidateQueries({ queryKey: ['gradingDashboardStats'] });
    },
  });
};

/**
 * Hook to export exam results as CSV (Admin only)
 */
export const useExportExamResults = () => {
  return useMutation({
    mutationFn: exportExamResults,
    onSuccess: (blob, examId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-${examId}-results.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}; 