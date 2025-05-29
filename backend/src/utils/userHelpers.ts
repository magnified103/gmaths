import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Interface for user existence check result
 */
interface UserExistenceCheck {
  exists: boolean;
  conflictField?: 'email' | 'username';
  conflictValue?: string;
}

/**
 * Check if a user already exists with the given email or username.
 * @param email - Email to check.
 * @param username - Username to check.
 * @param excludeUserId - Optional user ID to exclude from check (for updates).
 * @returns Promise resolving to existence check result.
 */
export async function checkUserExists(
  email: string, 
  username: string, 
  excludeUserId?: string
): Promise<UserExistenceCheck> {
  const whereClause: any = {
    OR: [
      { email },
      { username }
    ]
  };

  // Exclude specific user ID for update operations
  if (excludeUserId) {
    whereClause.AND = [
      { id: { not: excludeUserId } }
    ];
  }

  const existingUser = await prisma.user.findFirst({
    where: whereClause
  });

  if (!existingUser) {
    return { exists: false };
  }

  // Determine which field conflicts
  if (existingUser.email === email) {
    return {
      exists: true,
      conflictField: 'email',
      conflictValue: email
    };
  }

  if (existingUser.username === username) {
    return {
      exists: true,
      conflictField: 'username',
      conflictValue: username
    };
  }

  return { exists: false };
}

/**
 * Throw appropriate error if user exists.
 * @param existenceCheck - Result from checkUserExists.
 */
export function throwIfUserExists(existenceCheck: UserExistenceCheck): void {
  if (!existenceCheck.exists) {
    return;
  }

  if (existenceCheck.conflictField === 'email') {
    throw new Error('Email đã được sử dụng');
  }

  if (existenceCheck.conflictField === 'username') {
    throw new Error('Tên đăng nhập đã được sử dụng');
  }
} 