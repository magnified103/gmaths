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
  getExamAttempts,
  getExamAttemptResults,
  getStudentExamAttemptResults,
  getMyGroupedResults,
  getExamSummaries,
  getStudentSummaries,
  getExamResultsForExam,
  getExamInfoAndStats,
  getStudentInfoAndStats,
} from '../api/grading';

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
 * Hook to export exam results as CSV/Excel
 */
export const useExportExamResults = () => {
  return useMutation({
    mutationFn: exportExamResults,
    onSuccess: (blob, examId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-${examId}-results.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Hook to get all attempts for an exam by current student
 */
export const useExamAttempts = (examId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examAttempts', examId],
    queryFn: () => getExamAttempts(examId),
    enabled: enabled && !!examId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get specific attempt results for current student
 */
export const useExamAttemptResults = (examId: string, attemptNumber: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examAttemptResults', examId, attemptNumber],
    queryFn: () => getExamAttemptResults(examId, attemptNumber),
    enabled: enabled && !!examId && attemptNumber > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get specific attempt results for a student (Admin only)
 */
export const useStudentExamAttemptResults = (
  examId: string, 
  userId: string, 
  attemptNumber: number, 
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['studentExamAttemptResults', examId, userId, attemptNumber],
    queryFn: () => getStudentExamAttemptResults(examId, userId, attemptNumber),
    enabled: enabled && !!examId && !!userId && attemptNumber > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get grouped exam history for current student
 */
export const useMyGroupedResults = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['myGroupedResults'],
    queryFn: getMyGroupedResults,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get exam summaries for admin dashboard
 */
export const useExamSummaries = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examSummaries'],
    queryFn: getExamSummaries,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get student summaries for admin dashboard
 */
export const useStudentSummaries = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['studentSummaries'],
    queryFn: getStudentSummaries,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get all exam results for a specific exam (Admin only)
 */
export const useExamResultsForExam = (examId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examResultsForExam', examId],
    queryFn: () => getExamResultsForExam(examId),
    enabled: enabled && !!examId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get exam info and statistics for admin (Admin only)
 */
export const useExamInfoAndStats = (examId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['examInfoAndStats', examId],
    queryFn: () => getExamInfoAndStats(examId),
    enabled: enabled && !!examId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get student info and statistics for admin (Admin only)
 */
export const useStudentInfoAndStats = (studentId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['studentInfoAndStats', studentId],
    queryFn: () => getStudentInfoAndStats(studentId),
    enabled: enabled && !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 