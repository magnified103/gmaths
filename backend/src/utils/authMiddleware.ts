import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, getUserById } from '../services/authService';
import { UserRole } from '@prisma/client';

// Extend FastifyRequest to include user data
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      email: string;
      role: UserRole;
      emailVerified: boolean;
    };
  }
}

/**
 * Extract JWT token from Authorization header.
 * @param request - Fastify request object.
 * @returns JWT token string or null if not found.
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Authentication middleware that verifies JWT token and loads user data.
 * @param request - Fastify request object.
 * @param reply - Fastify reply object.
 */
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token không được cung cấp',
        statusCode: 401
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token không hợp lệ',
        statusCode: 401
      });
    }

    // Load current user data
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Người dùng không tồn tại',
        statusCode: 401
      });
    }

    // Attach user to request object
    request.user = user;
  } catch (error) {
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Lỗi xác thực token',
      statusCode: 500
    });
  }
}

/**
 * Authorization middleware that checks if user has required role.
 * @param requiredRole - Minimum required user role.
 * @returns Middleware function.
 */
export function requireRole(requiredRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Ensure user is authenticated first
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Yêu cầu đăng nhập',
        statusCode: 401
      });
    }

    // Check if user has required role
    if (requiredRole === UserRole.ADMIN && request.user.role !== UserRole.ADMIN) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Không có quyền truy cập',
        statusCode: 403
      });
    }
  };
}

/**
 * Optional authentication middleware that loads user if token is present but doesn't require it.
 * @param request - Fastify request object.
 * @param reply - Fastify reply object.
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return; // No token provided, continue without user
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return; // Invalid token, continue without user
    }

    // Load current user data
    const user = await getUserById(decoded.userId);
    
    if (user) {
      request.user = user;
    }
  } catch (error) {
    // Ignore errors in optional auth, continue without user
  }
} 