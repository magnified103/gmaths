/**
 * Exam management API routes
 * Provides RESTful endpoints for exam CRUD operations, publishing, and preview
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ExamService } from '../services/examService';
import { ExamSessionService } from '../services/examSessionService';
import { authenticate, requirePermission } from '../utils/authMiddleware';
import type {
  CreateExamRequest,
  UpdateExamRequest,
  ExamFilters,
  ExamSubmission,
  ExamAnswer
} from '../types/exam';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { handleRouteError, successResponse } from '../utils/errorHandler';

// Initialize exam service
const examService = new ExamService();
const sessionService = new ExamSessionService();
const prisma = new PrismaClient();

// Validation schemas
const examIdSchema = z.object({
  id: z.string().min(1, 'Exam ID is required'),
});

const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimit: z.number().min(1, 'Time limit must be at least 1 minute'),
  maxAttempts: z.number().min(1, 'Max attempts must be at least 1'),
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  showResults: z.boolean(),
  showCorrectAnswers: z.boolean(),
  feedbackType: z.enum(['IMMEDIATE', 'AFTER_EXAM', 'NEVER']),
  navigationType: z.enum(['FREE', 'LINEAR']),
  allowReview: z.boolean(),
  requireFullscreen: z.boolean(),
  preventCopyPaste: z.boolean(),
  password: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  questionIds: z.array(z.string()).min(1, 'At least one question is required'),
  questionPoints: z.record(z.string(), z.number()).optional(),
});

const sessionUpdateSchema = z.object({
  currentQuestion: z.number().min(0).optional(),
  timeRemaining: z.number().min(0).optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.any(),
    timeSpent: z.number().optional()
  })).optional(),
  sessionData: z.record(z.string(), z.any()).optional()
});

const examSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.any(),
    timeSpent: z.number().optional()
  })),
  timeSpent: z.number(),
  isAutoSubmit: z.boolean(),
  submittedAt: z.string()
});

/**
 * Route parameters and body schemas
 */
interface ExamParams {
  id: string;
}

interface SessionParams {
  sessionId: string;
}

interface ExamListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  createdById?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface DuplicateExamBody {
  title?: string;
}

interface ExamPasswordBody {
  password?: string;
}

interface TakeableExamsQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extracts user ID from authenticated request
 * @param request - Fastify request object
 * @returns User ID string
 */
