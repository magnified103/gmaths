import { z } from 'zod';

/**
 * Common Zod Schemas for API responses.
 */

// --- Error Response Schema ---
export const errorResponseSchema = z.object({
  code: z.number().describe('HTTP status code'),
  message: z.string().describe('Human-readable error message'),
  errors: z.array(z.object({
    locationType: z.string().optional().describe('The type of location where the error occurred (e.g., "body", "query", "params", "header", "auth", "resource", "unknown")'),
    location: z.string().optional().describe('The specific field name, parameter name, header name, or identifier related to the error.'),
    message: z.string().describe('A specific, detailed error message for this particular issue.'),
  })).optional().describe('An array of specific error details, typically for validation errors.'),
}).describe('Standard error response format');

/**
 * Schema for validating a UUID parameter.
 */
export const UserIdParamSchema = z.object({
  id: z.string().cuid2(),
});

// --- Success Response Schemas ---

// For responses that return a single object directly
export const singleObjectResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => itemSchema;

// For responses that return a list of items
export const listResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    itemsPerPage: z.number().optional(), // Made optional
    pageIndex: z.number().optional(),    // Made optional
    totalPages: z.number().nullable().optional(), // Made optional
    totalItems: z.number().nullable().optional(), // Made optional
  }).describe('Standard paginated list response format');
