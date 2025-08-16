import { z } from 'zod';

/**
 * Zod schema for the User object.
 */
export const userSchema = z.object({
  id: z.string().cuid2().describe('Unique identifier of the user'),
  username: z.string().describe('User\'s unique username'),
  email: z.string().email().describe('User\'s email address'),
  emailVerified: z.boolean().describe('Whether the user\'s email has been verified'),
  roles: z.array(z.string()).describe('The slugs of roles assigned to the user.'),
  allPermissions: z.array(z.string()).describe('All permissions the user has, derived from their roles.'),
  createdAt: z.string().datetime().describe('Timestamp when the user was created').optional(),
  updatedAt: z.string().datetime().describe('Timestamp when the user was last updated').optional(),
  lastLoginAt: z.string().datetime().nullable().describe('Timestamp of the user\'s last login').optional(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Zod schema for user creation data (admin use, allows role specification).
 */
export const adminUserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.string()),
});

export type AdminUserCreateData = z.infer<typeof adminUserCreateSchema>;

/**
 * Zod schema for user update data (admin use).
 */
export const adminUserUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.string()).optional(),
  emailVerified: z.boolean().optional(),
});

export type AdminUserUpdateData = z.infer<typeof adminUserUpdateSchema>;

/**
 * Zod schema for user filters and pagination.
 */
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  emailVerified: z.enum(['all', 'verified', 'unverified']).default('all'),
  sortBy: z.enum(['username', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().default(1),             // TODO: should we use coerce here?
  limit: z.coerce.number().max(100).default(20),
});

export type UserFilters = z.infer<typeof userFiltersSchema>;

/**
 * Zod schema for user list response.
 */
export const userListResponseSchema = z.object({
  items: z.array(userSchema),
  pageIndex: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number().nullable(),
  totalItems: z.number().nullable(),
});

export type UserListResponse = z.infer<typeof userListResponseSchema>;
