import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import {
  registerDataSchema,
  loginDataSchema,
  authResponseSchema,
} from '../schemas/auth';
import { userSchema } from '../schemas/user';
import {
  getUserById,
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from '../services/authService';
import {
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  PasswordResetRequestInput,
  PasswordResetInput,
  EmailVerificationInput
} from '../utils/validation';
import { requireLogin } from '../utils/authMiddleware';
import { handleRouteError, successResponse } from '../utils/errorHandler';

/**
 * Register authentication routes with Fastify instance.
 * @param fastify - Fastify application instance.
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // User registration
  app.post('/auth/register', {
    schema: {
      body: registerDataSchema,
      response: {
        201: userSchema, // Assuming register returns the created user
      },
      tags: ['Auth'],
      summary: 'Register a new user',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerDataSchema.parse(request.body);

      const userId = await registerUser(data);
      const user = await getUserById(userId); // Fetch the full user object

      return reply.status(201).send(user);
    } catch (error) {
      return handleRouteError(error, reply, 'User Registration');
    }
  });

  // User login
  app.post('/auth/login', {
    schema: {
      body: loginDataSchema,
      response: {
        200: authResponseSchema,
      },
      tags: ['Auth'],
      summary: 'Log in a user',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginDataSchema.parse(request.body);

      const user = await loginUser(data);
      const token = await reply.jwtSign({ userId: user.id });

      return reply.send({
        user: user,
        token,
      });
    } catch (error) {
      return handleRouteError(error, reply, 'User Login');
    }
  });

  // Password reset request
  app.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetRequestSchema.parse(request.body) as PasswordResetRequestInput;
      
      const result = await requestPasswordReset(data.email);

      return reply.send(result);
    } catch (error) {
      return handleRouteError(error, reply, 'Password Reset Request');
    }
  });

  // Password reset
  app.post('/auth/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = passwordResetSchema.parse(request.body) as PasswordResetInput;
      
      const result = await resetPassword(data.token, data.password);

      return reply.send(result);
    } catch (error) {
      return handleRouteError(error, reply, 'Password Reset');
    }
  });

  // Email verification
  app.post('/auth/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = emailVerificationSchema.parse(request.body) as EmailVerificationInput;
      
      const result = await verifyEmail(data.token);

      return reply.send(result);
    } catch (error) {
      return handleRouteError(error, reply, 'Email Verification');
    }
  });

  // Get current user (protected route)
  app.get('/auth/me', {
    preHandler: requireLogin,
    schema: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      description: 'Retrieves the profile information of the currently authenticated user.',
      response: {
        200: userSchema,
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = await getUserById(request.userId as string);
      return reply.send(user);
    } catch (error) {
      return handleRouteError(error, reply, 'Get Current User');
    }
  });

  // Logout (client-side token removal, but we can blacklist if needed later)
  app.post('/auth/logout', {
    preHandler: requireLogin,
    schema: {
      tags: ['Auth'],
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // For now, logout is handled client-side by removing the token
      // In the future, we could implement token blacklisting with Redis
      
      return reply.send({});
    } catch (error) {
      return handleRouteError(error, reply, 'User Logout');
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
  
   reply.send(error);
  });
}
