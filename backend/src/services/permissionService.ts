import { prisma } from '../utils/db';
import { Permission } from '../schemas/permission';

/**
 * Check if a user has a specific permission.
 * @param userId - The ID of the user.
 * @param requiredPermission - An object containing the action and subject of the required permission.
 * @returns A boolean indicating whether the user has the required permission.
 */
export async function hasPermission(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) return false;

  for (const role of user.roles) {
    if (role.slug === 'superuser') {
      return true; // Superusers have all permissions
    }
    if (role.permissions.some(perm => perm.code === code)) {
      return true; // User has the required permission through a role
    }
  }
  return false;
}

/**
 * Get all permissions.
 * @returns A list of all permissions.
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const permissions = await prisma.permission.findMany({
    select: {
      code: true,
      description: true,
    },
  });
  return permissions;
}
