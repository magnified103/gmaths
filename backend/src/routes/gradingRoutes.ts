/**
 * Grading and analytics routes
 * Handles exam results, leaderboards, and performance analytics
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate, requirePermission } from '../utils/authMiddleware';
import { hasPermission } from '../services/permissionService';
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

interface ExamAttemptParams {
  examId: string;
  attemptNumber: string;
}

interface ExamUserAttemptParams {
  examId: string;
  userId: string;
  attemptNumber: string;
}

interface LeaderboardQuery {
  limit?: string;
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
      preHandler: [requirePermission('ExamResult:Read')]
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
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        // @ts-ignore
        const userId = request.userId;
        
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
      preHandler: authenticate
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
      preHandler: [requirePermission('ExamAnalytics:Read')]
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
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        const { userId } = request.params;
        // @ts-ignore
        const currentUserId = request.userId;
        
        const canView = await hasPermission(currentUserId, 'studentresult:read');

        if (!canView && currentUserId !== userId) {
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
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        // @ts-ignore
        const userId = request.userId;
        
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
     * GET /api/grading/students/me/results/grouped
     * Get all exam results for current student grouped by exam
     */
    fastify.get('/students/me/results/grouped', {
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        // @ts-ignore
        const userId = request.userId;
        
        const results = await examService.getStudentExamHistoryGrouped(userId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get grouped student exam history');
      }
    });

    /**
     * GET /api/grading/dashboard/stats
     * Get grading dashboard statistics (Admin only)
     */
    fastify.get('/dashboard/stats', {
      preHandler: [requirePermission('GradingDashboard:Read')]
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
      preHandler: [requirePermission('Exam:Regrade')]
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
      preHandler: [requirePermission('ExamResult:Export')]
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

    /**
     * GET /api/grading/exams/:examId/attempts
     * Get all attempts for an exam by current student
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/attempts', {
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        // @ts-ignore
        const userId = request.userId;
        
        const attempts = await examService.getExamAttempts(examId, userId);
        
        reply.send({
          success: true,
          data: attempts
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam attempts');
      }
    });

    /**
     * GET /api/grading/exams/:examId/attempts/:attemptNumber
     * Get specific attempt results for current student
     */
    fastify.get<{ Params: ExamAttemptParams }>('/exams/:examId/attempts/:attemptNumber', {
      preHandler: authenticate
    }, async (request, reply) => {
      try {
        const { examId, attemptNumber } = request.params;
        // @ts-ignore
        const userId = request.userId;
        const attemptNum = parseInt(attemptNumber, 10);
        
        if (isNaN(attemptNum) || attemptNum < 1) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid attempt number'
          });
        }
        
        const results = await examService.getExamResultsByAttempt(examId, userId, attemptNum);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam attempt results');
      }
    });

    /**
     * GET /api/grading/exams/:examId/attempts/:userId/:attemptNumber
     * Get specific attempt results for a student (Admin only)
     */
    fastify.get<{ Params: ExamUserAttemptParams }>('/exams/:examId/attempts/:userId/:attemptNumber', {
      preHandler: requirePermission('ExamResult:Read')
    }, async (request, reply) => {
      try {
        const { examId, userId, attemptNumber } = request.params;
        const attemptNum = parseInt(attemptNumber, 10);
        
        if (isNaN(attemptNum) || attemptNum < 1) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid attempt number'
          });
        }
        
        const results = await examService.getExamResultsByAttempt(examId, userId, attemptNum);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get student exam attempt results');
      }
    });

    /**
     * GET /api/grading/exams/:examId/all-results
     * Get all results for a specific exam (Admin only)
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/all-results', {
      preHandler: requirePermission('ExamResult:Read')
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        
        const results = await examService.getExamAllResults(examId);
        
        reply.send({
          success: true,
          data: results
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get all exam results');
      }
    });

    /**
     * GET /api/grading/exams/:examId/info-stats
     * Get exam info and statistics (Admin only)
     */
    fastify.get<{ Params: ExamParams }>('/exams/:examId/info-stats', {
      preHandler: requirePermission('ExamStat:Read')
    }, async (request, reply) => {
      try {
        const { examId } = request.params;
        
        const data = await examService.getExamInfoAndStats(examId);
        
        reply.send({
          success: true,
          data
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get exam info and stats');
      }
    });

    /**
     * GET /api/grading/students/:userId/info-stats
     * Get student info and statistics (Admin only)
     */
    fastify.get<{ Params: UserParams }>('/students/:userId/info-stats', {
      preHandler: requirePermission('StudentStat:Read')
    }, async (request, reply) => {
      try {
        const { userId } = request.params;
        
        const data = await examService.getStudentInfoAndStats(userId);
        
        reply.send({
          success: true,
          data
        });
      } catch (error) {
        return handleRouteError(error, reply, 'get student info and stats');
      }
    });

  }, { prefix: '/api/grading' });
}

export default gradingRoutes;
