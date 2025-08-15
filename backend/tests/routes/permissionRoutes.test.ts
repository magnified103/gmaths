import Fastify, { FastifyInstance } from 'fastify';
import serviceApp from '../../src/app';
import { prisma } from '../../src/utils/db';
import jwt from '@fastify/jwt'; // Import jwt for signing tokens

let app: FastifyInstance;
let adminToken: string;
let superuserToken: string;

beforeAll(async () => {
  app = Fastify();
  app.register(jwt, { secret: 'a-very-secret-key-for-tests' }); // Register JWT for testing
  await app.register(serviceApp);
  await app.ready(); // Ensure all plugins and routes are loaded

  // Clear and seed the database for testing
  await prisma.$transaction([
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create permissions
  await prisma.permission.createMany({
    data: [
      { code: 'Permission:Read', description: 'Read permissions' },
      { code: 'Role:Manage', description: 'Manage roles' },
      { code: 'User:Manage', description: 'Manage users' },
    ],
  });

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      slug: 'admin',
      name: 'Admin',
      permissions: {
        connect: [{ code: 'Permission:Read' }, { code: 'Role:Manage' }],
      },
    },
  });

  const superuserRole = await prisma.role.create({
    data: {
      slug: 'superuser',
      name: 'Superuser',
    },
  });

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
      roles: {
        connect: { id: adminRole.id },
      },
    },
  });

  const superuser = await prisma.user.create({
    data: {
      username: 'superuser',
      email: 'super@example.com',
      password: 'password123',
      roles: {
        connect: { id: superuserRole.id },
      },
    },
  });

  adminToken = app.jwt.sign({ userId: adminUser.id });
  superuserToken = app.jwt.sign({ userId: superuser.id });
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('GET /api/permissions', () => {
  it('should return all permissions for a user with Permission:Read', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(3); // At least the seeded permissions
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'Permission:Read' }),
        expect.objectContaining({ code: 'Role:Manage' }),
        expect.objectContaining({ code: 'User:Manage' }),
      ])
    );
    expect(body.totalItems).toBe(body.items.length);
  });

  it('should return all permissions for a superuser', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      headers: {
        authorization: `Bearer ${superuserToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(3); // At least the seeded permissions
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'Permission:Read' }),
        expect.objectContaining({ code: 'Role:Manage' }),
        expect.objectContaining({ code: 'User:Manage' }),
      ])
    );
    expect(body.totalItems).toBe(body.items.length);
  });

  it('should return 401 if no token is provided', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
        code: 401,
        message: 'Invalid token',
        errors: [],
    });
  });

  it('should return 403 if user does not have Permission:Read', async () => {
    // Create a user without Permission:Read
    const studentRole = await prisma.role.create({
      data: {
        slug: 'student',
        name: 'Student',
      },
    });
    const studentUser = await prisma.user.create({
      data: {
        username: 'studentuser',
        email: 'student@example.com',
        password: 'password123',
        roles: {
          connect: { id: studentRole.id },
        },
      },
    });
    const studentToken = app.jwt.sign({ userId: studentUser.id });

    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      headers: {
        authorization: `Bearer ${studentToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
        code: 403,
        message: 'Access denied',
        errors: [],
    });
  });
});
