import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, User, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
  token: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt with salt rounds.
 * @param password - Plain text password to hash.
 * @returns Promise resolving to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password.
 * @param password - Plain text password.
 * @param hashedPassword - Hashed password from database.
 * @returns Promise resolving to true if passwords match.
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for authenticated user.
 * @param user - User data for token payload.
 * @returns JWT token string.
 */
export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    issuer: 'gmaths-backend',
    audience: 'gmaths-frontend'
  });
}

/**
 * Verify and decode a JWT token.
 * @param token - JWT token to verify.
 * @returns Decoded token payload or null if invalid.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    const decoded = jwt.verify(token, secret, {
      issuer: 'gmaths-backend',
      audience: 'gmaths-frontend'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a secure random token for email verification or password reset.
 * @returns 32-byte random token as hex string.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user with email verification.
 * @param data - User registration data.
 * @returns Promise resolving to user data and token.
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { username: data.username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new Error('Email đã được sử dụng');
    }
    if (existingUser.username === data.username) {
      throw new Error('Tên đăng nhập đã được sử dụng');
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);
  const emailVerificationToken = generateSecureToken();

  // Create user
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      emailVerificationToken
    }
  });

  // Generate JWT token
  const token = generateToken(user);

  // TODO: Send email verification email
  // This will be implemented when email service is added

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    },
    token
  };
}

/**
 * Authenticate user login.
 * @param data - Login credentials.
 * @returns Promise resolving to user data and token.
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  // Verify password
  const isValidPassword = await comparePassword(data.password, user.password);
  if (!isValidPassword) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate JWT token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    },
    token
  };
}

/**
 * Verify email using verification token.
 * @param token - Email verification token.
 * @returns Promise resolving to success status.
 */
export async function verifyEmail(token: string): Promise<{ success: boolean }> {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    throw new Error('Token xác thực email không hợp lệ');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null
    }
  });

  return { success: true };
}

/**
 * Request password reset by email.
 * @param email - User email address.
 * @returns Promise resolving to success status.
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Return success even if user doesn't exist for security
    return { success: true };
  }

  const resetToken = generateSecureToken();
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    }
  });

  // TODO: Send password reset email
  // This will be implemented when email service is added

  return { success: true };
}

/**
 * Reset password using reset token.
 * @param token - Password reset token.
 * @param newPassword - New password.
 * @returns Promise resolving to success status.
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  return { success: true };
}

/**
 * Get user by ID.
 * @param userId - User ID.
 * @returns Promise resolving to user data or null.
 */
export async function getUserById(userId: string): Promise<Pick<User, 'id' | 'username' | 'email' | 'role' | 'emailVerified'> | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      emailVerified: true
    }
  });

  return user;
} 