function getUserIdFromRequest(request: FastifyRequest): string {
  const user = (request as any).user;
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

/**
 * Exam routes registration
 * @param fastify - Fastify instance
 */
export async function examRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  await fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);

    // Session management routes
    fastify.patch<{ Params: SessionParams; Body: any }>('/exam-sessions/:sessionId', {
        preHandler: [authenticate, requirePermission('update', 'ExamSession')]
    }, async (request, reply) => {
      try {
        const { sessionId } = request.params;
        const parsedData = sessionUpdateSchema.parse(request.body);
        
        // Convert to proper ExamAnswer format
        const updates = {
          ...parsedData,
          answers: parsedData.answers?.map(answer => ({
            questionId: answer.questionId,
            answer: answer.answer || null,
            timeSpent: answer.timeSpent
          }))
        };
        
        const updatedSession = await sessionService.updateSession(sessionId, updates);
        
        return successResponse({
          sessionId: updatedSession.id,
          currentQuestion: updatedSession.currentQuestion,
          timeRemaining: updatedSession.timeRemaining,
          answers: updatedSession.answers,
          lastActivityAt: updatedSession.lastActivityAt.toISOString(),
          isActive: updatedSession.isActive
        }, 'Session updated successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to update session');
      }
    });

    fastify.get<{ Params: SessionParams }>('/exam-sessions/:sessionId', {
        preHandler: [authenticate, requirePermission('read', 'ExamSession')]
    }, async (request, reply) => {
      try {
        const { sessionId } = request.params;
        
        const session = await sessionService.getSession(sessionId);
        if (!session) {
          return reply.status(404).send({
            success: false,
            message: 'Session not found'
          });
        }
        
        return successResponse({
          sessionId: session.id,
          currentQuestion: session.currentQuestion,
          timeRemaining: session.timeRemaining,
          answers: session.answers,
          lastActivityAt: session.lastActivityAt.toISOString(),
          isActive: session.isActive
        }, 'Session retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to get session');
      }
    });

    fastify.post<{ Params: SessionParams; Body: any }>('/exam-sessions/:sessionId/sync', {
        preHandler: [authenticate, requirePermission('update', 'ExamSession')]
    }, async (request, reply) => {
      try {
        const { sessionId } = request.params;
        const parsedData = sessionUpdateSchema.parse(request.body);
        
        // Convert to proper ExamAnswer format
        const updates = {
          ...parsedData,
          answers: parsedData.answers?.map(answer => ({
            questionId: answer.questionId,
            answer: answer.answer || null,
            timeSpent: answer.timeSpent
          }))
        };
        
        await sessionService.updateSession(sessionId, updates);
        
        return successResponse(null, 'Session synced successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to sync session');
      }
    });

    // Exam CRUD routes (admin only)
    fastify.post<{ Body: CreateExamRequest }>('/exams', {
      preHandler: [authenticate, requirePermission('create', 'Exam')]
    }, async (request, reply) => {
      try {
        const examData = createExamSchema.parse(request.body);
        const userId = getUserIdFromRequest(request);
        
        const exam = await examService.createExam(examData, userId);
        return successResponse(exam, 'Exam created successfully', 201);
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to create exam');
      }
    });

    fastify.get<{ Querystring: ExamListQuery }>('/exams', {
      preHandler: [authenticate, requirePermission('read', 'Exam')]
    }, async (request, reply) => {
      try {
        const { 
          page = '1', 
          limit = '20',
          search,
          status,
          createdById,
          startDate,
          endDate,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = request.query;

        const filters: ExamFilters = {
          ...(search && { search }),
          ...(status && status !== 'ALL' && { status: status as any }),
          ...(createdById && { createdById }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          sortBy: sortBy as any,
          sortOrder: sortOrder as 'asc' | 'desc'
        };

        const result = await examService.getExams(filters, parseInt(page), parseInt(limit));
        return successResponse(result, 'Exams retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to retrieve exams');
      }
    });

    fastify.get<{ Params: ExamParams }>('/exams/:id', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const exam = await examService.getExamById(id, { 
          includeQuestions: true, 
          includeCreatedBy: true,
          questionDetails: true 
        });
        
        if (!exam) {
          return reply.status(404).send({
            success: false,
            message: 'Exam not found'
          });
        }

        return successResponse(exam, 'Exam retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to retrieve exam');
      }
    });

    fastify.put<{ Params: ExamParams; Body: UpdateExamRequest }>('/exams/:id', {
      preHandler: [authenticate, requirePermission('update', 'Exam')]
    }, async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const examData = { ...request.body, id } as UpdateExamRequest;
        const userId = getUserIdFromRequest(request);
        
        const exam = await examService.updateExam(id, examData, userId);
        return successResponse(exam, 'Exam updated successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to update exam');
      }
    });

    fastify.delete<{ Params: ExamParams }>('/exams/:id', {
      preHandler: [authenticate, requirePermission('delete', 'Exam')]
    }, async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        await examService.deleteExam(id, userId);
        return successResponse(null, 'Exam deleted successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to delete exam');
      }
    });

    fastify.patch<{ Params: ExamParams }>('/exams/:id/publish', {
      preHandler: [authenticate, requirePermission('publish', 'Exam')]
    }, async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        const exam = await examService.publishExam(id, userId);
        return successResponse(exam, 'Exam published successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to publish exam');
      }
    });

    fastify.patch<{ Params: ExamParams }>('/exams/:id/archive', {
      preHandler: [authenticate, requirePermission('archive', 'Exam')]
    }, async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        const exam = await examService.archiveExam(id, userId);
        return successResponse(exam, 'Exam archived successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to archive exam');
      }
    });

    fastify.post<{ Params: ExamParams; Body: DuplicateExamBody }>('/exams/:id/duplicate', {
      preHandler: [authenticate, requirePermission('duplicate', 'Exam')]
    }, async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const { title } = request.body;
        const userId = getUserIdFromRequest(request);
        
        const exam = await examService.duplicateExam(id, title, userId);
        return successResponse(exam, 'Exam duplicated successfully', 201);
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to duplicate exam');
      }
    });

    fastify.get<{ Params: ExamParams }>('/exams/:id/preview', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const preview = await examService.getExamPreview(id);
        
        if (!preview) {
          return reply.status(404).send({
            success: false,
            message: 'Exam not found'
          });
        }

        return successResponse(preview, 'Exam preview retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to retrieve exam preview');
      }
    });

    // Student exam routes
    fastify.get<{ Querystring: TakeableExamsQuery }>('/exams/takeable', async (request, reply) => {
      try {
        const { 
          page = '1', 
          limit = '50',
          search,
          sortBy = 'title',
          sortOrder = 'asc'
        } = request.query;

        const filters: ExamFilters = {
          status: 'PUBLISHED',
          ...(search && { search }),
          sortBy: sortBy as any,
          sortOrder: sortOrder as 'asc' | 'desc'
        };

        const result = await examService.getExams(filters, parseInt(page), parseInt(limit));
        return successResponse(result, 'Takeable exams retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to retrieve takeable exams');
      }
    });

    fastify.get<{ Params: ExamParams }>('/exams/:id/availability', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        const availability = await examService.checkExamAvailability(id, userId);
        return successResponse(availability, 'Exam availability checked successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to check exam availability');
      }
    });

    fastify.post<{ Params: ExamParams; Body: ExamPasswordBody }>('/exams/:id/take', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        // Handle undefined request.body - common in Fastify when no body is sent
        const { password } = request.body || {};
        const userId = getUserIdFromRequest(request);
        
        const examData = await examService.getExamForTaking(id, userId, password);
        return successResponse(examData, 'Exam data retrieved successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to get exam for taking');
      }
    });

    // Debug endpoint to test session behavior (remove in production)
    fastify.get<{ Params: ExamParams }>('/exams/:id/debug-session', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        // Get current session info
        const activeSession = await examService['sessionService'].getActiveSession(id, userId);
        const remainingAttempts = await examService['sessionService'].getRemainingAttempts(id, userId, 3);
        
        return successResponse({
          examId: id,
          userId: userId,
          activeSession: activeSession ? {
            id: activeSession.id,
            attemptNumber: activeSession.attemptNumber,
            startedAt: activeSession.startedAt,
            isActive: activeSession.isActive,
            timeRemaining: activeSession.timeRemaining
          } : null,
          remainingAttempts
        }, 'Debug session info');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to get session debug info');
      }
    });

    fastify.post<{ Params: ExamParams; Body: any }>('/exams/:id/submit', async (request, reply) => {
      try {
        const { id } = examIdSchema.parse(request.params);
        const userId = getUserIdFromRequest(request);
        
        const submissionData = examSubmissionSchema.parse(request.body);
        const submission = {
          examId: id,
          answers: submissionData.answers.map(answer => ({
            questionId: answer.questionId,
            answer: answer.answer,
            timeSpent: answer.timeSpent
          })),
          timeSpent: submissionData.timeSpent,
          isAutoSubmit: submissionData.isAutoSubmit,
          submittedAt: submissionData.submittedAt
        };
        
        const result = await examService.submitExamAnswers(submission, userId);
        return successResponse(result, 'Exam submitted successfully');
      } catch (error) {
        return handleRouteError(error, reply, 'Failed to submit exam');
      }
    });
  });
}
