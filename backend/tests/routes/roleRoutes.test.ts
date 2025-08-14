// Mock external dependencies
const permissionCheck = jest.fn();
const requireLogin = jest.fn();
jest.mock('../../src/utils/authMiddleware', () => ({
  requirePermission: (...permissions: string[]) => {
    return async function (request: any, reply: any) {
      return permissionCheck(permissions, request, reply);
    };
  },
  requireLogin: requireLogin,
}));
jest.mock('../../src/services/roleService');

import Fastify, { FastifyInstance } from 'fastify';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { roleRoutes } from '../../src/routes/roleRoutes';
import * as roleService from '../../src/services/roleService';
import { ServiceError, globalErrorHandler } from '../../src/utils/errors';
import { createId } from '@paralleldrive/cuid2';

describe('Role Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Set error handler
    app.setErrorHandler(globalErrorHandler);

    // Register JWT for testing
    await app.register(require('@fastify/jwt'), {
      secret: 'test-secret-key-for-testing-only',
    });

    // Register role routes
    await app.register(roleRoutes, { prefix: '/api' });

    // Clear all mocks
    jest.clearAllMocks();

    // Mock authentication and permission middleware
    (requireLogin as jest.Mock).mockImplementation(async (request: any, reply: any) => {
      request.userId = createId(); // Mock a user ID
    });
    permissionCheck.mockImplementation(async (permissions: string[], request: any, reply: any) => {
      // do nothing, simulating permission check success
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/roles', () => {
    test('should return a list of all roles', async () => {
      const mockRoles = [
        { slug: 'admin', name: 'Admin', description: 'Admin role', permissions: ['user.manage'] },
        { slug: 'student', name: 'Student', description: 'Student role', permissions: ['exam.take'] },
      ];
      (roleService.getAllRoles as jest.Mock).mockResolvedValue(mockRoles);

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: mockRoles,
        totalItems: mockRoles.length,
      });
      expect(roleService.getAllRoles).toHaveBeenCalledTimes(1);
    });

    test('should return 403 if user lacks permission', async () => {
      permissionCheck.mockImplementation(async (permissions: string[], request: any, reply: any) => {
        throw new ServiceError('Forbidden: Insufficient permissions', 403);
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles',
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Forbidden: Insufficient permissions',
        code: 403,
      }));
    });

    test('should handle errors from roleService.getAllRoles', async () => {
      const errorMessage = 'Database connection failed';
      (roleService.getAllRoles as jest.Mock).mockRejectedValue(new ServiceError(errorMessage, 500));

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(expect.objectContaining({
        message: errorMessage,
        code: 500,
      }));
    });
  });

  describe('GET /api/roles/:slug', () => {
    test('should return a role by slug', async () => {
      const mockRole = { slug: 'teacher', name: 'Teacher', description: 'Teacher role', permissions: ['question.manage'] };
      (roleService.getRoleBySlug as jest.Mock).mockResolvedValue(mockRole);

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles/teacher',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockRole);
      expect(roleService.getRoleBySlug).toHaveBeenCalledWith('teacher');
    });

    test('should return 404 if role not found', async () => {
      (roleService.getRoleBySlug as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Role not found',
        code: 404,
      }));
    });

    test('should handle errors from roleService.getRoleBySlug', async () => {
      const errorMessage = 'Network error';
      (roleService.getRoleBySlug as jest.Mock).mockRejectedValue(new ServiceError(errorMessage, 500));

      const response = await app.inject({
        method: 'GET',
        url: '/api/roles/teacher',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(expect.objectContaining({
        message: errorMessage,
        code: 500,
      }));
    });
  });

  describe('POST /api/roles', () => {
    const newRoleData = {
      slug: 'new-role',
      name: 'New Role',
      description: 'A newly created role',
      permissions: ['exam.create'],
    };

    test('should create a new role', async () => {
      const mockCreatedRole = { ...newRoleData };
      (roleService.createRole as jest.Mock).mockResolvedValue(mockCreatedRole);

      const response = await app.inject({
        method: 'POST',
        url: '/api/roles',
        payload: newRoleData,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(mockCreatedRole);
      expect(roleService.createRole).toHaveBeenCalledWith(newRoleData);
    });

    test('should return 400 for invalid input', async () => {
      const invalidData = { slug: '', name: '' }; // Invalid data
      const response = await app.inject({
        method: 'POST',
        url: '/api/roles',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Validation Error',
        code: 400,
      }));
    });

    test('should return 409 if role with slug already exists', async () => {
      (roleService.createRole as jest.Mock).mockRejectedValue(new ServiceError('Role with this slug already exists', 409));

      const response = await app.inject({
        method: 'POST',
        url: '/api/roles',
        payload: newRoleData,
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Role with this slug already exists',
        code: 409,
      }));
    });
  });

  describe('PUT /api/roles/:slug', () => {
    const updateData = {
      name: 'Updated Role Name',
      description: 'Updated description',
      permissions: ['exam.update'],
    };

    test('should update an existing role', async () => {
      const mockUpdatedRole = { slug: 'existing-role', ...updateData };
      (roleService.updateRole as jest.Mock).mockResolvedValue(mockUpdatedRole);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/roles/existing-role',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockUpdatedRole);
      expect(roleService.updateRole).toHaveBeenCalledWith('existing-role', updateData);
    });

    test('should return 404 if role to update not found', async () => {
      (roleService.updateRole as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/roles/nonexistent',
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Role not found',
        code: 404,
      }));
    });

    test('should return 400 for invalid update input', async () => {
      const invalidData = { name: '' }; // Invalid data
      const response = await app.inject({
        method: 'PUT',
        url: '/api/roles/existing-role',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Validation Error',
        code: 400,
      }));
    });
  });

  describe('DELETE /api/roles/:slug', () => {
    test('should delete a role successfully', async () => {
      (roleService.deleteRole as jest.Mock).mockResolvedValue(true);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/roles/deletable-role',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true, message: 'Role deleted successfully' });
      expect(roleService.deleteRole).toHaveBeenCalledWith('deletable-role');
    });

    test('should return 404 if role to delete not found', async () => {
      (roleService.deleteRole as jest.Mock).mockResolvedValue(false);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/roles/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Role not found',
        code: 404,
      }));
    });

    test('should handle errors from roleService.deleteRole', async () => {
      const errorMessage = 'Deletion failed due to database error';
      (roleService.deleteRole as jest.Mock).mockRejectedValue(new ServiceError(errorMessage, 500));

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/roles/error-role',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(expect.objectContaining({
        message: errorMessage,
        code: 500,
      }));
    });
  });
});
