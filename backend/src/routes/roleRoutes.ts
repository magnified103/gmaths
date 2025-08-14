import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createRoleSchema, updateRoleSchema, roleSchema } from '../schemas/role';
import { requirePermission } from '../utils/authMiddleware';
import * as roleService from '../services/roleService';
import { listResponseSchema, singleObjectResponseSchema, errorResponseSchema } from '../schemas/common';
import { NotFoundError, ServiceError } from '../utils/errors'; // Import specific error types

export async function roleRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * @route GET /api/roles
   * @desc Get all roles
   * @access Private (role.manage permission required)
   */
  app.get('/roles', {
    preHandler: requirePermission('Role:Read'),
    schema: {
      summary: 'Get all roles',
      tags: ['Admin'],
      response: {
        200: listResponseSchema(roleSchema),
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const roles = await roleService.getAllRoles();
    reply.send({
      items: roles,
      totalItems: roles.length,
    });
  });

  /**
   * @route GET /api/roles/:slug
   * @desc Get a role by slug
   * @access Private (role.manage permission required)
   */
  app.get('/roles/:slug', {
    preHandler: requirePermission('Role:Read'),
    schema: {
      summary: 'Get a role by slug',
      tags: ['Admin'],
      params: roleSchema.pick({ slug: true }),
      response: {
        200: singleObjectResponseSchema(roleSchema),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const role = await roleService.getRoleBySlug(request.params.slug as string);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    reply.send(role);
  });

  /**
   * @route POST /api/roles
   * @desc Create a new role
   * @access Private (role.manage permission required)
   */
  app.post('/roles', {
    preHandler: requirePermission('Role:Create'),
    schema: {
      summary: 'Create a new role',
      tags: ['Admin'],
      body: createRoleSchema,
      response: {
        201: singleObjectResponseSchema(roleSchema),
        401: errorResponseSchema,
        403: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const newRole = await roleService.createRole(request.body);
    reply.status(201).send(newRole);
  });

  /**
   * @route PUT /api/roles/:slug
   * @desc Update an existing role
   * @access Private (role.manage permission required)
   */
  app.put('/roles/:slug', {
    preHandler: requirePermission('Role:Update'),
    schema: {
      summary: 'Update an existing role',
      tags: ['Admin'],
      params: roleSchema.pick({ slug: true }),
      body: updateRoleSchema,
      response: {
        200: singleObjectResponseSchema(roleSchema),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const updatedRole = await roleService.updateRole(request.params.slug as string, request.body);
    if (!updatedRole) {
      throw new NotFoundError('Role not found');
    }
    reply.send(updatedRole);
  });

  /**
   * @route DELETE /api/roles/:slug
   * @desc Delete a role
   * @access Private (role.manage permission required)
   */
  app.delete('/roles/:slug', {
    preHandler: requirePermission('Role:Delete'),
    schema: {
      summary: 'Delete a role',
      tags: ['Admin'],
      params: roleSchema.pick({ slug: true }),
      response: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const deleted = await roleService.deleteRole(request.params.slug as string);
    if (!deleted) {
      throw new NotFoundError('Role not found');
    }
    reply.send({ success: true, message: 'Role deleted successfully' });
  });
}
