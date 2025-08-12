import { z } from 'zod';
import { userSchema } from './user';

/**
 * Zod schema for validating the user ID parameter in admin routes.
 */
export const adminUserParamsSchema = z.object({
  id: z.cuid2(),
});

/**
 * Zod schema for the response when listing multiple users in admin routes.
 * Adheres to the "List Response" format.
 */
export const adminUserListResponseSchema = z.object({
  items: z.array(userSchema),
});

/**
 * Zod schema for the response when retrieving, creating, or updating a single user in admin routes.
 * Adheres to the "Single Object Response" format.
 */
export const adminUserSingleResponseSchema = userSchema;

/**
 * Zod schema for the response after successfully deleting a user.
 * This can be an empty object for a 204 No Content, or a confirmation message.
 */
export const adminUserDeleteResponseSchema = z.object({
  message: z.string().describe('Confirmation message for successful deletion'),
});
