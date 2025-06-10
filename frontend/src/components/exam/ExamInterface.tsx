import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  CloudIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { TimerDisplay } from './TimerDisplay';
import { AnswerInput } from '../question/AnswerInput';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import { 
  checkExamAvailability, 
  fetchExamForTaking, 
  submitExamAnswers,
  updateExamSession,
  syncExamSessionBeacon
} from '../../api/exams';
import type { ExamSubmission, ExamForTaking, ExamAnswer } from '../../types/exams';

/**
 * Session state management for exam taking with robust recovery capabilities
 */
interface ExamSessionState {
  sessionId: string;
  currentQuestion: number;
  timeRemaining: number;
  answers: ExamAnswer[];
  lastSync: Date;
  isDirty: boolean; // Has unsaved changes
}

/**
 * Main exam taking interface with session-based state management
 * Provides robust exam experience with session recovery and real-time synchronization
 */
export const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Core exam state
  const [exam, setExam] = useState<ExamForTaking | null>(null);
  const [sessionState, setSessionState] = useState<ExamSessionState | null>(null);
  
  // UI state
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Password authentication state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [examPassword, setExamPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Session sync interval
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date>(new Date());

  // Check exam availability
  const {
    data: availability,
    isLoading: isCheckingAvailability,
    error: availabilityError,
  } = useQuery({
    queryKey: ['exam-availability', examId],
    queryFn: () => checkExamAvailability(examId!),
    enabled: !!examId,
    staleTime: 0,
    retry: 1,
  });

  /**
   * Session synchronization with backend
   */
  const syncSessionState = useCallback(async (updates: Partial<ExamSessionState>) => {
    if (!sessionState || !exam) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Update session via API
      const updatedSession = await updateExamSession(sessionState.sessionId, {
        currentQuestion: updates.currentQuestion ?? sessionState.currentQuestion,
        timeRemaining: updates.timeRemaining ?? sessionState.timeRemaining,
        answers: updates.answers ?? sessionState.answers,
        sessionData: {}
      });

      // Update local state with response from backend
      const updatedState: ExamSessionState = {
        sessionId: updatedSession.sessionId,
        currentQuestion: updatedSession.currentQuestion,
        timeRemaining: updatedSession.timeRemaining,
        answers: updatedSession.answers,
        lastSync: new Date(),
        isDirty: false
      };

      setSessionState(updatedState);
      setLastSyncTime(new Date());
      lastSyncRef.current = new Date();

      // Save to localStorage as backup
      localStorage.setItem(`exam-session-${examId}`, JSON.stringify(updatedState));
      
      console.log('Session synced successfully:', updatedState);
    } catch (err) {
      console.error('Session sync failed:', err);
      setSyncError(err instanceof Error ? err.message : 'Đồng bộ thất bại');
      
      // Fallback: still update local state but mark as dirty
      const fallbackState = {
        ...sessionState,
        ...updates,
        lastSync: new Date(),
        isDirty: true // Mark as dirty since sync failed
      };
      setSessionState(fallbackState);
      localStorage.setItem(`exam-session-${examId}`, JSON.stringify(fallbackState));
    } finally {
      setIsSyncing(false);
    }
  }, [sessionState, exam, examId]);

  /**
   * Recover session state from backend or localStorage
   */
  const recoverSessionState = useCallback((examData: ExamForTaking): ExamSessionState => {
    console.log('🔄 Recovering session state for exam:', examData.title);
    console.log('🔄 Backend session data:', examData.sessionData);
    console.log('🔄 Session ID from backend:', examData.sessionId);
    
    // Always prioritize backend session data - it's the source of truth
    if (examData.sessionData && examData.sessionData.startedAt) {
      const backendState: ExamSessionState = {
        sessionId: examData.sessionId,
        currentQuestion: examData.sessionData.currentQuestion || 0,
        timeRemaining: examData.sessionData.timeRemaining || (examData.timeLimit * 60),
        answers: examData.sessionData.answers || [],
        lastSync: new Date(examData.sessionData.startedAt),
        isDirty: false // Backend data is already synced
      };
      
      console.log('✅ Recovered session state from backend:', backendState);
      
      // Also update localStorage with the authoritative backend data
      localStorage.setItem(`exam-session-${examId}`, JSON.stringify(backendState));
      
      return backendState;
    }

    // If backend doesn't have session data, check localStorage as fallback
    const localState = localStorage.getItem(`exam-session-${examId}`);
    if (localState) {
      try {
        const parsed = JSON.parse(localState);
        console.log('⚠️ Using localStorage session data (backend had no session data):', parsed);
        
        // Validate that the session IDs match
        if (parsed.sessionId && parsed.sessionId !== examData.sessionId) {
          console.log('⚠️ Session ID mismatch - localStorage vs backend:', parsed.sessionId, 'vs', examData.sessionId);
        }
        
        return {
          ...parsed,
          sessionId: examData.sessionId, // Always use the current session ID from backend
          lastSync: new Date(parsed.lastSync),
          isDirty: true // Mark as dirty since backend should be updated with this data
        };
      } catch (err) {
        console.error('❌ Failed to parse localStorage session:', err);
        // Clear corrupted localStorage data
        localStorage.removeItem(`exam-session-${examId}`);
      }
    }

    // Create completely new session state
    const newState: ExamSessionState = {
      sessionId: examData.sessionId,
      currentQuestion: 0,
      timeRemaining: examData.timeLimit * 60,
      answers: [],
      lastSync: new Date(),
      isDirty: false
    };
    
    console.log('🆕 Created new session state:', newState);
    localStorage.setItem(`exam-session-${examId}`, JSON.stringify(newState));
    
    return newState;
  }, [examId]);

  /**
   * Fetch exam data with session recovery
   */
  const fetchExamData = useCallback(async (password?: string) => {
    if (!examId) return;

    console.log('fetchExamData called with password:', !!password);
    setIsLoadingExam(true);
    setError(null);

    try {
      const examData = await fetchExamForTaking(examId, password);
      console.log('Exam data fetched successfully:', examData.title);
      
      setExam(examData);
      
      // Recover and set session state
      const recoveredState = recoverSessionState(examData);
      setSessionState(recoveredState);
      
      // If state was recovered from localStorage, sync it with backend
      if (recoveredState.isDirty) {
        setTimeout(() => syncSessionState(recoveredState), 1000);
      }
      
      setShowPasswordModal(false);
      setPasswordError('');
    } catch (err) {
      console.error('fetchExamData error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải bài thi';
      
      // Handle specific error types
      if (errorMessage.includes('Invalid exam password') || errorMessage.includes('invalid password')) {
        setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
        setExamPassword('');
      } else if (errorMessage.includes('Exam password required') || errorMessage.includes('password required')) {
        setPasswordError('Vui lòng nhập mật khẩu bài thi.');
        setShowPasswordModal(true);
      } else if (errorMessage.includes('Maximum attempts') || errorMessage.includes('attempt')) {
        setError(`Đã hết lượt làm bài: ${errorMessage}`);
        setShowPasswordModal(false);
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
        setExamPassword('');
      } else {
        setError(errorMessage);
        setShowPasswordModal(false);
      }
    } finally {
      setIsLoadingExam(false);
    }
  }, [examId, recoverSessionState, syncSessionState]);

  /**
   * Handle password submission
   */
  const handlePasswordSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!examPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsAuthenticating(true);
    setPasswordError('');

    try {
      await fetchExamData(examPassword);
    } catch (err) {
      // Error handling is done in fetchExamData
    } finally {
      setIsAuthenticating(false);
    }
  }, [examPassword, fetchExamData]);

  /**
   * Initialize exam loading based on availability
   */
  useEffect(() => {
    if (!availability || isCheckingAvailability || exam) return;

    if (!availability.available) {
      setError(availability.reason || 'Bài thi không khả dụng');
      return;
    }

    // Check for stored password from previous navigation
    const storedPassword = sessionStorage.getItem(`exam-${examId}-password`);
    if (storedPassword) {
      sessionStorage.removeItem(`exam-${examId}-password`);
      fetchExamData(storedPassword);
      return;
    }

    // Check if we have existing session data (for page refresh recovery)
    const existingSessionData = localStorage.getItem(`exam-session-${examId}`);
    if (existingSessionData && availability.timeRemaining) {
      // User likely refreshed during active exam session
      console.log('🔄 Detected page refresh with existing session data, attempting recovery...');
      if (availability.requiresPassword) {
        // Need password but likely had one before
        setShowPasswordModal(true);
      } else {
        fetchExamData();
      }
      return;
    }

    // If password required but not provided, show modal
    if (availability.requiresPassword) {
      setShowPasswordModal(true);
    } else {
      fetchExamData();
    }
  }, [availability, isCheckingAvailability, examId, fetchExamData, exam]);

  /**
   * Set up periodic session synchronization
   */
  useEffect(() => {
    if (!sessionState || !exam) return;

    // Sync every 30 seconds if there are changes
    syncIntervalRef.current = setInterval(() => {
      if (sessionState.isDirty) {
        syncSessionState({});
      }
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [sessionState, exam, syncSessionState]);

  /**
   * Handle window unload to sync final state
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionState?.isDirty) {
        // Try to sync state before leaving using beacon API
        syncExamSessionBeacon(sessionState.sessionId, {
          currentQuestion: sessionState.currentQuestion,
          timeRemaining: sessionState.timeRemaining,
          answers: sessionState.answers
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionState]);

  /**
   * Submit exam mutation
   */
  const submitMutation = useMutation({
    mutationFn: (submission: ExamSubmission) => submitExamAnswers(submission),
    onSuccess: () => {
      // Clean up session data
      if (examId) {
        localStorage.removeItem(`exam-session-${examId}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      navigate('/student/dashboard');
    },
    onError: (error: unknown) => {
      console.error('Submission failed:', error);
      setError(error instanceof Error ? error.message : 'Không thể nộp bài');
      setIsSubmitting(false);
    },
  });

  /**
   * Handle exam submission
   */
  const handleSubmitExam = useCallback(async (isAutoSubmit = false) => {
    if (!exam || !examId || !sessionState) {
      console.warn('Cannot submit exam - missing required data');
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      console.warn('Submission already in progress');
      return;
    }

    console.log(`🚀 Submitting exam - isAutoSubmit: ${isAutoSubmit}`);
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const submission: ExamSubmission = {
        examId,
        answers: sessionState.answers,
        timeSpent: (exam.timeLimit * 60) - sessionState.timeRemaining,
        isAutoSubmit,
        submittedAt: new Date().toISOString(),
      };

      console.log('📤 Submission data:', submission);
      await submitMutation.mutateAsync(submission);
    } catch (error) {
      console.error('❌ Submission error:', error);
      // Error handling is done in mutation
    }
  }, [exam, examId, sessionState, submitMutation, isSubmitting]);

  /**
   * Handle timer completion with auto-submit
   */
  const handleTimeUp = useCallback(() => {
    console.log('🚨 Timer expired - auto-submitting exam');
    handleSubmitExam(true);
  }, [handleSubmitExam]);

  /**
   * Handle time updates from timer
   */
  const handleTimeUpdate = useCallback((timeRemaining: number) => {
    if (!sessionState) return;

    setSessionState(prev => prev ? {
      ...prev,
      timeRemaining,
      isDirty: true
    } : null);
  }, [sessionState]);

  /**
   * Navigation handlers for exam questions
   */
  const goToQuestion = useCallback((index: number) => {
    if (!exam || !sessionState || index < 0 || index >= exam.questions.length) return;

    const newState = {
      ...sessionState,
      currentQuestion: index,
      isDirty: true
    };
    
    setSessionState(newState);
    
    // Immediate sync for navigation changes
    syncSessionState({ currentQuestion: index });
  }, [exam, sessionState, syncSessionState]);

  const goToPrevious = useCallback(() => {
    if (sessionState) {
      goToQuestion(sessionState.currentQuestion - 1);
    }
  }, [sessionState, goToQuestion]);

  const goToNext = useCallback(() => {
    if (sessionState) {
      goToQuestion(sessionState.currentQuestion + 1);
    }
  }, [sessionState, goToQuestion]);

  /**
   * Handle answer changes with session update
   */
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    if (!sessionState) return;

    const existingAnswerIndex = sessionState.answers.findIndex(a => a.questionId === questionId);
    const newAnswers = [...sessionState.answers];
    
    const answerData: ExamAnswer = {
      questionId,
      answer,
      timeSpent: 0 // TODO: Track time per question
    };

    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = answerData;
    } else {
      newAnswers.push(answerData);
    }

    const newState = {
      ...sessionState,
      answers: newAnswers,
      isDirty: true
    };
    
    setSessionState(newState);
    
    // Debounced sync for answer changes (sync after 2 seconds of no changes)
    const timeoutId = setTimeout(() => {
      syncSessionState({ answers: newAnswers });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [sessionState, syncSessionState]);

  /**
   * Progress calculation utilities
   */
  const getProgress = useCallback(() => {
    if (!exam || !sessionState) return 0;
    return (sessionState.answers.length / exam.questions.length) * 100;
  }, [exam, sessionState]);

  const getQuestionStatus = useCallback((index: number) => {
    if (!exam || !sessionState) return 'unanswered';
    
    const question = exam.questions[index];
    const hasAnswer = sessionState.answers.some(a => a.questionId === question.id);
    
    if (index === sessionState.currentQuestion) return 'current';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  }, [exam, sessionState]);

  /**
   * Get current question answer
   */
  const getCurrentAnswer = useCallback(() => {
    if (!exam || !sessionState) return undefined;
    
    const currentQuestion = exam.questions[sessionState.currentQuestion];
    const answer = sessionState.answers.find(a => a.questionId === currentQuestion?.id);
    return answer?.answer;
  }, [exam, sessionState]);

  // Loading state
  const isLoading = isCheckingAvailability || isLoadingExam;

  // Handle availability errors
  if (availabilityError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lỗi kết nối
          </h2>
          <p className="text-gray-600 mb-4">
            Không thể kiểm tra trạng thái bài thi. Vui lòng thử lại.
          </p>
          <Button onClick={() => navigate('/student/dashboard')}>
            Quay về Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Handle exam not available
  if (!isLoading && availability && !availability.available) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bài thi không khả dụng
          </h2>
          <p className="text-gray-600 mb-4">
            {availability.reason || 'Bài thi hiện tại không thể thực hiện.'}
          </p>
          <Button onClick={() => navigate('/student/dashboard')}>
            Quay về Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    // Check if we're recovering from a page refresh
    const existingSessionData = examId ? localStorage.getItem(`exam-session-${examId}`) : null;
    const isRecovering = existingSessionData && isLoadingExam;
    const loadingMessage = isRecovering ? 
      'Đang khôi phục phiên làm bài...' : 
      isCheckingAvailability ? 'Đang kiểm tra bài thi...' : 'Đang tải dữ liệu bài thi...';
      
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={loadingMessage} />
      </div>
    );
  }

  // Handle general errors
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Không thể tải bài thi
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="space-x-3">
            <Button 
              onClick={() => window.location.reload()} 
              variant="primary"
            >
              Thử lại
            </Button>
            <Button 
              onClick={() => navigate('/student/dashboard')}
              variant="secondary"
            >
              Quay về Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show password modal
  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Modal
          isOpen={true}
          onClose={() => navigate('/student/dashboard')}
          title="Xác thực mật khẩu bài thi"
          size="sm"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
              <LockClosedIcon className="w-5 h-5 text-amber-600 mr-2" />
              <p className="text-amber-700 text-sm">
                Bài thi này được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu để tiếp tục.
              </p>
            </div>
            
            <div>
              <label htmlFor="exam-password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu bài thi
              </label>
              <input
                id="exam-password"
                type="password"
                value={examPassword}
                onChange={(e) => {
                  setExamPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập mật khẩu..."
                disabled={isAuthenticating}
                autoFocus
              />
              {passwordError && (
                <div className="mt-2 flex items-center text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{passwordError}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                variant="secondary"
                fullWidth
                disabled={isAuthenticating}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!examPassword.trim()}
                isLoading={isAuthenticating}
              >
                {isAuthenticating ? 'Đang xác thực...' : 'Vào bài thi'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Check if exam and session are loaded
  if (!exam || !sessionState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang khôi phục phiên làm bài..." />
      </div>
    );
  }

  const currentQuestion = exam.questions[sessionState.currentQuestion];
  const currentAnswer = getCurrentAnswer();

  // Convert exam question to Question-like structure for AnswerInput
  const questionForInput = {
    ...currentQuestion,
    type: currentQuestion.type as any,
    category: null,
    difficulty: 'medium' as const,
    createdAt: '',
    updatedAt: '',
    createdBy: { id: '', username: '' },
    // Override with options if available
    options: currentQuestion.options || []
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer and Sync Status */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {exam.title}
              </h1>
              
              {/* Session sync status */}
              <div className="flex items-center space-x-2">
                {isSyncing ? (
                  <div className="flex items-center text-blue-600">
                    <CloudIcon className="w-4 h-4 mr-1 animate-pulse" />
                    <span className="text-sm">Đang đồng bộ...</span>
                  </div>
                ) : syncError ? (
                  <div className="flex items-center text-red-600">
                    <WifiIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Lỗi đồng bộ</span>
                  </div>
                ) : lastSyncTime ? (
                  <div className="flex items-center text-green-600">
                    <CloudIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Đã lưu</span>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <TimerDisplay
                duration={exam.timeLimit * 60}
                initialTimeRemaining={sessionState?.timeRemaining}
                onTimeUp={handleTimeUp}
                onTimeUpdate={handleTimeUpdate}
                examId={examId}
              />
              <Button
                onClick={() => setShowSubmitModal(true)}
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Xác nhận nộp bài"
        size="md"
      >
        <div className="text-center">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn nộp bài thi?
            </p>
            <p className="text-sm text-gray-500">
              Đã trả lời {sessionState.answers.length}/{exam.questions.length} câu hỏi
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowSubmitModal(false)}
              variant="secondary"
              fullWidth
            >
              Hủy
            </Button>
            <Button
              onClick={() => handleSubmitExam(false)}
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
            >
              Nộp bài
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Question Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Câu {sessionState.currentQuestion + 1} / {exam.questions.length}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.points} điểm
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="px-6 py-6">
                <AnswerInput
                  question={questionForInput}
                  value={currentAnswer}
                  onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Navigation */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={goToPrevious}
                    disabled={sessionState.currentQuestion === 0}
                    variant="secondary"
                    icon={<ChevronLeftIcon className="w-4 h-4" />}
                  >
                    Câu trước
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Tiến độ: {Math.round(getProgress())}%
                  </span>
                  
                  <Button
                    onClick={goToNext}
                    disabled={sessionState.currentQuestion === exam.questions.length - 1}
                    variant="secondary"
                    iconPosition="right"
                    icon={<ChevronRightIcon className="w-4 h-4" />}
                  >
                    Câu tiếp
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">
                Danh sách câu hỏi
              </h3>
              
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {exam.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`
                        w-10 h-10 rounded-lg text-sm font-medium transition-colors
                        ${status === 'current' 
                          ? 'bg-blue-600 text-white' 
                          : status === 'answered'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                  <span className="text-gray-600">Đang làm</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                  <span className="text-gray-600">Đã trả lời</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                  <span className="text-gray-600">Chưa làm</span>
                </div>
              </div>

              {/* Session Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Phiên: {sessionState.sessionId.slice(-8)}</div>
                  {lastSyncTime && (
                    <div>Lưu lúc: {lastSyncTime.toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 