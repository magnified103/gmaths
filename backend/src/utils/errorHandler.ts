import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
	getReasonPhrase,
} from 'http-status-codes';

export class CustomError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.error = getReasonPhrase(statusCode);
    this.statusCode = statusCode;
  }
}

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Format Zod validation errors for Vietnamese error responses.
 * @param error - Zod validation error.
 * @returns Formatted error object.
 */
export function formatValidationError(error: ZodError): ErrorResponse {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return {
    error: 'Validation Error',
    message: 'Dữ liệu đầu vào không hợp lệ',
    statusCode: 400,
    details: errors
  };
}

/**
 * Centralized error handler for consistent error responses across routes.
 * @param error - Error object.
 * @param reply - Fastify reply object.
 * @param context - Optional context for logging.
 */
export function handleRouteError(error: any, reply: FastifyReply, context?: string): FastifyReply {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedError = formatValidationError(error);
    return reply.status(400).send(formattedError);
  }

  if (error instanceof CustomError) {
    // Handle Fastify specific errors
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode
    });
  }

  // Check for custom status code first
  if (error instanceof Error && (error as any).statusCode) {
    const statusCode = (error as any).statusCode;
    const errorType = statusCode === 404 ? 'Not Found' :
                     statusCode === 409 ? 'Conflict Error' :
                     statusCode === 400 ? 'Bad Request' :
                     statusCode === 401 ? 'Unauthorized' :
                     statusCode === 403 ? 'Forbidden' :
                     'Error';
    
    return reply.status(statusCode).send({
      error: errorType,
      message: error.message,
      statusCode
    });
  }

  // Handle known application errors with Vietnamese messages
  if (error instanceof Error && error.message) {
    const knownErrors = [
      { pattern: 'Email đã được sử dụng', status: 409 },
      { pattern: 'Tên đăng nhập đã được sử dụng', status: 409 },
      { pattern: 'already exists', status: 409 },
      { pattern: 'Email hoặc mật khẩu không đúng', status: 400 },
      { pattern: 'Token xác thực email không hợp lệ', status: 400 },
      { pattern: 'Token đặt lại mật khẩu không hợp lệ', status: 400 },
      { pattern: 'Không tìm thấy', status: 404 },
      { pattern: 'không tồn tại', status: 404 },
      { pattern: 'not found', status: 404 },
      { pattern: 'Not found', status: 404 }
    ];

    for (const knownError of knownErrors) {
      if (error.message.includes(knownError.pattern)) {
        return reply.status(knownError.status).send({
          error: knownError.status === 409 ? 'Conflict Error' : 
                 knownError.status === 404 ? 'Not Found' : 'Bad Request',
          message: error.message,
          statusCode: knownError.status
        });
      }
    }
  }

  // Log error for debugging (only for unexpected errors)
  if (context) {
    console.error(`${context}:`, error);
  }

  // Default to internal server error
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Đã xảy ra lỗi hệ thống',
    statusCode: 500
  });
}

/**
 * Success response helper for consistent success responses.
 * @param data - Response data.
 * @param message - Success message in Vietnamese.
 * @param statusCode - HTTP status code (default: 200).
 */
export function successResponse(data: any, message: string, statusCode: number = 200) {
  return {
    success: true,
    message,
    data,
    statusCode
  };
} 