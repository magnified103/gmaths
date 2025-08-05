/**
 * Timer synchronization API routes
 * Provides HTTP fallback for WebSocket timer functionality
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../utils/authMiddleware';
import { WebSocketService } from '../services/websocketService';

interface TimerSyncQuery {
  examId?: string;
}

/**
 * Timer routes registration
 * @param fastify - Fastify instance
 * @param websocketService - WebSocket service instance
 */
export async function timerRoutes(fastify: FastifyInstance, websocketService: WebSocketService) {
  /**
   * GET /api/timer/sync
   * Get server time synchronization data
   */
  fastify.get<{ Querystring: TimerSyncQuery }>('/sync', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { examId } = request.query;
      // @ts-ignore
      const userId = request.userId;

      if (!userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      let syncData;
      
      if (examId) {
        // Get exam-specific timer data
        syncData = await websocketService.getTimerSync(examId, userId);
      } else {
        // General time sync
        syncData = {
          serverTime: Date.now(),
          examStartTime: Date.now(),
          examDuration: 0,
          timeRemaining: 0
        };
      }

      reply.send({
        success: true,
        data: syncData
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Timer sync failed'
      });
    }
  });

  /**
   * GET /api/timer/status
   * Get timer service status
   */
  fastify.get('/status', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      reply.send({
        success: true,
        data: {
          status: 'operational',
          serverTime: Date.now(),
          websocketEnabled: true
        }
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get timer status'
      });
    }
  });
}
