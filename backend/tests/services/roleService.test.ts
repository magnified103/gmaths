import { prisma } from '../../src/utils/db';
import {
  getAllRoles,
  getRoleBySlug,
  createRole,
  updateRole,
  deleteRole,
} from '../../src/services/roleService';
import { seed as dbseed } from '../../prisma/seed';
import { ServiceError } from '../../src/utils/errors';

describe('Role Service', () => {
  beforeEach(async () => {
    // Clear the database and re-seed for a clean slate before each test
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await dbseed(prisma);
  });

  describe('getAllRoles', () => {
    test('should return all roles with their permissions', async () => {
      const roles = await getAllRoles();
      expect(roles).toBeInstanceOf(Array);
      expect(roles.length).toBeGreaterThan(0); // Assuming seed creates some roles

      const studentRole = roles.find(role => role.slug === 'student');
      expect(studentRole).toBeDefined();
      expect(studentRole?.permissions).toBeInstanceOf(Array);
    });

    test('should return an empty array if no roles exist', async () => {
      await prisma.role.deleteMany(); // Clear all roles
      const roles = await getAllRoles();
      expect(roles).toEqual([]);
    });
  });

  describe('getRoleBySlug', () => {
    test('should return a role by its slug', async () => {
      const role = await getRoleBySlug('staff');
      expect(role).toBeDefined();
      expect(role?.slug).toBe('staff');
      expect(role?.name).toBe('Staff');
      expect(role?.permissions).toBeInstanceOf(Array);
    });

    test('should return null if role not found', async () => {
      const role = await getRoleBySlug('nonexistent-role');
      expect(role).toBeNull();
    });
  });

  describe('createRole', () => {
    test('should create a new role successfully', async () => {
      const newRoleData = {
        slug: 'editor',
        name: 'Editor',
        description: 'Can edit content',
        permissions: ['User:Create', 'User:Update'],
      };

      const createdRole = await createRole(newRoleData);
      expect(createdRole).toBeDefined();
      expect(createdRole.slug).toBe(newRoleData.slug);
      expect(createdRole.name).toBe(newRoleData.name);
      expect(createdRole.description).toBe(newRoleData.description);
      expect(createdRole.permissions).toEqual(expect.arrayContaining(newRoleData.permissions));

      const fetchedRole = await getRoleBySlug('editor');
      expect(fetchedRole).toEqual(createdRole);
    });

    test('should throw ServiceError if role with slug already exists', async () => {
      const existingRoleData = {
        slug: 'student',
        name: 'Student',
      };

      await expect(createRole(existingRoleData)).rejects.toThrow(ServiceError);
      await expect(createRole(existingRoleData)).rejects.toThrow('Role with this slug already exists');
    });

    test('should create a role without permissions', async () => {
      const newRoleData = {
        slug: 'viewer',
        name: 'Viewer',
      };

      const createdRole = await createRole(newRoleData);
      expect(createdRole).toBeDefined();
      expect(createdRole.slug).toBe(newRoleData.slug);
      expect(createdRole.permissions).toEqual([]);
    });
  });

  describe('updateRole', () => {
    test('should update an existing role successfully', async () => {
      const updateData = {
        name: 'Super Admin',
        description: 'Full control over the system',
        permissions: ['User:Read', 'User:Create', 'User:Update'],
      };

      const updatedRole = await updateRole('superuser', updateData);
      expect(updatedRole).toBeDefined();
      expect(updatedRole?.slug).toBe('superuser');
      expect(updatedRole?.name).toBe(updateData.name);
      expect(updatedRole?.description).toBe(updateData.description);
      expect(updatedRole?.permissions).toEqual(expect.arrayContaining(updateData.permissions));

      const fetchedRole = await getRoleBySlug('superuser');
      expect(fetchedRole).toEqual(updatedRole);
    });

    test('should return null if role to update not found', async () => {
      const updateData = { name: 'Non Existent' };
      const updatedRole = await updateRole('nonexistent-role', updateData);
      expect(updatedRole).toBeNull();
    });

    test('should update only specified fields', async () => {
      const initialRole = await createRole({ slug: 'temp-role', name: 'Temp Role', description: 'Initial desc' });
      const updateData = { name: 'Updated Temp Role' };

      const updatedRole = await updateRole('temp-role', updateData);
      expect(updatedRole?.name).toBe(updateData.name);
      expect(updatedRole?.description).toBe(initialRole.description); // Description should remain unchanged
    });

    test('should remove all permissions if empty array is provided', async () => {
      const updatedRole = await updateRole('staff', { permissions: [] });
      expect(updatedRole?.permissions).toEqual([]);
    });
  });

  describe('deleteRole', () => {
    test('should delete an existing role successfully', async () => {
      // Create a role to delete
      await createRole({ slug: 'deletable-role', name: 'Deletable Role' });

      const deleted = await deleteRole('deletable-role');
      expect(deleted).toBe(true);

      const fetchedRole = await getRoleBySlug('deletable-role');
      expect(fetchedRole).toBeNull();
    });

    test('should return false if role to delete not found', async () => {
      const deleted = await deleteRole('nonexistent-role');
      expect(deleted).toBe(false);
    });
  });
});
