import { prisma } from '../../src/utils/db';
import {
  createUser,
  getUserList,
  updateUser,
  deleteUser,
} from '../../src/services/authService';
import { UserFilters } from '../../src/schemas/user';
import { seed as dbseed } from '../../prisma/seed';
// No need to import PrismaClientKnownRequestError anymore as updateUser now returns null

describe('Admin Service Functions (from authService)', () => {
  beforeEach(async () => {
    // Clear User and Role tables before each test
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await dbseed(prisma); // Re-seed roles and other necessary data
  });

  describe('createUser', () => {
    test('should create a new user with a specified role successfully', async () => {
      const username = 'adminuser1';
      const email = 'adminuser1@example.com';
      const password = 'AdminPassword123!';
      const roleName = 'student'; // Changed to an existing role

      const user: any = await createUser(username, email, password, roleName); // Cast to any

      expect(user).toBeDefined();
      expect(user.username).toBe(username);
      expect(user.email).toBe(email);
      expect(user.roles.some((role: any) => role.slug === roleName)).toBe(true);

      const fetchedUser: any = await prisma.user.findUnique({ // Cast to any
        where: { id: user.id },
        include: { roles: true },
      });
      expect(fetchedUser).toBeDefined();
      expect(fetchedUser?.username).toBe(username);
      expect(fetchedUser?.roles.some((role: any) => role.slug === roleName)).toBe(true);
    });

    test('should throw error for duplicate email when creating user', async () => {
      const username = 'adminuser2';
      const email = 'duplicate@example.com';
      const password = 'Password123!';
      const roleName = 'student';

      await createUser(username, email, password, roleName);

      await expect(createUser('anotheruser', email, 'AnotherPass123!', 'student'))
        .rejects.toThrow('Email đã được sử dụng');
    });

    test('should throw error for duplicate username when creating user', async () => {
      const username = 'duplicateusername';
      const email = 'adminuser3@example.com';
      const password = 'Password123!';
      const roleName = 'student';

      await createUser(username, email, password, roleName);

      await expect(createUser(username, 'anotheremail@example.com', 'AnotherPass123!', 'student'))
        .rejects.toThrow('Tên đăng nhập đã được sử dụng');
    });
  });

  describe('getUserList', () => {
    test('should return a paginated list of users', async () => {
      // Create some test users
      await createUser('userA', 'userA@example.com', 'Password123!', 'student');
      await createUser('userB', 'userB@example.com', 'Password123!', 'superuser'); // Changed to an existing role
      await createUser('userC', 'userC@example.com', 'Password123!', 'student');

      const filters = {
        page: 1,
        limit: 2,
        emailVerified: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters; // Explicitly cast to UserFilters

      const result = await getUserList(filters);

      expect(result.items.length).toBe(2);
      expect(result.pageIndex).toBe(1);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.items[0].username).toBe('userC'); // Assuming desc order by createdAt
    });

    test('should filter users by username search', async () => {
      await createUser('john.doe', 'john@example.com', 'Password123!', 'student');
      await createUser('jane.doe', 'jane@example.com', 'Password123!', 'superuser'); // Changed to an existing role
      await createUser('peter.pan', 'peter@example.com', 'Password123!', 'student');

      const filters = {
        search: 'john',
        page: 1,
        limit: 10,
        emailVerified: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters; // Explicitly cast to UserFilters

      const result = await getUserList(filters);

      expect(result.items.length).toBe(1);
      expect(result.items[0].username).toBe('john.doe');
    });

    test('should filter users by email search', async () => {
      await createUser('user1', 'test1@example.com', 'Password123!', 'student');
      await createUser('user2', 'test2@example.com', 'Password123!', 'superuser'); // Changed to an existing role

      const filters = {
        search: 'test1',
        page: 1,
        limit: 10,
        emailVerified: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters; // Explicitly cast to UserFilters

      const result = await getUserList(filters);

      expect(result.items.length).toBe(1);
      expect(result.items[0].email).toBe('test1@example.com');
    });

    test('should filter users by role', async () => {
      await createUser('student1', 'student1@example.com', 'Password123!', 'student');
      await createUser('superuser1', 'superuser1@example.com', 'Password123!', 'superuser');
      await createUser('student2', 'student2@example.com', 'Password123!', 'student');

      const filters = {
        role: 'superuser', // Changed to slug
        page: 1,
        limit: 10,
        emailVerified: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters;

      const result = await getUserList(filters);

      expect(result.items.length).toBe(1);
      expect(result.items[0].username).toBe('superuser1');
      expect(result.items[0].roles).toContain('superuser');
    });

    test('should filter users by email verification status', async () => {
      const user1 = await createUser('verifiedUser', 'verified@example.com', 'Password123!', 'student');
      const user2 = await createUser('unverifiedUser', 'unverified@example.com', 'Password123!', 'student');

      // Manually set emailVerified for user1
      await prisma.user.update({
        where: { id: user1.id },
        data: { emailVerified: true }
      });

      const filtersVerified = {
        emailVerified: 'verified',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters; // Explicitly cast to UserFilters
      const resultVerified = await getUserList(filtersVerified);
      expect(resultVerified.items.length).toBe(1);
      expect(resultVerified.items[0].email).toBe('verified@example.com');

      const filtersUnverified = {
        emailVerified: 'unverified',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as UserFilters; // Explicitly cast to UserFilters
      const resultUnverified = await getUserList(filtersUnverified);
      expect(resultUnverified.items.length).toBe(1);
      expect(resultUnverified.items[0].email).toBe('unverified@example.com');
    });

    test('should sort users by username ascending', async () => {
      await createUser('zebra', 'zebra@example.com', 'Password123!', 'student');
      await createUser('apple', 'apple@example.com', 'Password123!', 'student');
      await createUser('banana', 'banana@example.com', 'Password123!', 'student');

      const filters = {
        sortBy: 'username',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
        emailVerified: 'all',
      } as UserFilters; // Explicitly cast to UserFilters

      const result = await getUserList(filters);

      expect(result.items.length).toBe(3);
      expect(result.items[0].username).toBe('apple');
      expect(result.items[1].username).toBe('banana');
      expect(result.items[2].username).toBe('zebra');
    });

    test('should sort users by email descending', async () => {
      await createUser('user1', 'c@example.com', 'Password123!', 'student');
      await createUser('user2', 'a@example.com', 'Password123!', 'student');
      await createUser('user3', 'b@example.com', 'Password123!', 'student');

      const filters = {
        sortBy: 'email',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
        emailVerified: 'all',
      } as UserFilters; // Explicitly cast to UserFilters

      const result = await getUserList(filters);

      expect(result.items.length).toBe(3);
      expect(result.items[0].email).toBe('c@example.com');
      expect(result.items[1].email).toBe('b@example.com');
      expect(result.items[2].email).toBe('a@example.com');
    });
  });

  describe('updateUser', () => {
    test('should update user details successfully', async () => {
      const user = await createUser('updateTestUser', 'update@example.com', 'Password123!', 'student');
      const updatedUsername = 'updatedUser';
      const updatedEmail = 'updated@example.com';
      const updatedEmailVerified = true;

      const updatedUser = await updateUser(user.id, {
        username: updatedUsername,
        email: updatedEmail,
        emailVerified: updatedEmailVerified,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.username).toBe(updatedUsername);
      expect(updatedUser?.email).toBe(updatedEmail);
      expect(updatedUser?.emailVerified).toBe(updatedEmailVerified);

      const fetchedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fetchedUser?.username).toBe(updatedUsername);
      expect(fetchedUser?.email).toBe(updatedEmail);
      expect(fetchedUser?.emailVerified).toBe(updatedEmailVerified);
    });

    test('should update user roles successfully', async () => {
      const user = await createUser('roleTestUser', 'role@example.com', 'Password123!', 'student');
      const newRoles = ['superuser']; // Changed to slug

      const updatedUser: any = await updateUser(user.id, { roleNames: newRoles });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.roles).toContain('superuser');
      expect(updatedUser?.roles).not.toContain('student');

      const fetchedUser: any = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: true },
      });
      expect(fetchedUser?.roles.some((role: any) => role.slug === 'superuser')).toBe(true);
    });

    test('should return null if user to update does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      const updatedUser = await updateUser(nonExistentId, { username: 'newname' });
      expect(updatedUser).toBeNull();
    });

    test('should throw error for duplicate email during update', async () => {
      await createUser('userA', 'emailA@example.com', 'Password123!', 'student');
      const userB = await createUser('userB', 'emailB@example.com', 'Password123!', 'student');

      await expect(updateUser(userB.id, { email: 'emailA@example.com' }))
        .rejects.toThrow('email is already in use.');
    });

    test('should throw error for duplicate username during update', async () => {
      await createUser('userX', 'emailX@example.com', 'Password123!', 'student');
      const userY = await createUser('userY', 'emailY@example.com', 'Password123!', 'student');

      await expect(updateUser(userY.id, { username: 'userX' }))
        .rejects.toThrow('username is already in use.');
    });
  });

  describe('deleteUser', () => {
    test('should delete a user successfully', async () => {
      const user = await createUser('deleteTestUser', 'delete@example.com', 'Password123!', 'student');

      const success = await deleteUser(user.id);
      expect(success).toBe(true);

      const fetchedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fetchedUser).toBeNull();
    });

    test('should return false if user to delete does not exist', async () => {
      const nonExistentId = 'non-existent-delete-id';
      const success = await deleteUser(nonExistentId);
      expect(success).toBe(false);
    });
  });
});
