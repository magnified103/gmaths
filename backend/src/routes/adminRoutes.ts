import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider, hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { PrismaClient } from '@prisma/client';
import { createUser, getUserList, getUserById, updateUser, deleteUser } from '../services/authService';
import { processBulkUserImport, generateCSVTemplate } from '../services/csvService';
import { ExamService } from '../services/examService';
import { requirePermission } from '../utils/authMiddleware';
import { handleRouteError, successResponse } from '../utils/errorHandler';
import { adminUserCreateSchema, adminUserUpdateSchema, userFiltersSchema, userSchema, userListResponseSchema } from '../schemas/user';
import { UserIdParamSchema } from '../schemas/common';
import { NotFoundError, ServiceError } from '../utils/errors';

// Initialize prisma client and exam service for admin summaries
const prisma = new PrismaClient();
const examService = new ExamService();


/**
 * Admin routes for user management.
 * @param fastify - Fastify instance.
 */
export async function adminRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /admin/users - Get paginated list of users with filtering
   */
  app.get('/admin/users', {
    preHandler: requirePermission('User:Read'),
    schema: {
      querystring: userFiltersSchema,
      tags: ['Admin'],
      response: {
        200: userListResponseSchema,
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filters = userFiltersSchema.parse(request.query);
      const result = await getUserList(filters);

      return reply.send(successResponse(result, 'Danh sách người dùng'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get User List');
    }
  });

  /**
   * GET /admin/users/:id - Get user by ID
   */
  app.get('/admin/users/:id', {
    preHandler: requirePermission('User:Read'),
    schema: {
      params: UserIdParamSchema,
      tags: ['Admin'],
      response: {
        200: userSchema,
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await getUserById(id);

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    return reply.send(successResponse(user, 'Thông tin người dùng'));
  });

  /**
   * POST /admin/users - Create a new user
   */
  app.post('/admin/users', {
    preHandler: requirePermission('User:Create'),
    schema: {
      body: adminUserCreateSchema,
      tags: ['Admin'],
      response: {
        201: userSchema,
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userData = adminUserCreateSchema.parse(request.body);
    const user = await createUser(userData.username, userData.email, userData.password, userData.roles);

    return reply.status(201).send(successResponse(user, 'Tạo người dùng thành công', 201));
  });

  /**
   * PUT /admin/users/:id - Update user
   */
  app.put('/admin/users/:id', {
    preHandler: requirePermission('User:Update'),
    schema: {
      params: UserIdParamSchema,
      body: adminUserUpdateSchema,
      response: {
        200: userSchema,
      },
      tags: ['Admin']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userData = adminUserUpdateSchema.parse(request.body);

    const user = await updateUser(id, userData);

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    return reply.send(successResponse(user, 'Cập nhật người dùng thành công'));
  });

  /**
   * DELETE /admin/users/:id - Delete user
   */
  app.delete('/admin/users/:id', {
    preHandler: requirePermission('User:Delete'),
    schema: {
      params: UserIdParamSchema,
      tags: ['Admin']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const success = await deleteUser(id);

    if (!success) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    return reply.status(204).send();
  });

  /**
   * POST /admin/users/import - Bulk import users from CSV
   */
  app.post('/admin/users/import', {
    preHandler: requirePermission('User:Read', 'User:Create', 'User:Update'),
    schema: {
      tags: ['Admin'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      throw new NotFoundError('Không tìm thấy tệp CSV');
    }

    // Validate file type
    if (!data.filename?.toLowerCase().endsWith('.csv')) {
      throw new ServiceError('Chỉ chấp nhận tệp CSV (.csv)');
    }

    // Get overwrite parameter from fields
    let overwrite = false;
    if (data.fields && 'overwrite' in data.fields) {
      const overwriteField = data.fields.overwrite;
      if (typeof overwriteField === 'object' && 'value' in overwriteField) {
        overwrite = overwriteField.value === 'true';
      }
    }

    // Process CSV file
    const buffer = await data.toBuffer();
    const result = await processBulkUserImport(buffer, overwrite);

    return reply.send(successResponse(result, 'Xử lý tệp CSV thành công'));
  });

  /**
   * GET /admin/users/template - Download CSV template
   */
  app.get('/admin/users/template', {
    preHandler: requirePermission('User:Read', 'User:Create', 'User:Update'),
    schema: {
      tags: ['Admin'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const csvContent = generateCSVTemplate();
      
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="user-import-template.csv"')
      .send(csvContent);
  });

  /**
   * GET /admin/exam-summaries - Get exam summaries for admin dashboard
   */
  app.get('/admin/exam-summaries', {
    preHandler: requirePermission('Stats:Read'),
    schema: {
      tags: ['Admin'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const examSummaries = await examService.getExamSummariesForAdmin();

    return reply.send(successResponse(examSummaries, 'Exam summaries retrieved successfully'));
  });

  /**
   * GET /admin/student-summaries - Get student summaries for admin dashboard
   */
  app.get('/admin/student-summaries', {
    preHandler: requirePermission('Stats:Read'),
    schema: {
      tags: ['Admin'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const studentSummaries = await examService.getStudentSummariesForAdmin();

    return reply.send(successResponse(studentSummaries, 'Student summaries retrieved successfully'));
  });

  /**
   * GET /admin/dashboard-stats - Get comprehensive dashboard statistics
   */
  app.get('/admin/dashboard-stats', {
    preHandler: requirePermission('Stats:Read'),
    schema: {
      tags: ['Admin'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get user count
      const userCount = await prisma.user.count();

      // Get question count
      const questionCount = await prisma.question.count({
        where: { isDeleted: false }
      });

      // Get exam count
      const examCount = await prisma.exam.count({
        where: { isDeleted: false }
      });

      // Get submission count (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const submissionCount = await prisma.examSubmission.count({
        where: {
          submittedAt: {
            gte: startOfMonth
          }
        }
      });

      const stats = {
        totalUsers: userCount,
        totalQuestions: questionCount,
        totalExams: examCount,
        totalSubmissions: submissionCount
      };
      
      return reply.send(successResponse(stats, 'Dashboard statistics retrieved successfully'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get Dashboard Stats');
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      reply.status(400).send({
        code: 400,
        message: 'Validation Error',
        errors: error.validation.map(err => ({
          locationType: error.validationContext,
          location: err.instancePath.substring(1),  // Remove leading slash
          message: err.message,
        })),
      });
      return;
    }

    if (error instanceof ServiceError) {
      reply.status(error.code as number).send({
        code: error.code,
        message: error.message,
        errors: error.errors || [],
      });
      return;
    }

    reply.status(400).send({
      code: 400,
      message: error.message,
      errors: [],
    });
  });
}
