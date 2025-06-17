/**
 * Grading API functions for frontend
 * Handles scoring, results, leaderboards, and analytics
 */

import { API_BASE_URL } from './config';

// Export interfaces directly here to avoid unused imports
export interface QuestionResult {
  questionId: string;
  questionContent: string;
  questionType: string;
  questionOptions?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }> | null;
  points: number;
  earnedPoints: number;
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer?: any;
  explanation?: string;
  timeSpent?: number;
}

/**
 * Complete exam result interface
 */
export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  gradedAt?: string;
  questionResults: QuestionResult[];
  rank?: number;
  totalStudents?: number;
  averageScore?: number;
  highestScore?: number;
  attemptNumber: number;
  attemptStartedAt?: string;
  attemptCompletedAt?: string;
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number;
  submittedAt: string;
  correctAnswers: number;
  totalQuestions: number;
  isCurrentUser?: boolean;
}

/**
 * Leaderboard statistics interface
 */
export interface LeaderboardStats {
  totalStudents: number;
  averageScore: number;
  averagePercentage: number;
  averageTime: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

/**
 * Student exam history interface
 */
export interface StudentExamHistory {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  gradedAt?: string;
  isAutoSubmit: boolean;
  attemptNumber: number;
  attemptStartedAt?: string;
  attemptCompletedAt?: string;
}

/**
 * Grading dashboard statistics
 */
export interface GradingDashboardStats {
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
  recentSubmissions: number;
  passRate: number;
  averageGradingTime: number;
}

/**
 * Performance analytics interface
 */
export interface PerformanceAnalytics {
  examId: string;
  questionAnalytics: Array<{
    questionId: string;
    averageScore: number;
    correctAnswerRate: number;
    averageTimeSpent: number;
    difficultyRating: number;
    commonErrors: Array<{
      errorType: string;
      frequency: number;
      description: string;
    }>;
  }>;
  overallStats: {
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    averageCompletionTime: number;
    scoreDistribution: Record<string, number>;
  };
}

/**
 * Regrade result interface
 */
export interface RegradeResult {
  totalSubmissions: number;
  regradedCount: number;
  errors?: string[];
}

/**
 * Interface for exam attempt information
 */
export interface ExamAttempt {
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  submissionId?: string;
  submission?: {
    id: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
    gradedAt?: string;
    isAutoSubmit: boolean;
  };
}

/**
 * Interface for grouped exam history
 */
export interface GroupedExamHistory {
  examId: string;
  examTitle: string;
  examStatus: string;
  attempts: Array<{
    id: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    timeSpent: number;
    submittedAt: string;
    gradedAt?: string;
    isAutoSubmit: boolean;
    attemptNumber: number;
    attemptStartedAt?: string;
    attemptCompletedAt?: string;
  }>;
}

/**
 * Generic API fetch function with auth
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth-token');
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Get detailed exam results for a specific student (Admin only)
 */
export const getExamResults = async (examId: string, userId: string): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/grading/exams/${examId}/results/${userId}`);
};

/**
 * Get detailed exam results for current student
 */
export const getMyExamResults = async (examId: string): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/grading/exams/${examId}/results/me`);
};

/**
 * Get leaderboard for an exam
 */
export const getExamLeaderboard = async (
  examId: string, 
  limit: number = 50
): Promise<{ entries: LeaderboardEntry[]; examId: string }> => {
  return apiFetch<{ entries: LeaderboardEntry[]; examId: string }>(
    `/grading/exams/${examId}/leaderboard?limit=${limit}`
  );
};

/**
 * Get performance analytics for an exam (Admin only)
 */
export const getExamAnalytics = async (examId: string): Promise<PerformanceAnalytics> => {
  return apiFetch<PerformanceAnalytics>(`/grading/exams/${examId}/analytics`);
};

/**
 * Get all exam results for a specific student (Admin or self only)
 */
export const getStudentResults = async (userId: string): Promise<StudentExamHistory[]> => {
  return apiFetch<StudentExamHistory[]>(`/grading/students/${userId}/results`);
};

/**
 * Get all exam results for current student
 */
export const getMyResults = async (): Promise<StudentExamHistory[]> => {
  return apiFetch<StudentExamHistory[]>(`/grading/students/me/results`);
};

/**
 * Get grading dashboard statistics (Admin only)
 */
