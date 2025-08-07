import { z } from 'zod';

/**
 * Common JSON Schemas for API responses.
 * These schemas are registered globally with Fastify using fastify.addSchema()
 * and can be referenced using $ref in route schemas.
 */

// --- Error Response Schema ---
export const errorResponseSchema = {
  $id: 'ErrorResponse', // Unique ID for referencing
  type: 'object',
  properties: {
    code: { type: 'number', description: 'HTTP status code of the error', example: 400 },
    message: { type: 'string', description: 'A general, human-readable error message', example: 'Invalid input provided' },
    errors: {
      type: 'array',
      description: 'An array of specific error details, typically for validation errors.',
      items: {
        type: 'object',
        properties: {
          locationType: {
            type: 'string',
            enum: ['body', 'query', 'params', 'header'],
            description: 'The location or part of the request that caused the error.',
            example: 'body'
          },
          location: {
            type: 'string',
            description: 'The specific location of the error (e.g., field name, parameter name, header name).',
            example: 'email'
          },
          message: {
            type: 'string',
            description: 'The specific error message for this location.',
            example: 'Email format is invalid'
          }
        },
        required: ['locationType', 'location', 'message']
      }
    }
  },
  required: ['code', 'message', 'errors']
};

/**
 * Schema for validating a UUID parameter.
 */
export const UserIdParamSchema = z.object({
  id: z.string().cuid('Invalid CUID format for user ID'),
});

export const UserIdParamJsonSchema = {
  $id: 'UserIdParam',
  type: 'object',
  properties: {
    id: { type: 'string', description: 'User ID (CUID)' }
  },
  required: ['id']
};

// --- Success Response Schemas ---

// For responses that return a single object directly
export const singleObjectResponseSchema = {
  $id: 'SingleObjectResponse',
  type: 'object',
  description: 'A generic schema for successful responses returning a single object directly.',
  // Properties will be defined by the specific route's data schema
};

// For responses that return a list of items
export const listResponseSchema = {
  $id: 'ListResponse',
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'An array containing the list of objects.',
      // items property will be defined by the specific route's data schema
    }
  },
  required: ['items']
};
