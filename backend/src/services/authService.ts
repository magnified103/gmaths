import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../schemas/user';
import { RegisterData, LoginData } from '../schemas/auth'; // Import Zod types
import { prisma } from '../utils/db';
import { checkUserExists, throwIfUserExists } from '../utils/userHelpers';

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
 * Generate a secure random token for email verification or password reset.
 * @returns 32-byte random token as hex string.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user with email verification.
 * All new registrations are assigned STUDENT role for security.
 * @param data - User registration data.
 * @returns Promise resolving to user data and token.
 */
export async function registerUser(data: RegisterData): Promise<string> {
  // Check if user already exists using centralized helper
  const existenceCheck = await checkUserExists(data.email, data.username);
  throwIfUserExists(existenceCheck);

  // Hash password
  const hashedPassword = await hashPassword(data.password);
  const emailVerificationToken = generateSecureToken();

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      emailVerificationToken,
      roles: {
        connect: [
          { slug: 'student' }
        ]
      }
    },
    include: {
      roles: true
    }
  });

  return user.id;
}

/**
 * Authenticate user login.
 * @param data - Login credentials.
 * @returns Promise resolving to user data and token.
 */
export async function loginUser(data: LoginData): Promise<User> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      roles: true,
    },
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

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles.map(role => role.slug),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  }
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
export async function getUserById(userId: string): Promise<User | null> {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });
  if (!result) return null;
  return {
    id: result.id,
    username: result.username,
    email: result.email,
    emailVerified: result.emailVerified,
    roles: result.roles.map(role => role.slug),
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    lastLoginAt: result.lastLoginAt ? result.lastLoginAt.toISOString() : null,
  }
}

/**
 * Create a new user with specified role (admin function).
 * @param username - Username.
 * @param email - Email address.
 * @param password - Password.
 * @param role - User role.
 * @returns Promise resolving to created user data.
 */
export async function createUser(
  username: string,
  email: string,
  password: string,
  roles: string[],
): Promise<User> {
  const existenceCheck = await checkUserExists(email, username);
  throwIfUserExists(existenceCheck);

  const hashedPassword = await hashPassword(password);
  const emailVerificationToken = generateSecureToken();

  const result = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      emailVerificationToken,
      roles: {
        connect: roles.map(role => ({ slug: role }))
      },
    },
    include: {
      roles: true,
    },
  });

  return {
    id: result.id,
    username: result.username,
    email: result.email,
    emailVerified: result.emailVerified,
    roles: result.roles.map(role => role.slug),
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    lastLoginAt: result.lastLoginAt ? result.lastLoginAt.toISOString() : null,
  }
}

import { UserFilters, UserListResponse, AdminUserUpdateData } from '../schemas/user'; // Import Zod types

/**
 * Get paginated list of users with filtering (admin function).
 * @param filters - Filter and pagination options.
 * @returns Promise resolving to paginated user list.
 */
export async function getUserList(filters: UserFilters): Promise<UserListResponse> {
  const { search, role, emailVerified, sortBy, sortOrder, page, limit } = filters;

  // Build where clause
  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Role filter
  if (role && role !== 'all') {
    where.roles = {
      some: {
        slug: role, // Changed from name to slug
      },
    };
  }

  // Email verification filter
  if (emailVerified && emailVerified !== 'all') {
    where.emailVerified = emailVerified === 'verified';
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users with pagination
  const users = await prisma.user.findMany({
    where,
    include: {
      roles: true,
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    items: users.map(user => ({
      ...user,
      roles: user.roles.map(role => role.slug),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    })),
    pageIndex: page,
    itemsPerPage: limit,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
}


/**
 * Update user data (admin function).
 * @param userId - User ID to update.
 * @param data - Update data.
 * @returns Promise resolving to updated user data or null if not found.
 */
export async function updateUser(
  userId: string,
  data: AdminUserUpdateData
): Promise<User | null> {
  if (data.email || data.username) {
    const existenceCheck = await checkUserExists(data.email || '', data.username || '', userId);
    if (existenceCheck.exists) {
      throw new Error(`${existenceCheck.conflictField} is already in use.`);
    }
  }

  const updateData: any = {};

  if (data.username !== undefined) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;

  if (data.roles) {
    const roles = await prisma.role.findMany({
      where: {
        slug: { in: data.roles }, // Changed from name to slug
      },
    });
    updateData.roles = {
      set: roles.map(role => ({ id: role.id })),
    };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: true,
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
      roles: updatedUser.roles.map(role => role.slug),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      lastLoginAt: updatedUser.lastLoginAt ? updatedUser.lastLoginAt.toISOString() : null,
    };
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      return null;
    }
    throw error;
  }
}

/**
 * Delete user by ID (admin function).
 * @param userId - User ID to delete.
 * @returns Promise resolving to success status.
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    return true;
  } catch (error) {
    // Handle case where user doesn't exist
    return false;
  }
}
