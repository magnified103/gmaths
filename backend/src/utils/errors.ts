import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

export class ServiceError extends Error {
  code: number;
  errors: { locationType: string | undefined; location: string | undefined; message: string }[];

  constructor(message: string, code: number = 500, errors: { locationType: string | undefined; location: string | undefined; message: string }[] = []) {
    super(message);
    this.code = code;
    this.errors = errors;
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export function globalErrorHandler(error: any, request: any, reply: any) {
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
}