export const getGradingDashboardStats = async (): Promise<GradingDashboardStats> => {
  return apiFetch<GradingDashboardStats>('/grading/dashboard/stats');
};

/**
 * Regrade an exam with updated scoring algorithms (Admin only)
 */
export const regradeExam = async (examId: string): Promise<RegradeResult> => {
  return apiFetch<RegradeResult>(`/grading/exams/${examId}/regrade`, {
    method: 'POST',
  });
};

/**
 * Export exam results to CSV/PDF (Admin only)
 */
export const exportExamResults = async (examId: string): Promise<Blob> => {
  const token = localStorage.getItem('auth-token');

  const response = await fetch(`${API_BASE_URL}/grading/exams/${examId}/export`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export results');
  }
  return response.blob();
};

/**
 * Get all attempts for current student for a specific exam
 */
export const getExamAttempts = async (examId: string): Promise<ExamAttempt[]> => {
  return apiFetch<ExamAttempt[]>(`/grading/exams/${examId}/attempts/me`);
};

/**
 * Get exam results for a specific attempt for current student
 */
export const getExamAttemptResults = async (examId: string, attemptNumber: number): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/grading/exams/${examId}/attempts/${attemptNumber}/results/me`);
};

/**
 * Get exam results for a specific attempt for a specific student (Admin)
 */
export const getStudentExamAttemptResults = async (
  examId: string, 
  userId: string, 
  attemptNumber: number
): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/grading/exams/${examId}/attempts/${attemptNumber}/results/${userId}`);
};

/**
 * Get all exam results for current student, grouped by exam
 */
export const getMyGroupedResults = async (): Promise<GroupedExamHistory[]> => {
  return apiFetch<GroupedExamHistory[]>('/grading/students/me/results/grouped');
};

/**
 * Get summaries for all exams for the admin dashboard
 */
export const getExamSummaries = async (): Promise<Array<{
  id: string;
  title: string;
  totalStudents: number;
  completedStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  createdAt: string;
  status: 'active' | 'archived' | 'draft';
}>> => {
  return apiFetch<any>('/grading/summaries/exams');
};

/**
 * Get summaries for all students for the admin dashboard
 */
export const getStudentSummaries = async (): Promise<Array<{
  id: string;
  name: string;
  email: string;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  lastActivity: string;
  overallPerformance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}>> => {
  return apiFetch<any>('/grading/summaries/students');
};

/**
 * Get all results for a specific exam
 */
export const getExamResultsForExam = async (examId: string): Promise<Array<{
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  gradedAt?: string;
  attemptNumber: number;
  correctAnswers: number;
  totalQuestions: number;
  isAutoSubmit: boolean;
  rank?: number;
}>> => {
  return apiFetch<any>(`/grading/results/exam/${examId}`);
};

/**
 * Get detailed information and statistics for a specific exam
 */
export const getExamInfoAndStats = async (examId: string): Promise<{
  examInfo: {
    id: string;
    title: string;
    description?: string;
    totalQuestions: number;
    totalPoints: number;
    passingScore: number;
    timeLimit: number;
    createdAt: string;
    status: 'active' | 'archived' | 'draft';
  };
  statistics: {
    totalStudents: number;
    completedStudents: number;
    averageScore: number;
    averagePercentage: number;
    averageTime: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    scoreDistribution: Record<string, number>;
  };
}> => {
  return apiFetch<any>(`/grading/details/exam/${examId}`);
};

/**
 * Get detailed information and statistics for a specific student
 */
export const getStudentInfoAndStats = async (studentId: string): Promise<{
  studentInfo: {
    id: string;
    name: string;
    email: string;
    studentId?: string;
    joinedAt: string;
    lastActivity: string;
    totalExams: number;
    completedExams: number;
    averageScore: number;
    overallPerformance: 'excellent' | 'good' | 'average' | 'needs_improvement';
  };
  statistics: {
    totalExamsCompleted: number;
    totalExamsAvailable: number;
    averageScore: number;
    averagePercentage: number;
    averageTime: number;
    bestScore: number;
    worstScore: number;
    passRate: number;
    totalTimeSpent: number;
    streakDays: number;
    completionRate: number;
    performanceTrend: 'improving' | 'declining' | 'stable';
  };
}> => {
  return apiFetch<any>(`/grading/details/student/${studentId}`);
};