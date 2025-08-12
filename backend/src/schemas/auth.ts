import { z } from 'zod';
import { userSchema } from './user';

/**
 * Zod schema for authentication response.
 */
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Zod schema for user registration data.
 */
export const registerDataSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterData = z.infer<typeof registerDataSchema>;

/**
 * Zod schema for user login data.
 */
export const loginDataSchema = z.object({
  email: z.email(),
  password: z.string(),
}).meta({
  examples: [
    {
      email: 'admin@gmaths.edu.vn',
      password: 'Admin@2024!'
    }
  ]
});

export type LoginData = z.infer<typeof loginDataSchema>;
