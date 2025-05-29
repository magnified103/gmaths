import { z } from 'zod';

/**
 * Password validation with Vietnamese error messages.
 * Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
 */
const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt');

/**
 * Username validation schema.
 */
const usernameSchema = z
  .string()
  .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
  .max(20, 'Tên đăng nhập không được quá 20 ký tự')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang');

/**
 * Email validation schema.
 */
const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .max(100, 'Email không được quá 100 ký tự');

/**
 * User registration validation schema.
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
});

/**
 * User login validation schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mật khẩu không được để trống')
});

/**
 * Password reset request validation schema.
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

/**
 * Password reset validation schema.
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token không được để trống'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
});

/**
 * Email verification validation schema.
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Token xác thực không được để trống')
});

/**
 * JWT token validation schema.
 */
export const tokenSchema = z.object({
  token: z.string().min(1, 'Token không được để trống')
});

/**
 * Type exports for use in route handlers.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type TokenInput = z.infer<typeof tokenSchema>; 