import { prisma } from '../utils/db';
import { ExamAnswer } from '../types/exam';

export interface ExamSessionData {
  id: string;
  examId: string;
  userId: string;
  attemptNumber: number;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  currentQuestion: number;
  timeRemaining?: number;
  answers: ExamAnswer[];
  sessionData: Record<string, any>;
  completedAt?: Date;
  submittedAt?: Date;
  submissionId?: string;
}

export interface CreateSessionRequest {
  examId: string;
  userId: string;
  timeLimit: number; // in seconds
}

export interface UpdateSessionRequest {
  currentQuestion?: number;
  timeRemaining?: number;
  answers?: ExamAnswer[];
  sessionData?: Record<string, any>;
  lastActivityAt?: Date;
}

/**
 * Service for managing exam taking sessions with robust state management.
 * Replaces the flawed attempt-based architecture with session-based approach.
 */
export class ExamSessionService {
  
  /**
   * Get or create an active exam session for a user.
   * This prevents duplicate session creation and handles page refreshes gracefully.
   * Uses transaction to handle race conditions properly.
   * @param examId - ID of the exam
   * @param userId - ID of the user
   * @param timeLimit - Time limit for the exam in seconds
   * @returns Active exam session data
   */
  async getOrCreateSession(
    examId: string, 
    userId: string, 
    timeLimit: number
  ): Promise<ExamSessionData> {
    const sessionKey = `${examId}-${userId}`;
    console.log(`🔄 getOrCreateSession called for ${sessionKey}, timeLimit: ${timeLimit}s`);
    
    try {
      // Use a transaction to handle race conditions
      const result = await prisma.$transaction(async (tx) => {
        // First, try to find an existing active session
        const existingSession = await tx.examSession.findFirst({
          where: {
            examId,
            userId,
            isActive: true
          },
          orderBy: {
            startedAt: 'desc'
          }
        });

        if (existingSession) {
          // CRITICAL FIX: Never reuse a session that has been completed (has submissionId)
          // This prevents the timer issue when students submit early and retake
          if (existingSession.submissionId) {
            console.log(`🚫 Session ${existingSession.id} has submissionId ${existingSession.submissionId}, marking as completed and creating new session`);
            
            // Mark the session as inactive since it should have been completed
            await tx.examSession.update({
              where: { id: existingSession.id },
              data: { 
                isActive: false,
                completedAt: existingSession.completedAt || new Date()
              }
            });
            
            // Continue to create a new session
          } else {
            // Session has no submission yet, check if it's truly expired
            const now = new Date();
            const lastActivity = existingSession.lastActivityAt;
            const sessionStartTime = existingSession.startedAt;
            
            // Check if session has real time remaining (authoritative)
            const hasTimeRemaining = existingSession.timeRemaining && existingSession.timeRemaining > 0;
            
            // Grace period for page refreshes (5 minutes of inactivity allowed)
            const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
            const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
            const isRecentlyActive = timeSinceLastActivity < gracePeriod;
            
            // Calculate theoretical expiry time
            const sessionExpiryTime = new Date(sessionStartTime.getTime() + (timeLimit * 1000));
            const isTheoreticallyExpired = now > sessionExpiryTime;
            
            // Only consider session expired if:
            // 1. It has no time remaining AND
            // 2. It's been inactive for more than grace period AND  
            // 3. It's theoretically past the time limit
            const isReallyExpired = !hasTimeRemaining && !isRecentlyActive && isTheoreticallyExpired;
            
            if (isReallyExpired) {
              console.log(`⏰ Session ${existingSession.id} is truly expired (no time left: ${!hasTimeRemaining}, inactive: ${!isRecentlyActive}, past limit: ${isTheoreticallyExpired}), deleting it`);
              
              // Delete the expired session instead of updating to avoid constraint violations
              await tx.examSession.delete({
                where: { id: existingSession.id }
              });
              
              // Continue to create a new session
            } else {
              // Session is still valid and has no submission, update last activity timestamp
              console.log(`📋 Resuming existing session ${existingSession.id} for user ${userId} on exam ${examId} (timeRemaining: ${existingSession.timeRemaining}s, lastActivity: ${timeSinceLastActivity}ms ago)`);
              
              const updatedSession = await tx.examSession.update({
                where: { id: existingSession.id },
                data: { lastActivityAt: new Date() }
              });

              return { session: updatedSession, isNew: false };
            }
          }
        }

        // Ensure no other active session exists (application-level constraint)
        const existingActiveSession = await tx.examSession.findFirst({
          where: {
            examId,
            userId,
            isActive: true
          }
        });

        if (existingActiveSession) {
          throw new Error('User already has an active session for this exam');
        }

        // If no active session exists, determine the attempt number
        // Count completed attempts from submissions (more reliable than session completedAt)
        const completedAttempts = await tx.examSubmission.count({
          where: {
            examId,
            userId
          }
        });

        const attemptNumber = completedAttempts + 1;
        const startTime = new Date();
        const expiresAt = new Date(startTime.getTime() + (timeLimit * 1000));

        console.log(`🆕 Creating new session for ${sessionKey} - attempt ${attemptNumber}`);

        // Create new session
        try {
          const newSession = await tx.examSession.create({
            data: {
              examId,
              userId,
              attemptNumber,
              startedAt: startTime,
              lastActivityAt: startTime,
              expiresAt,
              isActive: true,
              currentQuestion: 0,
              timeRemaining: timeLimit,
              answers: [],
              sessionData: {}
            }
          });

          console.log(`✅ Created new session ${newSession.id} (attempt ${attemptNumber}) for ${sessionKey}`);
          return { session: newSession, isNew: true };

        } catch (createError: any) {
          // If creation fails due to constraint, try to find the session that was created by another process
          if (createError.code === 'P2002') {
            console.log(`🔄 Constraint violation detected for ${sessionKey}, looking for existing session created by another process`);
            
            const raceConditionSession = await tx.examSession.findFirst({
              where: {
                examId,
                userId,
                isActive: true
              },
              orderBy: {
                startedAt: 'desc'
              }
            });

            if (raceConditionSession) {
              console.log(`📋 Found session ${raceConditionSession.id} created by race condition for ${sessionKey}, resuming it`);
              return { session: raceConditionSession, isNew: false };
            }
          }
          
          console.error(`❌ Failed to create session for ${sessionKey}:`, createError);
          throw createError;
        }
      });

      return this.formatSessionData(result.session);

    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      throw new Error(`Failed to get or create exam session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing exam session with new data.
   * @param sessionId - ID of the session to update
   * @param updates - Data to update
   * @returns Updated session data
   */
  async updateSession(
    sessionId: string, 
    updates: UpdateSessionRequest
  ): Promise<ExamSessionData> {
    try {
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.isActive) {
        throw new Error('Session is no longer active');
      }

      // Prepare update data
      const updateData: any = {
        lastActivityAt: updates.lastActivityAt || new Date()
      };

      if (updates.currentQuestion !== undefined) {
        updateData.currentQuestion = updates.currentQuestion;
      }

      if (updates.timeRemaining !== undefined) {
        updateData.timeRemaining = updates.timeRemaining;
      }

      if (updates.answers !== undefined) {
        updateData.answers = updates.answers;
      }

      if (updates.sessionData !== undefined) {
        updateData.sessionData = updates.sessionData;
      }

      const updatedSession = await prisma.examSession.update({
        where: { id: sessionId },
        data: updateData
      });

      return this.formatSessionData(updatedSession);

    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete an exam session and mark it as inactive.
   * @param sessionId - ID of the session to complete
   * @param submissionId - Optional submission ID if submitted
   * @returns Completed session data
   */
  async completeSession(
    sessionId: string, 
    submissionId?: string
  ): Promise<ExamSessionData> {
    try {
      // Use a robust transaction approach with upsert-like behavior
      const result = await prisma.$transaction(async (tx) => {
        // First check if the session exists
        const existingSession = await tx.examSession.findUnique({
          where: { id: sessionId }
        });

        if (!existingSession) {
          throw new Error('Session not found');
        }

        // If session is already completed, return it as-is
        if (!existingSession.isActive || existingSession.completedAt) {
          console.log(`📋 Session ${sessionId} is already completed`);
          return existingSession;
        }

        // Strategy: Always delete any existing inactive sessions for this user/exam combination
        // This prevents the unique constraint violation
        const deleteResult = await tx.examSession.deleteMany({
          where: {
            examId: existingSession.examId,
            userId: existingSession.userId,
            isActive: false,
            id: { not: sessionId } // Don't delete the current session
          }
        });

        if (deleteResult.count > 0) {
          console.log(`🧹 Cleaned up ${deleteResult.count} existing inactive sessions for user ${existingSession.userId} on exam ${existingSession.examId}`);
        }

        // Now safely update the current session to inactive
        try {
          const completedSession = await tx.examSession.update({
            where: { 
              id: sessionId,
              isActive: true // Only update if still active
            },
            data: {
              isActive: false,
              completedAt: new Date(),
              submittedAt: submissionId ? new Date() : undefined,
              submissionId
            }
          });

          console.log(`✅ Completed session ${sessionId}${submissionId ? ` with submission ${submissionId}` : ''}`);
          return completedSession;

        } catch (updateError: any) {
          // If update fails, the session might have been completed by another process
          if (updateError.code === 'P2025') {
            // Re-fetch the session to get its current state
            const currentSession = await tx.examSession.findUnique({
              where: { id: sessionId }
            });
            
            if (currentSession && !currentSession.isActive) {
              console.log(`📋 Session ${sessionId} was completed by another process during transaction`);
              return currentSession;
            }
          }
          
          throw updateError;
        }
      }, {
        maxWait: 10000, // 10 seconds
        timeout: 15000, // 15 seconds
      });

      return this.formatSessionData(result);

    } catch (error: any) {
      console.error('Error completing session:', error);
      
      // Final fallback: check if the session is now inactive
      try {
        const session = await prisma.examSession.findUnique({
          where: { id: sessionId }
        });
        
        if (session && !session.isActive) {
          console.log(`📋 Session ${sessionId} is now inactive, returning it`);
          return this.formatSessionData(session);
        }
      } catch (fallbackError) {
        console.error('Error in fallback check:', fallbackError);
      }
      
      throw new Error(`Failed to complete session: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get an active session by ID.
   * @param sessionId - ID of the session
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<ExamSessionData | null> {
    try {
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return null;
      }

      return this.formatSessionData(session);

    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the active session for a user on a specific exam.
   * @param examId - ID of the exam
   * @param userId - ID of the user
   * @returns Active session data or null if no active session
   */
  async getActiveSession(examId: string, userId: string): Promise<ExamSessionData | null> {
    try {
      const session = await prisma.examSession.findFirst({
        where: {
          examId,
          userId,
          isActive: true
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      if (!session) {
        return null;
      }

      return this.formatSessionData(session);

    } catch (error) {
      console.error('Error getting active session:', error);
      throw new Error(`Failed to get active session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a user has remaining attempts for an exam.
   * @param examId - ID of the exam
   * @param userId - ID of the user
   * @param maxAttempts - Maximum allowed attempts
   * @returns Number of remaining attempts
   */
  async getRemainingAttempts(
    examId: string, 
    userId: string, 
    maxAttempts: number
  ): Promise<number> {
    try {
      // Count completed attempts from submissions (more reliable than session completedAt)
      const completedAttempts = await prisma.examSubmission.count({
        where: {
          examId,
          userId
        }
      });

      return Math.max(0, maxAttempts - completedAttempts);

    } catch (error) {
      console.error('Error getting remaining attempts:', error);
      throw new Error(`Failed to get remaining attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired sessions by deleting them instead of updating to avoid constraint violations.
   * @param examId - Optional exam ID to filter by
   * @returns Number of cleaned up sessions
   */
  async cleanupExpiredSessions(examId?: string): Promise<number> {
    try {
      const where: any = {
        isActive: true,
        expiresAt: {
          lt: new Date()
        }
      };

      if (examId) {
        where.examId = examId;
      }

      // Delete expired sessions instead of updating to avoid constraint violations
      const result = await prisma.examSession.deleteMany({
        where
      });

      if (result.count > 0) {
        console.log(`🧹 Deleted ${result.count} expired sessions`);
      }

      return result.count;

    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up orphaned inactive sessions to prevent constraint violations.
   * This should be called periodically to maintain database integrity.
   * @returns Number of orphaned sessions cleaned up
   */
  async cleanupOrphanedSessions(): Promise<number> {
    try {
      // Find users with multiple inactive sessions for the same exam (violates our logical constraint)
      const orphanedSessions = await prisma.$queryRaw<Array<{
        examId: string;
        userId: string;
        count: bigint;
      }>>`
        SELECT "examId", "userId", COUNT(*) as count
        FROM "exam_sessions" 
        WHERE "isActive" = false 
        GROUP BY "examId", "userId" 
        HAVING COUNT(*) > 1
      `;

      let totalCleaned = 0;

      for (const group of orphanedSessions) {
        // Keep only the most recent inactive session, delete the rest
        const sessionsToDelete = await prisma.examSession.findMany({
          where: {
            examId: group.examId,
            userId: group.userId,
            isActive: false
          },
          orderBy: {
            completedAt: 'desc'
          },
          skip: 1 // Skip the most recent one
        });

        if (sessionsToDelete.length > 0) {
          const deleteResult = await prisma.examSession.deleteMany({
            where: {
              id: {
                in: sessionsToDelete.map(s => s.id)
              }
            }
          });

          totalCleaned += deleteResult.count;
          console.log(`🧹 Cleaned up ${deleteResult.count} orphaned sessions for user ${group.userId} on exam ${group.examId}`);
        }
      }

      if (totalCleaned > 0) {
        console.log(`🧹 Total orphaned sessions cleaned up: ${totalCleaned}`);
      }

      return totalCleaned;

    } catch (error) {
      console.error('Error cleaning up orphaned sessions:', error);
      return 0;
    }
  }

  /**
   * Run comprehensive session cleanup.
   * This should be called periodically to maintain session integrity.
   * @returns Object with cleanup statistics
   */
  async runCleanup(): Promise<{ expiredSessions: number; orphanedSessions: number }> {
    console.log('🧹 Running comprehensive session cleanup...');
    
    const expiredSessions = await this.cleanupExpiredSessions();
    const orphanedSessions = await this.cleanupOrphanedSessions();
    
    console.log(`✅ Cleanup completed: ${expiredSessions} expired, ${orphanedSessions} orphaned sessions cleaned`);
    
    return { expiredSessions, orphanedSessions };
  }

  /**
   * Format raw session data from database into typed interface.
   * @param session - Raw session data from Prisma
   * @returns Formatted session data
   */
  private formatSessionData(session: any): ExamSessionData {
    return {
      id: session.id,
      examId: session.examId,
      userId: session.userId,
      attemptNumber: session.attemptNumber,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      currentQuestion: session.currentQuestion,
      timeRemaining: session.timeRemaining,
      answers: Array.isArray(session.answers) ? session.answers : [],
      sessionData: typeof session.sessionData === 'object' ? session.sessionData : {},
      completedAt: session.completedAt,
      submittedAt: session.submittedAt,
      submissionId: session.submissionId
    };
  }
} 