import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getAllPermissions } from '../services/permissionService';
import { allPermissionsResponseSchema } from '../schemas/permission';
import { requirePermission } from '../utils/authMiddleware';
import { listResponseSchema, errorResponseSchema } from '../schemas/common';

export async function permissionRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * @route GET /api/permissions
   * @desc Get all permissions
   * @access Private (permission.read permission required)
   */
  app.get('/permissions', {
    preHandler: requirePermission('Permission:Read'),
    schema: {
      summary: 'Get all permissions',
      tags: ['Admin'],
      response: {
        200: allPermissionsResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const permissions = await getAllPermissions();
    reply.send({
      items: permissions,
      totalItems: permissions.length,
    });
  });
}
