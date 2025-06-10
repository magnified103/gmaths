/**
 * Grading and analytics routes
 * Handles exam results, leaderboards, and performance analytics
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticateToken, requireRole } from '../utils/authMiddleware';
import { ExamService } from '../services/examService';
import { handleRouteError } from '../utils/errorHandler';

const examService = new ExamService();

/**
 * Route parameters
 */
interface ExamParams {
  examId: string;
}

interface UserParams {
  userId: string;
}

interface ExamUserParams {
  examId: string;
  userId: string;
}

interface LeaderboardQuery {
  limit?: string;
}

/**
 * Extract user ID from authenticated request
 */
function getUserIdFromRequest(request: FastifyRequest): string {
  const user = request.user;
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

/**
 * Grading and analytics routes
 */
export async function gradingRoutes(fastify: FastifyInstance) {
  
  // Add route prefix
  await fastify.register(async function(fastify) {
    
    /**
     * GET /api/grading/exams/:examId/results/:userId
     * Get detailed exam results for a specific student (Admin only)
     */
    fastify.get<{ Params: ExamUserParams }>('/exams/:examId/results/:userId', {
      preHandler: [authenticateToken, requireRole('ADMIN')]
    }, async (request, reply) => {
      try {
        const { examId, userId } = request.params;
        
        const results = await examService.getExamResults(examId, userId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam results');
      }
    });

    /**
     * GET /api/grading/exams/:examId/results/me
     * Get detailed exam results for current student
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/results/me', {
      preHandler: authenticateToken
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        const userId = getUserIdFromRequest(request);
        
        const results = await examService.getExamResults(examId, userId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get student exam results');
      }
    });

    /**
     * GET /api/grading/exams/:examId/leaderboard
     * Get leaderboard for an exam
     */
    fastify.get<{ Params: ExamParams; Querystring: LeaderboardQuery }>('/exams/:examId/leaderboard', {
      preHandler: authenticateToken
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        const { limit = '50' } = request.query;
        
        const limitNum = parseInt(limit, 10) || 50;
        const leaderboard = await examService.getExamLeaderboard(examId, limitNum);
        
        reply.send({
          success: true,
          data: {
            entries: leaderboard,
            examId
          }
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam leaderboard');
      }
    });

    /**
     * GET /api/grading/exams/:examId/analytics
     * Get performance analytics for an exam (Admin only)
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/analytics', {
      preHandler: [authenticateToken, requireRole('ADMIN')]
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        
        const analytics = await examService.getExamAnalytics(examId);
        
        reply.send({
          success: true,
          data: analytics
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam analytics');
      }
    });

    /**
     * GET /api/grading/students/:userId/results
     * Get all exam results for a specific student (Admin or self only)
     */
    fastify.get<{ Params: UserParams }>('/students/:userId/results', {
      preHandler: authenticateToken
    }, async (request, reply) => {
      try {
        const { userId } = request.params;
        const currentUserId = getUserIdFromRequest(request);
        const userRole = request.user?.role;
        
        // Check permissions - admin can view any student, students can only view themselves
        if (userRole !== 'ADMIN' && currentUserId !== userId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view your own results'
          });
        }
        
        // Get all exam submissions for the student
        const results = await examService.getStudentExamHistory(userId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get student results');
      }
    });

    /**
     * GET /api/grading/students/me/results
     * Get all exam results for current student
     */
    fastify.get('/students/me/results', {
      preHandler: authenticateToken
    }, async (request, reply) => {
      try {
        const userId = getUserIdFromRequest(request);
        
        const results = await examService.getStudentExamHistory(userId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get student exam history');
      }
    });

    /**
     * GET /api/grading/dashboard/stats
     * Get grading dashboard statistics (Admin only)
     */
    fastify.get('/dashboard/stats', {
      preHandler: [authenticateToken, requireRole('ADMIN')]
    }, async (request, reply) => {
      try {
        const stats = await examService.getGradingDashboardStats();
        
        reply.send({
          success: true,
          data: stats
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get grading dashboard stats');
      }
    });

    /**
     * POST /api/grading/exams/:examId/regrade
     * Regrade an exam with updated scoring algorithms (Admin only)
     */
    fastify.post<{ Params: ExamParams }>('/exams/:examId/regrade', {
      preHandler: [authenticateToken, requireRole('ADMIN')]
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        
        const result = await examService.regradeExam(examId);
        
        reply.send({
          success: true,
          data: result,
          message: 'Exam regraded successfully'
        });
      } catch (error) {
        return handleRouteError(error, reply, 'regrade exam');
      }
    });

    /**
     * GET /api/grading/exams/:examId/export
     * Export exam results as CSV (Admin only)
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/export', {
      preHandler: [authenticateToken, requireRole('ADMIN')]
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        
        const csvData = await examService.exportExamResults(examId);
        
        reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="exam-${examId}-results.csv"`)
          .send(csvData);
      } catch (error) {
        return handleRouteError(error, reply, 'export exam results');
      }
    });

  }, { prefix: '/api/grading' });
}

export default gradingRoutes; 