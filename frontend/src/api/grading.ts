/**
 * Grading API functions for frontend
 * Handles scoring, results, leaderboards, and analytics
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Export interfaces directly here to avoid unused imports
export interface QuestionResult {
  questionId: string;
  questionContent: string;
  questionType: string;
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
 * Generic API fetch function with auth
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
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
  return apiFetch<ExamResult>(`/api/grading/exams/${examId}/results/${userId}`);
};

/**
 * Get detailed exam results for current student
 */
export const getMyExamResults = async (examId: string): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/api/grading/exams/${examId}/results/me`);
};

/**
 * Get leaderboard for an exam
 */
export const getExamLeaderboard = async (
  examId: string, 
  limit: number = 50
): Promise<{ entries: LeaderboardEntry[]; examId: string }> => {
  return apiFetch<{ entries: LeaderboardEntry[]; examId: string }>(
    `/api/grading/exams/${examId}/leaderboard?limit=${limit}`
  );
};

/**
 * Get performance analytics for an exam (Admin only)
 */
export const getExamAnalytics = async (examId: string): Promise<PerformanceAnalytics> => {
  return apiFetch<PerformanceAnalytics>(`/api/grading/exams/${examId}/analytics`);
};

/**
 * Get all exam results for a specific student (Admin or self only)
 */
export const getStudentResults = async (userId: string): Promise<StudentExamHistory[]> => {
  return apiFetch<StudentExamHistory[]>(`/api/grading/students/${userId}/results`);
};

/**
 * Get all exam results for current student
 */
export const getMyResults = async (): Promise<StudentExamHistory[]> => {
  return apiFetch<StudentExamHistory[]>('/api/grading/students/me/results');
};

/**
 * Get grading dashboard statistics (Admin only)
 */
export const getGradingDashboardStats = async (): Promise<GradingDashboardStats> => {
  return apiFetch<GradingDashboardStats>('/api/grading/dashboard/stats');
};

/**
 * Regrade an exam with updated scoring algorithms (Admin only)
 */
export const regradeExam = async (examId: string): Promise<RegradeResult> => {
  return apiFetch<RegradeResult>(`/api/grading/exams/${examId}/regrade`, {
    method: 'POST',
  });
};

/**
 * Export exam results as CSV (Admin only)
 */
export const exportExamResults = async (examId: string): Promise<Blob> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}/api/grading/exams/${examId}/export`, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to export results: ${response.statusText}`);
  }

  return response.blob();
}; 