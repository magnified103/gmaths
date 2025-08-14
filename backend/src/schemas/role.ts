import { z } from 'zod';

/**
 * Zod schema for the Role object.
 */
export const roleSchema = z.object({
  slug: z.string().describe('Unique slug for the role (e.g., "admin", "student")'),
  name: z.string().describe('Display name of the role'),
  description: z.string().nullable().optional().describe('Description of the role'),
  permissions: z.array(z.string()).optional().describe('List of permission codes associated with the role'),
});

export type Role = z.infer<typeof roleSchema>;

export const createRoleSchema = z.object({
  slug: z.string().min(1, 'Slug is required').describe('Unique slug for the role (e.g., "admin", "student")'),
  name: z.string().min(1, 'Name is required').describe('Display name of the role'),
  description: z.string().nullable().optional().describe('Description of the role'),
  permissions: z.array(z.string()).optional().describe('List of permission codes to assign to the role'),
});

export type CreateRoleData = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().describe('Display name of the role'),
  description: z.string().nullable().optional().describe('Description of the role'),
  permissions: z.array(z.string()).optional().describe('List of permission codes to assign to the role'),
});

export type UpdateRoleData = z.infer<typeof updateRoleSchema>;
