/**
 * WebSocket service for real-time exam timer synchronization
 * Provides server-authoritative time tracking with optional Redis pub/sub
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { verifyToken } from './authService';
import { PrismaClient } from '@prisma/client';

interface TimerSession {
  examId: string;
  userId: string;
  startTime: number;
  duration: number; // in seconds
  socketId: string;
}

interface TimerSyncData {
  serverTime: number;
  examStartTime: number;
  examDuration: number;
  timeRemaining: number;
}

/**
 * WebSocket service for exam timer synchronization
 */
export class WebSocketService {
  private io: SocketIOServer;
  private redis: RedisClientType | null = null;
  private timerSessions: Map<string, TimerSession> = new Map();
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();
  private useRedis: boolean = false;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeRedis();
    this.setupSocketHandlers();
  }

  /**
   * Initialize Redis connection (optional)
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis connection error, falling back to in-memory storage:', err.message);
        this.useRedis = false;
      });

      await this.redis.connect();
      this.useRedis = true;
      console.log('✅ Redis connected for WebSocket timer service');
    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory timer storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useRedis = false;
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupSocketHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('No authentication token provided'));
        }

        const payload = verifyToken(token);
        if (!payload) {
          return next(new Error('Invalid authentication token'));
        }

        // Attach user info to socket
        (socket as any).userId = payload.userId;
        (socket as any).userRole = payload.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = (socket as any).userId;
      console.log(`🔌 WebSocket connected: User ${userId}, Socket ${socket.id}`);

      // Handle timer synchronization requests
      socket.on('timer:sync', async (data: { examId: string }) => {
        await this.handleTimerSync(socket, data.examId, userId);
      });

      // Handle exam timer start
      socket.on('timer:start', async (data: { examId: string; duration: number }) => {
        await this.startExamTimer(data.examId, userId, data.duration, socket.id);
      });

      // Handle exam timer end
      socket.on('timer:end', async (data: { examId: string }) => {
        await this.endExamTimer(data.examId, userId);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket disconnected: User ${userId}, Socket ${socket.id}, Reason: ${reason}`);
        this.cleanupSocketSessions(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`❌ WebSocket error for user ${userId}:`, error);
      });
    });
  }

  /**
   * Handle timer synchronization request
   */
  private async handleTimerSync(socket: Socket, examId: string, userId: string): Promise<void> {
    try {
      const sessionKey = `${examId}:${userId}`;
      let session: TimerSession | null = null;

      // Try to get session from Redis first, then fallback to memory
      if (this.useRedis && this.redis) {
        try {
          const sessionData = await this.redis.get(`timer:${sessionKey}`);
          if (sessionData) {
            session = JSON.parse(sessionData);
          }
        } catch (error) {
          console.warn('⚠️ Redis get failed, using memory fallback:', error);
        }
      }

      // Fallback to in-memory storage
      if (!session) {
        session = this.timerSessions.get(sessionKey) || null;
      }

      if (session) {
        // Calculate current time remaining
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const timeRemaining = Math.max(0, session.duration - elapsed);

        const syncData: TimerSyncData = {
          serverTime: Date.now(),
          examStartTime: session.startTime,
          examDuration: session.duration,
          timeRemaining,
        };

        socket.emit('timer:sync', syncData);
        console.log(`⏱️ Timer sync sent to user ${userId} for exam ${examId}: ${timeRemaining}s remaining`);

        // Auto-end if time is up
        if (timeRemaining <= 0) {
          await this.endExamTimer(examId, userId);
        }
      } else {
        // Try to get exam session data from database as fallback
        try {
          const prisma = new PrismaClient();
          
          const examSession = await prisma.examSession.findFirst({
            where: {
              examId,
              userId,
              isActive: true
            },
            include: {
              exam: {
                select: {
                  settings: true
                }
              }
            }
          });

          if (examSession && examSession.exam) {
                      // Extract timeLimit from settings JSON
          const settings = examSession.exam.settings as any;
          const timeLimit = settings?.timeLimit || 60; // Default 60 minutes if not found
          
          // Use session's timeRemaining if available (more accurate than recalculating)
          let timeRemaining: number;
          if (examSession.timeRemaining !== null && examSession.timeRemaining !== undefined) {
            // Use the last synced time remaining from the session
            timeRemaining = Math.max(0, examSession.timeRemaining);
          } else {
            // Fallback to calculation from start time
            const startTime = examSession.startedAt.getTime();
            const duration = timeLimit * 60; // Convert minutes to seconds
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeRemaining = Math.max(0, duration - elapsed);
          }
          
          const startTime = examSession.startedAt.getTime();
          const duration = timeLimit * 60;

            const syncData: TimerSyncData = {
              serverTime: Date.now(),
              examStartTime: startTime,
              examDuration: duration,
              timeRemaining,
            };

            socket.emit('timer:sync', syncData);
            console.log(`⏱️ Timer sync sent to user ${userId} for exam ${examId}: ${timeRemaining}s remaining (from DB)`);
          } else {
            socket.emit('timer:error', { 
              message: 'No active timer session found for this exam' 
            });
          }
          
          await prisma.$disconnect();
        } catch (dbError) {
          console.warn('⚠️ Database fallback failed in WebSocket:', dbError);
          socket.emit('timer:error', { 
            message: 'No active timer session found for this exam' 
          });
        }
      }
    } catch (error) {
      console.error(`❌ Timer sync error for user ${userId}, exam ${examId}:`, error);
      socket.emit('timer:error', { 
        message: 'Failed to synchronize timer' 
      });
    }
  }

  /**
   * Start exam timer for a user
   */
  private async startExamTimer(
    examId: string, 
    userId: string, 
    duration: number, 
    socketId: string
  ): Promise<void> {
    try {
      const sessionKey = `${examId}:${userId}`;
      const session: TimerSession = {
        examId,
        userId,
        startTime: Date.now(),
        duration,
        socketId,
      };

      // Store in both Redis and memory
      if (this.useRedis && this.redis) {
        try {
          await this.redis.setEx(`timer:${sessionKey}`, duration + 60, JSON.stringify(session));
        } catch (error) {
          console.warn('⚠️ Redis setEx failed, using memory only:', error);
        }
      }

      this.timerSessions.set(sessionKey, session);

      // Set up auto-end timer
      const timeoutId = setTimeout(async () => {
        await this.endExamTimer(examId, userId);
      }, duration * 1000);

      this.timerIntervals.set(sessionKey, timeoutId);

      console.log(`⏱️ Timer started for user ${userId}, exam ${examId}: ${duration}s`);

      // Send initial sync
      const syncData: TimerSyncData = {
        serverTime: Date.now(),
        examStartTime: session.startTime,
        examDuration: duration,
        timeRemaining: duration,
      };

      this.io.to(socketId).emit('timer:sync', syncData);
    } catch (error) {
      console.error(`❌ Failed to start timer for user ${userId}, exam ${examId}:`, error);
    }
  }

  /**
   * End exam timer for a user
   */
  private async endExamTimer(examId: string, userId: string): Promise<void> {
    try {
      const sessionKey = `${examId}:${userId}`;

      // Clear from Redis
      if (this.useRedis && this.redis) {
        try {
          await this.redis.del(`timer:${sessionKey}`);
        } catch (error) {
          console.warn('⚠️ Redis del failed:', error);
        }
      }

      // Clear from memory
      const session = this.timerSessions.get(sessionKey);
      this.timerSessions.delete(sessionKey);

      // Clear timeout
      const timeoutId = this.timerIntervals.get(sessionKey);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timerIntervals.delete(sessionKey);
      }

      // Notify client
      if (session) {
        this.io.to(session.socketId).emit('timer:timeUp');
      }

      console.log(`⏰ Timer ended for user ${userId}, exam ${examId}`);
    } catch (error) {
      console.error(`❌ Failed to end timer for user ${userId}, exam ${examId}:`, error);
    }
  }

  /**
   * Clean up sessions for disconnected socket
   */
  private cleanupSocketSessions(socketId: string): void {
    for (const [sessionKey, session] of this.timerSessions.entries()) {
      if (session.socketId === socketId) {
        console.log(`🧹 Cleaning up timer session: ${sessionKey}`);
        
        // Clear timeout
        const timeoutId = this.timerIntervals.get(sessionKey);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.timerIntervals.delete(sessionKey);
        }

        // Note: We don't delete the session from storage here
        // as the user might reconnect and continue the exam
      }
    }
  }

  /**
   * Get timer synchronization data for HTTP fallback
   */
  public async getTimerSync(examId: string, userId: string): Promise<TimerSyncData> {
    const sessionKey = `${examId}:${userId}`;
    let session: TimerSession | null = null;

    // Try Redis first, then memory
    if (this.useRedis && this.redis) {
      try {
        const sessionData = await this.redis.get(`timer:${sessionKey}`);
        if (sessionData) {
          session = JSON.parse(sessionData);
        }
      } catch (error) {
        console.warn('⚠️ Redis get failed in HTTP fallback:', error);
      }
    }

    if (!session) {
      session = this.timerSessions.get(sessionKey) || null;
    }

    if (!session) {
      // If no WebSocket timer session exists, try to get exam session data from database
      try {
        const prisma = new PrismaClient();
        
        const examSession = await prisma.examSession.findFirst({
          where: {
            examId,
            userId,
            isActive: true
          },
          include: {
            exam: {
              select: {
                settings: true
              }
            }
          }
        });

        if (examSession && examSession.exam) {
          // Extract timeLimit from settings JSON
          const settings = examSession.exam.settings as any;
          const timeLimit = settings?.timeLimit || 60; // Default 60 minutes if not found
          
          // Use session's timeRemaining if available (more accurate than recalculating)
          let timeRemaining: number;
          if (examSession.timeRemaining !== null && examSession.timeRemaining !== undefined) {
            // Use the last synced time remaining from the session
            timeRemaining = Math.max(0, examSession.timeRemaining);
          } else {
            // Fallback to calculation from start time
            const startTime = examSession.startedAt.getTime();
            const duration = timeLimit * 60; // Convert minutes to seconds
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeRemaining = Math.max(0, duration - elapsed);
          }
          
          const startTime = examSession.startedAt.getTime();
          const duration = timeLimit * 60;

          return {
            serverTime: Date.now(),
            examStartTime: startTime,
            examDuration: duration,
            timeRemaining,
          };
        }
        
        await prisma.$disconnect();
      } catch (dbError) {
        console.warn('⚠️ Database fallback failed:', dbError);
      }
      
      throw new Error('No active timer session found');
    }

    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const timeRemaining = Math.max(0, session.duration - elapsed);

    return {
      serverTime: Date.now(),
      examStartTime: session.startTime,
      examDuration: session.duration,
      timeRemaining,
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Clear all timeouts
    for (const timeoutId of this.timerIntervals.values()) {
      clearTimeout(timeoutId);
    }
    this.timerIntervals.clear();

    // Clear memory sessions
    this.timerSessions.clear();

    // Close Redis connection
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.warn('⚠️ Redis cleanup error:', error);
      }
    }

    console.log('🧹 WebSocket service cleanup completed');
  }
} 