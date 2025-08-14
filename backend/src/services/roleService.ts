import { prisma } from '../utils/db';
import { Role, CreateRoleData, UpdateRoleData } from '../schemas/role';
import { ServiceError } from '../utils/errors';

/**
 * Get all roles.
 * @returns Promise resolving to an array of Role objects.
 */
export async function getAllRoles(): Promise<Role[]> {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
    },
  });
  return roles.map(role => ({
    slug: role.slug,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(p => p.code),
  }));
}

/**
 * Get a role by its slug.
 * @param slug - The unique slug of the role.
 * @returns Promise resolving to the Role object or null if not found.
 */
export async function getRoleBySlug(slug: string): Promise<Role | null> {
  const role = await prisma.role.findUnique({
    where: { slug },
    include: {
      permissions: true,
    },
  });
  if (!role) return null;
  return {
    slug: role.slug,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(p => p.code),
  };
}

/**
 * Create a new role.
 * @param data - Role creation data (slug, name, description, permissions).
 * @returns Promise resolving to the newly created Role object.
 */
export async function createRole(data: CreateRoleData): Promise<Role> {
  const existingRole = await prisma.role.findUnique({ where: { slug: data.slug } });
  if (existingRole) {
    throw new ServiceError('Role with this slug already exists', 409);
  }

  const role = await prisma.role.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description,
      permissions: {
        connect: data.permissions?.map(code => ({ code })) || [],
      },
    },
    include: {
      permissions: true,
    },
  });
  return {
    slug: role.slug,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(p => p.code),
  };
}

/**
 * Update an existing role.
 * @param slug - The slug of the role to update.
 * @param data - Role update data (name, description, permissions).
 * @returns Promise resolving to the updated Role object or null if not found.
 */
export async function updateRole(slug: string, data: UpdateRoleData): Promise<Role | null> {
  const existingRole = await prisma.role.findUnique({ where: { slug } });
  if (!existingRole) {
    return null;
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (data.permissions !== undefined) {
    const permissions = await prisma.permission.findMany({
      where: {
        code: { in: data.permissions },
      },
    });
    updateData.permissions = {
      set: permissions.map(perm => ({ id: perm.id })),
    };
  }

  const updatedRole = await prisma.role.update({
    where: { slug },
    data: updateData,
    include: {
      permissions: true,
    },
  });
  return {
    slug: updatedRole.slug,
    name: updatedRole.name,
    description: updatedRole.description,
    permissions: updatedRole.permissions.map(p => p.code),
  };
}

/**
 * Delete a role by its slug.
 * @param slug - The slug of the role to delete.
 * @returns Promise resolving to true if deleted, false if not found.
 */
export async function deleteRole(slug: string): Promise<boolean> {
  try {
    await prisma.role.delete({
      where: { slug },
    });
    return true;
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      return false;
    }
    throw error;
  }
}
