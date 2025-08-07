import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  RegisterInput,
  LoginInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  EmailVerificationInput
} from '../utils/validation';
import { userSchema } from '../schemas/user';
import { loginJsonSchema } from '../schemas/auth';
import {
  getUserById,
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from '../services/authService';
import { requireLogin } from '../utils/authMiddleware';
import { handleRouteError, successResponse } from '../utils/errorHandler';

/**
 * Register authentication routes with Fastify instance.
 * @param fastify - Fastify application instance.
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // User registration
  fastify.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerSchema.parse(request.body) as RegisterInput;
      
      const result = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password
      });

      return reply.status(201).send(successResponse(result, 'Đăng ký thành công', 201));
    } catch (error) {
      return handleRouteError(error, reply, 'User Registration');
    }
  });

  // User login
  fastify.post('/auth/login', {
    schema: {
      body: loginJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: userSchema,
            token: { type: 'string' }
          },
          required: ['user', 'token']
        }
      },
      tags: ['Auth'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body) as LoginInput;

      const user = await loginUser(data);
      const token = await reply.jwtSign({ userId: user.id });

      return reply.send(successResponse({
        user: user,
        token,
      }, 'Đăng nhập thành công'));
    } catch (error) {
      return handleRouteError(error, reply, 'User Login');
    }
  });

  // Password reset request
  fastify.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetRequestSchema.parse(request.body) as PasswordResetRequestInput;
      
      const result = await requestPasswordReset(data.email);

      return reply.send(successResponse(result, 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi'));
    } catch (error) {
      return handleRouteError(error, reply, 'Password Reset Request');
    }
  });

  // Password reset
  fastify.post('/auth/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetSchema.parse(request.body) as PasswordResetInput;
      
      const result = await resetPassword(data.token, data.password);

      return reply.send(successResponse(result, 'Mật khẩu đã được đặt lại thành công'));
    } catch (error) {
      return handleRouteError(error, reply, 'Password Reset');
    }
  });

  // Email verification
  fastify.post('/auth/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = emailVerificationSchema.parse(request.body) as EmailVerificationInput;
      
      const result = await verifyEmail(data.token);

      return reply.send(successResponse(result, 'Email đã được xác thực thành công'));
    } catch (error) {
      return handleRouteError(error, reply, 'Email Verification');
    }
  });

  // Get current user (protected route)
  fastify.get('/auth/me', {
    preHandler: requireLogin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = await getUserById(request.userId as string);
      return reply.send(successResponse({ user }, 'Thông tin người dùng'));
    } catch (error) {
      return handleRouteError(error, reply, 'Get Current User');
    }
  });

  // Logout (client-side token removal, but we can blacklist if needed later)
  fastify.post('/auth/logout', {
    preHandler: requireLogin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // For now, logout is handled client-side by removing the token
      // In the future, we could implement token blacklisting with Redis
      
      return reply.send(successResponse({}, 'Đăng xuất thành công'));
    } catch (error) {
      return handleRouteError(error, reply, 'User Logout');
    }
  });
}
