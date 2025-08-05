// Mock the auth service
jest.mock('../../src/services/authService');
// jest.mock('../../src/utils/authMiddleware');

import Fastify, { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import * as authService from '../../src/services/authService';
import { authRoutes } from '../../src/routes/authRoutes';
import { handleRouteError } from '../../src/utils/errorHandler';

const mockAuthService = authService as jest.Mocked<typeof authService>;
const authMiddleware = jest.requireActual('../../src/utils/authMiddleware');
// const mockAuthMiddleware = jest.requireMock('../../src/utils/authMiddleware');

describe('Authentication Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Create fresh Fastify instance for each test
    app = Fastify({ logger: false });
    
    // Register form body plugin for JSON parsing
    await app.register(require('@fastify/formbody'));
    
    // Register auth routes
    await app.register(authRoutes, { prefix: '/api' });

    // Set up JWT for testing
    await app.register(jwt, {
      secret: 'a-very-secret-key-that-should-be-in-env',
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  // describe('POST /api/auth/register', () => {
    // test('should register user successfully with valid data', async () => {
    //   const userData = {
    //     username: 'testuser',
    //     email: 'test@example.com',
    //     password: 'TestPassword123!',
    //     confirmPassword: 'TestPassword123!'
    //   };

    //   const mockResponse = {
    //     user: {
    //       id: 'test-user-id',
    //       username: userData.username,
    //       email: userData.email,
    //       role: 'STUDENT' as const,
    //       emailVerified: false
    //     },
    //     token: 'jwt-token'
    //   };

    //   mockAuthService.registerUser.mockResolvedValue(mockResponse);

    //   const response = await app.inject({
    //     method: 'POST',
    //     url: '/api/auth/register',
    //     payload: userData
    //   });

    //   expect(response.statusCode).toBe(201);
    //   const responseData = JSON.parse(response.body);
    //   expect(responseData.success).toBe(true);
    //   expect(responseData.message).toBe('Đăng ký thành công');
    //   expect(responseData.data).toEqual(mockResponse);
    // });

  //   test('should return validation error for invalid password', async () => {
  //     const userData = {
  //       username: 'testuser',
  //       email: 'test@example.com',
  //       password: 'weak', // Invalid password
  //       confirmPassword: 'weak'
  //     };

  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/api/auth/register',
  //       payload: userData
  //     });

  //     expect(response.statusCode).toBe(400);
  //     const responseData = JSON.parse(response.body);
  //     expect(responseData.error).toBe('Validation Error');
  //     expect(responseData.message).toBe('Dữ liệu đầu vào không hợp lệ');
  //     expect(responseData.details).toEqual(
  //       expect.arrayContaining([
  //         expect.objectContaining({
  //           field: 'password',
  //           message: expect.stringContaining('Mật khẩu phải có ít nhất')
  //         })
  //       ])
  //     );
  //   });

  //   test('should return validation error for mismatched passwords', async () => {
  //     const userData = {
  //       username: 'testuser',
  //       email: 'test@example.com',
  //       password: 'TestPassword123!',
  //       confirmPassword: 'DifferentPassword123!'
  //     };

  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/api/auth/register',
  //       payload: userData
  //     });

  //     expect(response.statusCode).toBe(400);
  //     const responseData = JSON.parse(response.body);
  //     expect(responseData.error).toBe('Validation Error');
  //     expect(responseData.details).toEqual(
  //       expect.arrayContaining([
  //         expect.objectContaining({
  //           field: 'confirmPassword',
  //           message: 'Mật khẩu xác nhận không khớp'
  //         })
  //       ])
  //     );
  //   });

  //   test('should return error for duplicate email', async () => {
  //     const userData = {
  //       username: 'testuser',
  //       email: 'test@example.com',
  //       password: 'TestPassword123!',
  //       confirmPassword: 'TestPassword123!'
  //     };

  //     mockAuthService.registerUser.mockRejectedValue(new Error('Email đã được sử dụng'));

  //     const response = await app.inject({
  //       method: 'POST',
  //       url: '/api/auth/register',
  //       payload: userData
  //     });

  //     expect(response.statusCode).toBe(409);
  //     const responseData = JSON.parse(response.body);
  //     expect(responseData.error).toBe('Conflict Error');
  //     expect(responseData.message).toBe('Email đã được sử dụng');
  //   });
  // });

  describe('POST /api/auth/login', () => {
    test('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const mockResult = {
        id: 'test-user-id',
        username: 'testuser',
        email: loginData.email,
        role: 'STUDENT' as const,
        emailVerified: true,
      };

      const mockResponse = {
        user: mockResult,
        token: expect.any(String)
      }

      mockAuthService.loginUser.mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Đăng nhập thành công');
      expect(responseData.data).toEqual(mockResponse);
    });

    test('should return validation error for invalid email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'TestPassword123!'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(400);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Validation Error');
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email không hợp lệ'
          })
        ])
      );
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      mockAuthService.loginUser.mockRejectedValue(new Error('Email hoặc mật khẩu không đúng'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(400);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Bad Request');
      expect(responseData.message).toBe('Email hoặc mật khẩu không đúng');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should request password reset successfully', async () => {
      const requestData = {
        email: 'test@example.com'
      };

      const mockResponse = { success: true };
      mockAuthService.requestPasswordReset.mockResolvedValue(mockResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi');
    });

    test('should return validation error for invalid email', async () => {
      const requestData = {
        email: 'invalid-email'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reset password successfully with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const mockResponse = { success: true };
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: resetData
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Mật khẩu đã được đặt lại thành công');
    });

    test('should return error for expired token', async () => {
      const resetData = {
        token: 'expired-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: resetData
      });

      expect(response.statusCode).toBe(400);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Bad Request');
      expect(responseData.message).toBe('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    test('should verify email successfully with valid token', async () => {
      const verificationData = {
        token: 'valid-verification-token'
      };

      const mockResponse = { success: true };
      mockAuthService.verifyEmail.mockResolvedValue(mockResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-email',
        payload: verificationData
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Email đã được xác thực thành công');
    });

    test('should return error for invalid token', async () => {
      const verificationData = {
        token: 'invalid-token'
      };

      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Token xác thực email không hợp lệ')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-email',
        payload: verificationData
      });

      expect(response.statusCode).toBe(400);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Bad Request');
      expect(responseData.message).toBe('Token xác thực email không hợp lệ');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return current user for authenticated request', async () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['student'],
        emailVerified: true
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser as any);

      const token = app.jwt.sign({ userId: mockUser.id });
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Thông tin người dùng');
      expect(responseData.data.user).toEqual(mockUser);
    });

    test('should return unauthorized for missing token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me'
      });

      expect(response.statusCode).toBe(401);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Unauthorized');
      expect(responseData.message).toBe('Invalid token');
    });

    test('should return unauthorized for invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Unauthorized');
      expect(responseData.message).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully for authenticated user', async () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'STUDENT' as const,
        emailVerified: true
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser as any);
      const token = app.jwt.sign({ userId: mockUser.id });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Đăng xuất thành công');
    });

    test('should return unauthorized for missing token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout'
      });

      expect(response.statusCode).toBe(401);
      const responseData = JSON.parse(response.body);
      expect(responseData.error).toBe('Unauthorized');
      expect(responseData.message).toBe('Invalid token');
    });
  });
}); 