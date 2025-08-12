import { z } from 'zod';

/**
 * Zod schema for the Role object.
 */
export const roleSchema = z.object({
  slug: z.string().describe('Unique slug for the role (e.g., "admin", "student")'),
  name: z.string().describe('Display name of the role'),
  description: z.string().nullable().optional().describe('Description of the role'),
});

export type Role = z.infer<typeof roleSchema>;
