import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import multipart from '@fastify/multipart';
import { adminRoutes } from '../../src/routes/adminRoutes';
import { ZodTypeProvider, ZodFastifySchemaValidationError, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { PrismaClient } from '@prisma/client';
import formAutoContent from 'form-auto-content';
import {
  createUser,
  getUserList,
  getUserById,
  updateUser,
  deleteUser,
} from '../../src/services/authService';
import {
  processBulkUserImport,
  generateCSVTemplate,
} from '../../src/services/csvService';
import jwt from '@fastify/jwt';
import { ExamService } from '../../src/services/examService';
import { requirePermission } from '../../src/utils/authMiddleware';
import { successResponse, handleRouteError } from '../../src/utils/errorHandler';
import { ServiceError } from '@/utils/errors';
import { createId } from '@paralleldrive/cuid2';

// Mock external dependencies
jest.mock('../../src/services/authService');
jest.mock('../../src/services/csvService');
jest.mock('../../src/services/examService');
jest.mock('../../src/utils/authMiddleware');
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      count: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    exam: {
      count: jest.fn(),
    },
    examSubmission: {
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Admin Routes', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Register form body plugin for JSON parsing
    await app.register(require('@fastify/formbody'));
    // Setup multipart for file uploads
    await app.register(multipart);
    
    // Register admin routes
    await app.register(adminRoutes, { prefix: '/' });

    // Set up JWT for testing
    await app.register(jwt, {
      secret: 'a-very-secret-key-that-should-be-in-env',
    });

    // Clear all mocks
    jest.clearAllMocks();

    (requirePermission as jest.Mock).mockImplementation((...permissions: string[]) => (request: any, reply: any, done: any) => {
      request.user = { role: { permissions: permissions.map(p => ({ name: p })) } }; // Mock user with all required permissions
      done();
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /admin/users', () => {
    it('should return a list of users', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
        roles: ['Student'],
        createdAt: new Date().toISOString(), // Added missing field
        updatedAt: new Date().toISOString(), // Added missing field
        lastLoginAt: null
      };
      const mockUserListResponse = {
        items: [mockUser],
        pageIndex: 1,
        itemsPerPage: 10,
        totalPages: 1,
      };
      (getUserList as jest.Mock).mockResolvedValue(mockUserListResponse);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockUserListResponse);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/users?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: 400,
        message: 'Validation Error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            locationType: 'querystring',
            location: 'page',
            message: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should return a user by ID', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
        roles: [],
      };
      (getUserById as jest.Mock).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users/1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockUser);
      expect(getUserById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if user not found', async () => {
      (getUserById as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users/999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 404,
        errors: [],
        message: 'Không tìm thấy người dùng',
      });
    });

    it('should handle errors when getting user by ID', async () => {
      const errorMessage = 'Database error';
      (getUserById as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users/1',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('POST /admin/users', () => {
    it('should create a new user', async () => {
      const mockUserData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        roleName: 'student',
      };
      const mockCreatedUser = {
        id: createId(),
        username: mockUserData.username,
        email: mockUserData.email,
        roles: [mockUserData.roleName],
        emailVerified: false,
      };
      (createUser as jest.Mock).mockResolvedValue(mockCreatedUser);

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users',
        payload: mockUserData,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(mockCreatedUser);
      expect(createUser).toHaveBeenCalledWith(
        mockUserData.username,
        mockUserData.email,
        mockUserData.password,
        mockUserData.roleName
      );
    });

    it('should return 400 for invalid user creation data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/users',
        payload: { username: 'a', email: 'invalid-email' }, // Invalid data
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: 400,
        message: 'Validation Error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            locationType: 'body',
            location: 'username',
            message: expect.any(String),
          }),
          expect.objectContaining({
            locationType: 'body',
            location: 'email',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle errors when creating user', async () => {
      const errorMessage = 'User already exists';
      (createUser as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users',
        payload: {
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
          roleName: 'student',
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should update an existing user', async () => {
      const mockUserData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };
      const mockUpdatedUser = {
        id: createId(),
        ...mockUserData,
        roles: ['student'],
        emailVerified: false,
      };
      (updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await app.inject({
        method: 'PUT',
        url: '/admin/users/1',
        payload: mockUserData,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockUpdatedUser);
      expect(updateUser).toHaveBeenCalledWith('1', mockUserData);
    });

    it('should return 404 if user to update not found', async () => {
      (updateUser as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/admin/users/999',
        payload: { username: 'nonexistent' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 404,
        errors: [],
        message: 'Không tìm thấy người dùng',
      });
    });

    it('should return 400 for invalid user update data', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/admin/users/1',
        payload: { email: 'invalid-email' }, // Invalid data
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: 400,
        message: 'Validation Error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            locationType: 'body',
            location: 'email',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle errors when updating user', async () => {
      const errorMessage = 'Update failed';
      (updateUser as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'PUT',
        url: '/admin/users/1',
        payload: { username: 'failupdate' },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete a user', async () => {
      (deleteUser as jest.Mock).mockResolvedValue(true);

      const response = await app.inject({
        method: 'DELETE',
        url: '/admin/users/1',
      });

      expect(response.statusCode).toBe(204);
      expect(response.payload).toBe('');
      expect(deleteUser).toHaveBeenCalledWith('1');
    });

    it('should return 404 if user to delete not found', async () => {
      (deleteUser as jest.Mock).mockResolvedValue(false);

      const response = await app.inject({
        method: 'DELETE',
        url: '/admin/users/999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 404,
        errors: [],
        message: 'Không tìm thấy người dùng',
      });
    });

    it('should handle errors when deleting user', async () => {
      const errorMessage = 'Deletion failed';
      (deleteUser as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'DELETE',
        url: '/admin/users/1',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('POST /admin/users/import', () => {
    it('should import users from CSV', async () => {
      const mockCsvBuffer = Buffer.from('username,email\nuser1,user1@example.com');
      const mockResult = { imported: 1, updated: 0, errors: [] };
      (processBulkUserImport as jest.Mock).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/import',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        payload: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="users.csv"\r\nContent-Type: text/csv\r\n\r\n${mockCsvBuffer.toString()}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockResult);
      expect(processBulkUserImport).toHaveBeenCalledWith(mockCsvBuffer, false);
    });

    it('should import users from CSV with overwrite true', async () => {
      const mockCsvBuffer = Buffer.from('username,email\nuser1,user1@example.com');
      const mockResult = { imported: 1, updated: 0, errors: [] };
      (processBulkUserImport as jest.Mock).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/import',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        payload: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="users.csv"\r\nContent-Type: text/csv\r\n\r\n${mockCsvBuffer.toString()}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockResult);
      expect(processBulkUserImport).toHaveBeenCalledWith(mockCsvBuffer, true);
    });

    it('should return 500 if no file is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/import',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        payload: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 404,
        errors: [],
        message: 'Không tìm thấy tệp CSV',
      });
    });

    it('should return 500 if file is not CSV', async () => {
      const mockBuffer = Buffer.from('some content');
      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/import',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        payload: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="users.txt"\r\nContent-Type: text/plain\r\n\r\n${mockBuffer.toString()}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: 'Chỉ chấp nhận tệp CSV (.csv)',
      });
    });

    it('should handle errors during CSV import processing', async () => {
      const errorMessage = 'CSV processing failed';
      (processBulkUserImport as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));
      const mockCsvBuffer = Buffer.from('username,email\nuser1,user1@example.com');

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/import',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        payload: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="users.csv"\r\nContent-Type: text/csv\r\n\r\n${mockCsvBuffer.toString()}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('GET /admin/users/template', () => {
    it('should download CSV template', async () => {
      const mockCsvContent = 'username,email,password,roleName\n';
      (generateCSVTemplate as jest.Mock).mockReturnValue(mockCsvContent);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users/template',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toBe('attachment; filename="user-import-template.csv"');
      expect(response.payload).toBe(mockCsvContent);
      expect(generateCSVTemplate).toHaveBeenCalled();
    });

    it('should handle errors when generating CSV template', async () => {
      const errorMessage = 'Template generation failed';
      (generateCSVTemplate as jest.Mock).mockImplementation(() => { throw new ServiceError(errorMessage) });

      const response = await app.inject({
        method: 'GET',
        url: '/admin/users/template',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('GET /admin/exam-summaries', () => {
    it('should return exam summaries', async () => {
      const mockSummaries = [{ id: 'e1', name: 'Exam 1' }];
      (ExamService.prototype.getExamSummariesForAdmin as jest.Mock).mockResolvedValue(mockSummaries);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/exam-summaries',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockSummaries);
      expect(ExamService.prototype.getExamSummariesForAdmin).toHaveBeenCalled();
    });

    it('should handle errors when getting exam summaries', async () => {
      const errorMessage = 'Failed to get exam summaries';
      (ExamService.prototype.getExamSummariesForAdmin as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'GET',
        url: '/admin/exam-summaries',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  describe('GET /admin/student-summaries', () => {
    it('should return student summaries', async () => {
      const mockSummaries = [{ id: 's1', name: 'Student 1' }];
      (ExamService.prototype.getStudentSummariesForAdmin as jest.Mock).mockResolvedValue(mockSummaries);

      const response = await app.inject({
        method: 'GET',
        url: '/admin/student-summaries',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockSummaries);
      expect(ExamService.prototype.getStudentSummariesForAdmin).toHaveBeenCalled();
    });

    it('should handle errors when getting student summaries', async () => {
      const errorMessage = 'Failed to get student summaries';
      (ExamService.prototype.getStudentSummariesForAdmin as jest.Mock).mockRejectedValue(new ServiceError(errorMessage));

      const response = await app.inject({
        method: 'GET',
        url: '/admin/student-summaries',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        code: 500,
        errors: [],
        message: errorMessage,
      });
    });
  });

  // describe('GET /admin/dashboard-stats', () => {
  //   it('should return dashboard statistics', async () => {
  //     (prisma.user.count as jest.Mock).mockResolvedValue(10);
  //     (prisma.question.count as jest.Mock).mockResolvedValue(50);
  //     (prisma.exam.count as jest.Mock).mockResolvedValue(5);
  //     (prisma.examSubmission.count as jest.Mock).mockResolvedValue(20);

  //     const response = await app.inject({
  //       method: 'GET',
  //       url: '/admin/dashboard-stats',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     expect(successResponse).toHaveBeenCalledWith(
  //       {
  //         totalUsers: 10,
  //         totalQuestions: 50,
  //         totalExams: 5,
  //         totalSubmissions: 20,
  //       },
  //       'Dashboard statistics retrieved successfully'
  //     );
  //     expect(response.json()).toEqual({
  //       code: 200,
  //       message: 'Dashboard statistics retrieved successfully',
  //       data: {
  //         totalUsers: 10,
  //         totalQuestions: 50,
  //         totalExams: 5,
  //         totalSubmissions: 20,
  //       },
  //     });
  //     expect(prisma.user.count).toHaveBeenCalled();
  //     expect(prisma.question.count).toHaveBeenCalledWith({ where: { isDeleted: false } });
  //     expect(prisma.exam.count).toHaveBeenCalledWith({ where: { isDeleted: false } });
  //     expect(prisma.examSubmission.count).toHaveBeenCalledWith(expect.objectContaining({
  //       where: {
  //         submittedAt: {
  //           gte: expect.any(Date)
  //         }
  //       }
  //     }));
  //     expect(requirePermission).toHaveBeenCalledWith('DashboardStat:Read');
  //   });

  //   it('should handle errors when getting dashboard statistics', async () => {
  //     const errorMessage = 'Failed to get stats';
  //     (prisma.user.count as jest.Mock).mockRejectedValue(new Error(errorMessage));

  //     const response = await app.inject({
  //       method: 'GET',
  //       url: '/admin/dashboard-stats',
  //     });

  //     expect(response.statusCode).toBe(500);
  //     expect(handleRouteError).toHaveBeenCalled();
  //     expect(response.json()).toEqual({
  //       code: 500,
  //       message: `Error in Get Dashboard Stats: ${errorMessage}`,
  //     });
  //   });
  // });
});
