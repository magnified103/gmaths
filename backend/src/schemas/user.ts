import { z } from 'zod';
import { FromSchema } from "json-schema-to-ts";

/**
 * JSON Schema for the User object.
 * This schema is registered globally with Fastify using fastify.addSchema()
 * and can be referenced using $ref in route schemas.
 */
export const userSchema = {
  $id: 'User', // Unique ID for referencing
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Unique identifier of the user' },
    username: { type: 'string', description: 'User\'s unique username' },
    email: { type: 'string', format: 'email', description: 'User\'s email address' },
    emailVerified: { type: 'boolean', description: 'Whether the user\'s email has been verified' },
    roles: {
      type: 'array',
      items: { type: 'string' },
      description: 'The slugs of roles assigned to the user.'
    },
    createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was created' },
    updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was last updated' },
    lastLoginAt: { type: 'string', format: 'date-time', nullable: true, description: 'Timestamp of the user\'s last login' }
  },
  required: ['id', 'username', 'email', 'emailVerified', 'roles']
} as const;

export type User = FromSchema<typeof userSchema>;

/**
 * User creation schema for admin use (allows role specification)
 */
export const adminUserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  roleName: z.string(),
});

/**
 * User update schema for admin use
 */
export const adminUserUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  roleNames: z.array(z.string()).optional(),
  emailVerified: z.boolean().optional(),
});

/**
 * User filters and pagination schema
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  emailVerified: z.enum(['all', 'verified', 'unverified']).default('all'),
  sortBy: z.enum(['username', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => Math.min(parseInt(val, 10), 100)).default('20'),
});
