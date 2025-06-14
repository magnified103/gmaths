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
  const token = localStorage.getItem('auth-token');
  
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

/**
 * Get all attempts for an exam by current student
 */
export const getExamAttempts = async (examId: string): Promise<ExamAttempt[]> => {
  return apiFetch<ExamAttempt[]>(`/api/grading/exams/${examId}/attempts`);
};

/**
 * Get specific attempt results for current student
 */
export const getExamAttemptResults = async (examId: string, attemptNumber: number): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/api/grading/exams/${examId}/attempts/${attemptNumber}`);
};

/**
 * Get specific attempt results for a student (Admin only)
 */
export const getStudentExamAttemptResults = async (
  examId: string, 
  userId: string, 
  attemptNumber: number
): Promise<ExamResult> => {
  return apiFetch<ExamResult>(`/api/grading/exams/${examId}/attempts/${userId}/${attemptNumber}`);
};

/**
 * Get grouped exam history for current student
 */
export const getMyGroupedResults = async (): Promise<GroupedExamHistory[]> => {
  return apiFetch<GroupedExamHistory[]>('/api/grading/students/me/results/grouped');
};

/**
 * Get exam summaries for admin dashboard
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
  return apiFetch<any[]>('/api/admin/exam-summaries');
};

/**
 * Get student summaries for admin dashboard
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
  return apiFetch<any[]>('/api/admin/student-summaries');
};

/**
 * Get all exam results for a specific exam (Admin only)
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
  return apiFetch<any[]>(`/api/grading/exams/${examId}/all-results`);
};

/**
 * Get exam info and statistics for admin (Admin only)
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
  return apiFetch<any>(`/api/grading/exams/${examId}/info-stats`);
};

/**
 * Get student info and statistics for admin (Admin only)
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
  return apiFetch<any>(`/api/grading/students/${studentId}/info-stats`);
}; 