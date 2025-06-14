import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserRole, PrismaClient } from '@prisma/client';
import { createUser, getUserList, getUserById, updateUser, deleteUser } from '../services/authService';
import { processBulkUserImport, generateCSVTemplate } from '../services/csvService';
import { ExamService } from '../services/examService';
import { authenticateToken, requireRole } from '../utils/authMiddleware';
import { handleRouteError, successResponse } from '../utils/errorHandler';

// Initialize prisma client and exam service for admin summaries
const prisma = new PrismaClient();
const examService = new ExamService();

/**
 * User creation schema for admin use (allows role specification)
 */
const adminUserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['student', 'admin']),
});

/**
 * User update schema for admin use
 */
const adminUserUpdateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(['student', 'admin']),
  emailVerified: z.boolean(),
});

/**
 * User filters and pagination schema
 */
const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['all', 'student', 'admin']).default('all'),
  emailVerified: z.enum(['all', 'verified', 'unverified']).default('all'),
  sortBy: z.enum(['username', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => Math.min(parseInt(val, 10), 100)).default('20'),
});

/**
 * Maps string role to UserRole enum.
 */
function mapStringToUserRole(roleString: string): UserRole {
  return roleString === 'admin' ? UserRole.ADMIN : UserRole.STUDENT;
}

/**
 * Admin routes for user management.
 * @param fastify - Fastify instance.
 */
export async function adminRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/users - Get paginated list of users with filtering
   */
  fastify.get('/admin/users', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
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
  fastify.get('/admin/users/:id', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await getUserById(id);
      
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      return reply.send(successResponse(user, 'Thông tin người dùng'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get User By ID');
    }
  });

  /**
   * POST /admin/users - Create a new user
   */
  fastify.post('/admin/users', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userData = adminUserCreateSchema.parse(request.body);
      const userRole = mapStringToUserRole(userData.role);
      const user = await createUser(userData.username, userData.email, userData.password, userRole);
      
      return reply.status(201).send(successResponse(user, 'Tạo người dùng thành công', 201));
    } catch (error) {
      return handleRouteError(error, reply, 'Create User');
    }
  });

  /**
   * PUT /admin/users/:id - Update user
   */
  fastify.put('/admin/users/:id', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userData = adminUserUpdateSchema.parse(request.body);
      
      const updateData = {
        username: userData.username,
        email: userData.email,
        role: mapStringToUserRole(userData.role),
        emailVerified: userData.emailVerified,
      };
      
      const user = await updateUser(id, updateData);
      
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      return reply.send(successResponse(user, 'Cập nhật người dùng thành công'));
    } catch (error) {
      return handleRouteError(error, reply, 'Update User');
    }
  });

  /**
   * DELETE /admin/users/:id - Delete user
   */
  fastify.delete('/admin/users/:id', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await deleteUser(id);
      
      if (!success) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply, 'Delete User');
    }
  });

  /**
   * POST /admin/users/import - Bulk import users from CSV
   */
  fastify.post('/admin/users/import', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        throw new Error('Không tìm thấy tệp CSV');
      }
      
      // Validate file type
      if (!data.filename?.toLowerCase().endsWith('.csv')) {
        throw new Error('Chỉ chấp nhận tệp CSV (.csv)');
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
    } catch (error) {
      return handleRouteError(error, reply, 'CSV Import');
    }
  });

  /**
   * GET /admin/users/template - Download CSV template
   */
  fastify.get('/admin/users/template', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const csvContent = generateCSVTemplate();
      
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="user-import-template.csv"')
        .send(csvContent);
    } catch (error) {
      return handleRouteError(error, reply, 'Generate CSV Template');
    }
  });

  /**
   * GET /admin/exam-summaries - Get exam summaries for admin dashboard
   */
  fastify.get('/admin/exam-summaries', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const examSummaries = await examService.getExamSummariesForAdmin();
      
      return reply.send(successResponse(examSummaries, 'Exam summaries retrieved successfully'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get Exam Summaries');
    }
  });

  /**
   * GET /admin/student-summaries - Get student summaries for admin dashboard
   */
  fastify.get('/admin/student-summaries', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const studentSummaries = await examService.getStudentSummariesForAdmin();
      
      return reply.send(successResponse(studentSummaries, 'Student summaries retrieved successfully'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get Student Summaries');
    }
  });

  /**
   * GET /admin/dashboard-stats - Get comprehensive dashboard statistics
   */
  fastify.get('/admin/dashboard-stats', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)]
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
} 