import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
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
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from '../services/authService';
import { authenticateToken } from '../utils/authMiddleware';

/**
 * Format Zod validation errors for Vietnamese error responses.
 * @param error - Zod validation error.
 * @returns Formatted error object.
 */
function formatValidationError(error: ZodError) {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return {
    error: 'Validation Error',
    message: 'Dữ liệu đầu vào không hợp lệ',
    details: errors,
    statusCode: 400
  };
}

/**
 * Generic error handler for authentication routes.
 * @param error - Error object.
 * @param reply - Fastify reply object.
 */
function handleError(error: any, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send(formatValidationError(error));
  }

  // Known application errors (from services)
  if (error.message && typeof error.message === 'string') {
    const vietnameseErrors = [
      'Email đã được sử dụng',
      'Tên đăng nhập đã được sử dụng',
      'Email hoặc mật khẩu không đúng',
      'Token xác thực email không hợp lệ',
      'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
    ];

    if (vietnameseErrors.some(msg => error.message.includes(msg))) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message,
        statusCode: 400
      });
    }
  }

  // Unknown errors
  console.error('Authentication error:', error);
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Đã xảy ra lỗi hệ thống',
    statusCode: 500
  });
}

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

      return reply.status(201).send({
        success: true,
        message: 'Đăng ký thành công',
        data: result
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // User login
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body) as LoginInput;
      
      const result = await loginUser(data);

      return reply.send({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Password reset request
  fastify.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetRequestSchema.parse(request.body) as PasswordResetRequestInput;
      
      const result = await requestPasswordReset(data.email);

      return reply.send({
        success: true,
        message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi',
        data: result
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Password reset
  fastify.post('/auth/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetSchema.parse(request.body) as PasswordResetInput;
      
      const result = await resetPassword(data.token, data.password);

      return reply.send({
        success: true,
        message: 'Mật khẩu đã được đặt lại thành công',
        data: result
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Email verification
  fastify.post('/auth/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = emailVerificationSchema.parse(request.body) as EmailVerificationInput;
      
      const result = await verifyEmail(data.token);

      return reply.send({
        success: true,
        message: 'Email đã được xác thực thành công',
        data: result
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get current user (protected route)
  fastify.get('/auth/me', {
    preHandler: authenticateToken
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Yêu cầu đăng nhập',
          statusCode: 401
        });
      }

      return reply.send({
        success: true,
        message: 'Thông tin người dùng',
        data: {
          user: request.user
        }
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Logout (client-side token removal, but we can blacklist if needed later)
  fastify.post('/auth/logout', {
    preHandler: authenticateToken
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // For now, logout is handled client-side by removing the token
      // In the future, we could implement token blacklisting with Redis
      
      return reply.send({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });
} 